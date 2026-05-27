import {
  BybitKlineResponse,
  CandleData,
  KlineInterval,
  KlineParams,
  BYBIT_MAX_LIMIT,
} from './types';
import { SUPABASE_ANON_KEY, EDGE_API_KEY } from '@env';

const BASE_URL = 'https://api.bybit.com';
const KLINE_ENDPOINT = '/v5/market/kline';
const EDGE_FUNCTION_URL = 'https://dzqatxbgtjwazewzagvx.supabase.co/functions/v1/fetch-price-cache';

/**
 * Minimum delay between consecutive direct Bybit API requests (ms).
 * Only used as fallback when Edge Function is down.
 */
const THROTTLE_DELAY_MS = 500;

// Throttle State

let lastRequestTime = 0;

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

// ── Edge Function Client ────────────────────────────────

/**
 * Fetch kline data via Supabase Edge Function (cached proxy).
 * Returns null if the Edge Function is unreachable.
 */
async function fetchFromEdge(params: KlineParams): Promise<CandleData[] | null> {
  const query = new URLSearchParams({
    symbol: params.symbol,
    interval: params.interval,
    start: String(params.start ?? ''),
    end: String(params.end ?? ''),
    limit: String(params.limit ?? BYBIT_MAX_LIMIT),
    category: params.category ?? 'spot',
  });

  const response = await fetch(`${EDGE_FUNCTION_URL}?${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${EDGE_API_KEY}`,
    },
  });

  if (!response.ok) return null;

  const json = await response.json();
  const rawCandles = json?.data;

  if (!Array.isArray(rawCandles) || rawCandles.length === 0) return null;

  return rawCandles.map(parseCandle);
}

// ── Public API ──────────────────────────────────────────

export async function getKline(params: KlineParams): Promise<CandleData[]> {
  // ── Try Edge Function first (cached proxy) ────────
  try {
    const edgeResult = await fetchFromEdge(params);
    if (edgeResult && edgeResult.length > 0) {
      return edgeResult;
    }
  } catch {
    console.warn('[BybitApi] Edge Function failed, falling back to direct Bybit');
  }

  // ── Fallback: direct Bybit API ───────────────────
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
  candles.reverse(); // Bybit returns newest-first

  return candles;
}

/**
 * Fetch the latest ticker price for a symbol.
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
