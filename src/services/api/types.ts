//  Bybit API Types — Shared across network & cache layers

/**
 * A single candlestick data point, parsed from Bybit's raw array format.
 */
export interface CandleData {
  startTime: number;   // Unix timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

/**
 * Raw response shape from Bybit v5 GET /v5/market/kline
 * Each element in `list` is a string array:
 * [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
 */
export interface BybitKlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    symbol: string;
    category: string;
    list: string[][];
  };
  time: number;
}

/**
 * Supported kline intervals on Bybit v5.
 * - Numeric values = minutes (1, 3, 5, 15, 30, 60, 120, 240, 360, 720)
 * - Letter values  = D (day), W (week), M (month)
 */
export type KlineInterval =
  | '1' | '3' | '5' | '15' | '30'
  | '60' | '120' | '240' | '360' | '720'
  | 'D' | 'W' | 'M';

/**
 * Parameters for fetching kline data.
 */
export interface KlineParams {
  symbol: string;           // e.g. 'BTCUSDT'
  interval: KlineInterval;
  start?: number;           // timestamp ms
  end?: number;             // timestamp ms
  limit?: number;           // 1–1000, default 200
  category?: string;        // 'spot' | 'linear' | 'inverse', default 'spot'
}

/**
 * Wrapper for cached data — includes metadata for TTL validation.
 */
export interface CachedData<T> {
  data: T;
  cachedAt: number;     // timestamp ms when data was saved
  ttl: number;          // time-to-live in ms
  version: number;      // cache schema version for migrations
}

/**
 * Map of supported asset tickers → Bybit trading pair symbols.
 */
export type SupportedAsset = 'BTC' | 'ETH' | 'SOL' | 'BNB' | 'ADA' | 'DOGE';

/**
 * Interval in milliseconds for each kline interval.
 * Used to calculate pagination chunks.
 */
export const INTERVAL_MS: Record<KlineInterval, number> = {
  '1':   60_000,
  '3':   180_000,
  '5':   300_000,
  '15':  900_000,
  '30':  1_800_000,
  '60':  3_600_000,
  '120': 7_200_000,
  '240': 14_400_000,
  '360': 21_600_000,
  '720': 43_200_000,
  'D':   86_400_000,
  'W':   604_800_000,
  'M':   2_592_000_000,
};

/** Maximum candles Bybit returns per request */
export const BYBIT_MAX_LIMIT = 1000;

/** Current cache schema version — bump when CachedData shape changes */
export const CACHE_VERSION = 1;
