//  Cache Key Utilities
//  Generates consistent, parsable keys for AsyncStorage.

const CACHE_PREFIX = '@microdca';

// Build a cache key for kline data.
// Format: `@microdca:kline:{symbol}:{interval}:{start}:{end}`
// klineKey('BTCUSDT', 'D', 1609459200000, 1704067200000)
export function klineKey(
  symbol: string,
  interval: string,
  startMs: number,
  endMs: number,
): string {
  return `${CACHE_PREFIX}:kline:${symbol}:${interval}:${startMs}:${endMs}`;
}

// Build a cache key for the latest ticker price.
// Format: `@microdca:ticker:{symbol}`
export function tickerKey(symbol: string): string {
  return `${CACHE_PREFIX}:ticker:${symbol}`;
}

// Build a cache key for the asset list / metadata.
export function assetListKey(): string {
  return `${CACHE_PREFIX}:assets`;
}

// Check if a given AsyncStorage key belongs to MicroDCA cache.
export function isMicroDCAKey(key: string): boolean {
  return key.startsWith(CACHE_PREFIX);
}

// Extract parts from a kline cache key. Returns null if the key format is invalid.
export function parseKlineKey(key: string): {
  symbol: string;
  interval: string;
  startMs: number;
  endMs: number;
} | null {
  const parts = key.split(':');
  // Expected: ['@microdca', 'kline', symbol, interval, start, end]
  if (parts.length !== 6 || parts[1] !== 'kline') return null;

  const startMs = Number(parts[4]);
  const endMs = Number(parts[5]);
  if (isNaN(startMs) || isNaN(endMs)) return null;

  return {
    symbol: parts[2],
    interval: parts[3],
    startMs,
    endMs,
  };
}

// Build a wildcard-style prefix for finding all kline caches
// for a specific symbol. Used by `clearCacheForSymbol()` to enumerate matching keys.
export function klinePrefixForSymbol(symbol: string): string {
  return `${CACHE_PREFIX}:kline:${symbol}:`;
}

// General cache prefix — used to enumerate all MicroDCA keys.
export const CACHE_KEY_PREFIX = CACHE_PREFIX;
