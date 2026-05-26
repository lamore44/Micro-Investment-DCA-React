// ─────────────────────────────────────────────────────────
//  Market Repository
//  Single source of truth for kline data.
//  Strategy: cache-first → network-fallback → offline-stale
// ─────────────────────────────────────────────────────────

import { getKline, getLatestPrice as fetchLatestPrice } from './api/bybitApi';
import {
  CandleData,
  KlineInterval,
  INTERVAL_MS,
  BYBIT_MAX_LIMIT,
} from './api/types';
import {
  setCache,
  getCache,
  clearAllCache,
  clearCacheForSymbol,
  getCacheSize,
  getCacheEntryCount,
  TTL_HISTORICAL_KLINE,
  TTL_RECENT_KLINE,
  TTL_TICKER,
} from './cache/cacheService';
import { klineKey, tickerKey } from './cache/cacheKeys';

// ── Helpers ─────────────────────────────────────────────

/**
 * Determine the appropriate TTL based on whether the data range
 * includes today's date.
 */
function chooseTTL(endMs: number): number {
  const now = Date.now();
  const oneDayAgo = now - 86_400_000;
  // If the end of the range is within the last 24 hours, use short TTL
  return endMs >= oneDayAgo ? TTL_RECENT_KLINE : TTL_HISTORICAL_KLINE;
}

/**
 * Calculate how many pagination chunks are needed
 * to cover a date range for a given interval.
 */
function calculateChunks(
  startMs: number,
  endMs: number,
  interval: KlineInterval,
): Array<{ start: number; end: number }> {
  const intervalMs = INTERVAL_MS[interval];
  const totalCandles = Math.ceil((endMs - startMs) / intervalMs);

  if (totalCandles <= BYBIT_MAX_LIMIT) {
    // Single request is enough
    return [{ start: startMs, end: endMs }];
  }

  // Split into chunks of BYBIT_MAX_LIMIT candles each
  const chunks: Array<{ start: number; end: number }> = [];
  let cursor = startMs;

  while (cursor < endMs) {
    const chunkEnd = Math.min(
      cursor + BYBIT_MAX_LIMIT * intervalMs,
      endMs,
    );
    chunks.push({ start: cursor, end: chunkEnd });
    cursor = chunkEnd;
  }

  return chunks;
}

// ── Public API ──────────────────────────────────────────

/**
 * Fetch kline data for a symbol and date range.
 *
 * Flow:
 * 1. Check cache for exact key → if valid, return cached data
 * 2. If cache miss/expired → fetch from Bybit API (with pagination)
 * 3. Save fetched data to cache
 * 4. If network fails → try returning stale (expired) cache data
 * 5. If nothing available → throw error
 *
 * @param symbol    Bybit trading pair, e.g. 'BTCUSDT'
 * @param interval  Candle interval, e.g. 'D' for daily
 * @param startDate ISO date string, e.g. '2021-01-01'
 * @param endDate   ISO date string, e.g. '2024-01-01'
 * @returns Array of CandleData sorted chronologically
 */
export async function getKlineData(
  symbol: string,
  interval: KlineInterval,
  startDate: string,
  endDate: string,
): Promise<CandleData[]> {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const cacheKeyStr = klineKey(symbol, interval, startMs, endMs);

  // ── Step 1: Try fresh cache ─────────────────────────
  const cached = await getCache<CandleData[]>(cacheKeyStr);
  if (cached && cached.length > 0) {
    return cached;
  }

  // ── Step 2: Fetch from Bybit with pagination ────────
  try {
    const allCandles = await fetchWithPagination(
      symbol,
      interval,
      startMs,
      endMs,
    );

    // ── Step 3: Save to cache ───────────────────────
    const ttl = chooseTTL(endMs);
    await setCache(cacheKeyStr, allCandles, ttl);

    return allCandles;
  } catch (networkError) {
    // ── Step 4: Fallback to stale cache ─────────────
    const stale = await getCache<CandleData[]>(cacheKeyStr, true);
    if (stale && stale.length > 0) {
      console.warn(
        '[MarketRepository] Network failed, using stale cache for:',
        symbol,
      );
      return stale;
    }

    // ── Step 5: Nothing available ───────────────────
    throw new Error(
      `Failed to fetch kline data for ${symbol}: ${
        networkError instanceof Error ? networkError.message : 'Unknown error'
      }. No cached data available.`,
    );
  }
}

/**
 * Fetch kline data across multiple paginated requests.
 * Requests run sequentially (not parallel) to respect rate limits;
 * the throttle in `bybitApi.ts` adds delay between each call.
 */
async function fetchWithPagination(
  symbol: string,
  interval: KlineInterval,
  startMs: number,
  endMs: number,
): Promise<CandleData[]> {
  const chunks = calculateChunks(startMs, endMs, interval);
  const allCandles: CandleData[] = [];

  for (const chunk of chunks) {
    const candles = await getKline({
      symbol,
      interval,
      start: chunk.start,
      end: chunk.end,
      limit: BYBIT_MAX_LIMIT,
      category: 'spot',
    });
    allCandles.push(...candles);
  }

  // De-duplicate by startTime (overlaps at chunk boundaries)
  const seen = new Set<number>();
  const unique = allCandles.filter(c => {
    if (seen.has(c.startTime)) return false;
    seen.add(c.startTime);
    return true;
  });

  // Sort chronologically
  unique.sort((a, b) => a.startTime - b.startTime);

  return unique;
}

/**
 * Get the latest price for a symbol, with caching.
 */
export async function getLatestPriceCached(
  symbol: string,
): Promise<number | null> {
  const key = tickerKey(symbol);

  // Try cache first
  const cached = await getCache<number>(key);
  if (cached !== null) return cached;

  // Fetch from API
  const price = await fetchLatestPrice(symbol);
  if (price !== null) {
    await setCache(key, price, TTL_TICKER);
  }

  return price;
}

/**
 * Invalidate (clear) cached data.
 *
 * @param symbol  If provided, only clear cache for this symbol.
 *                If omitted, clear ALL MicroDCA cache.
 */
export async function invalidateCache(symbol?: string): Promise<void> {
  if (symbol) {
    await clearCacheForSymbol(symbol);
  } else {
    await clearAllCache();
  }
}

/**
 * Get cache statistics for display in settings/debug UI.
 */
export async function getCacheStats(): Promise<{
  sizeBytes: number;
  entryCount: number;
  sizeMB: string;
}> {
  const [sizeBytes, entryCount] = await Promise.all([
    getCacheSize(),
    getCacheEntryCount(),
  ]);

  return {
    sizeBytes,
    entryCount,
    sizeMB:
      sizeBytes >= 0
        ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
        : 'Unknown',
  };
}
