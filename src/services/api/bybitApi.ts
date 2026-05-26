//  Bybit API Service
//  Handles all HTTP calls to Bybit v5 public endpoints.
//  Includes request throttling to respect rate limits.

import {
  BybitKlineResponse,
  CandleData,
  KlineInterval,
  KlineParams,
  BYBIT_MAX_LIMIT,
} from './types';

// Config

const BASE_URL = 'https://api.bybit.com';
const KLINE_ENDPOINT = '/v5/market/kline';

/**
 * Minimum delay between consecutive API requests (ms).
 * Bybit's public rate limit is ~120 req/min for market endpoints,
 * so 500ms (~120 req/min) provides a safe margin.
 */
const THROTTLE_DELAY_MS = 500;

// Throttle State

let lastRequestTime = 0;

/**
 * Wait until enough time has passed since the last request.
 * Simple serial throttle — sufficient for a mobile app where
 * requests are user-initiated and sequential.
 */
async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < THROTTLE_DELAY_MS) {
    await new Promise<void>(resolve => {
      setTimeout(() => resolve(), THROTTLE_DELAY_MS - elapsed);
    });
  }
  lastRequestTime = Date.now();
}

// Helpers

/**
 * Parse Bybit's raw string-array candle into a typed CandleData object.
 * Raw format: [startTime, open, high, low, close, volume, turnover]
 * All values are strings.
 */
function parseCandle(raw: string[]): CandleData {
  return {
    startTime: Number(raw[0]),
    open:      Number(raw[1]),
    high:      Number(raw[2]),
    low:       Number(raw[3]),
    close:     Number(raw[4]),
    volume:    Number(raw[5]),
    turnover:  Number(raw[6]),
  };
}

/**
 * Build a URL with query params, skipping undefined values.
 */
function buildUrl(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): string {
  const base = BASE_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const query = Object.entries(params)
    .filter(([, val]) => val !== undefined)
    .map(([key, val]) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`;
    })
    .join('&');
  return query ? `${base}${path}?${query}` : `${base}${path}`;
}

export async function getKline(params: KlineParams): Promise<CandleData[]> {
  await throttle();

  const url = buildUrl(KLINE_ENDPOINT, {
    category: params.category ?? 'spot',
    symbol:   params.symbol,
    interval: params.interval,
    start:    params.start,
    end:      params.end,
    limit:    params.limit ?? BYBIT_MAX_LIMIT,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Bybit API error: ${response.status} ${response.statusText}`,
    );
  }

  const json: BybitKlineResponse = await response.json();

  if (json.retCode !== 0) {
    throw new Error(`Bybit returned error: [${json.retCode}] ${json.retMsg}`);
  }

  const candles = (json.result.list ?? []).map(parseCandle);

  // Bybit returns newest-first; reverse to get chronological order
  candles.reverse();

  return candles;
}

/**
 * Fetch the latest ticker price for a symbol.
 *
 * Uses kline endpoint with interval='1' (1 min) and limit=1,
 * then returns the close price of the most recent candle.
 */
export async function getLatestPrice(
  symbol: string,
  category = 'spot',
): Promise<number | null> {
  try {
    const candles = await getKline({
      symbol,
      interval: '1',
      limit: 1,
      category,
    });
    return candles.length > 0 ? candles[candles.length - 1].close : null;
  } catch {
    return null;
  }
}

/**
 * Quick health-check: can we reach Bybit?
 * Useful for showing online/offline status in the UI.
 */
export async function pingBybit(): Promise<boolean> {
  try {
    const url = buildUrl(KLINE_ENDPOINT, {
      category: 'spot',
      symbol: 'BTCUSDT',
      interval: 'D',
      limit: 1,
    });
    const res = await fetch(url, { method: 'GET' });
    const json: BybitKlineResponse = await res.json();
    return json.retCode === 0;
  } catch {
    return false;
  }
}
