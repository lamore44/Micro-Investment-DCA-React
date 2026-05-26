// ─────────────────────────────────────────────────────────
//  useMarketData Hook
//  Exposes market data operations to UI components.
// ─────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import { CandleData, KlineInterval } from '../services/api/types';
import { pingBybit } from '../services/api/bybitApi';
import {
  getKlineData,
  getLatestPriceCached,
  invalidateCache,
  getCacheStats,
} from '../services/marketRepository';
import { SYMBOL_MAP, Asset } from '../data/mockData';

// ── Types ───────────────────────────────────────────────

interface MarketDataState {
  /** Fetched kline candle data */
  candles: CandleData[];
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Error message, if any */
  error: string | null;
  /** Whether Bybit API is reachable */
  isOnline: boolean | null;
}

interface CacheInfo {
  sizeBytes: number;
  entryCount: number;
  sizeMB: string;
}

// ── Hook ────────────────────────────────────────────────

export const useMarketData = () => {
  const [state, setState] = useState<MarketDataState>({
    candles: [],
    loading: false,
    error: null,
    isOnline: null,
  });

  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);

  // Prevent concurrent fetches for the same data
  const fetchingRef = useRef(false);

  /**
   * Fetch kline data for a given asset and date range.
   *
   * @param asset      Asset ticker from the ASSETS list (e.g. 'BTC')
   * @param interval   Kline interval (default 'D' for daily)
   * @param startDate  ISO date string (e.g. '2021-01-01')
   * @param endDate    ISO date string (e.g. '2024-01-01')
   * @returns The fetched candle data, or null on failure
   */
  const fetchKline = useCallback(
    async (
      asset: Asset,
      interval: KlineInterval = 'D',
      startDate: string,
      endDate: string,
    ): Promise<CandleData[] | null> => {
      if (fetchingRef.current) return null;
      fetchingRef.current = true;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const symbol = SYMBOL_MAP[asset];
        const candles = await getKlineData(
          symbol,
          interval,
          startDate,
          endDate,
        );

        setState(prev => ({
          ...prev,
          candles,
          loading: false,
          isOnline: true,
        }));

        return candles;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch market data';

        setState(prev => ({
          ...prev,
          candles: [],
          loading: false,
          error: message,
          isOnline: false,
        }));

        return null;
      } finally {
        fetchingRef.current = false;
      }
    },
    [],
  );

  /**
   * Get the latest price for an asset.
   */
  const getLatestPrice = useCallback(
    async (asset: Asset): Promise<number | null> => {
      const symbol = SYMBOL_MAP[asset];
      return getLatestPriceCached(symbol);
    },
    [],
  );

  /**
   * Clear all cached market data, or just for a specific asset.
   */
  const clearCache = useCallback(async (asset?: Asset): Promise<void> => {
    const symbol = asset ? SYMBOL_MAP[asset] : undefined;
    await invalidateCache(symbol);
    // Refresh cache info
    const stats = await getCacheStats();
    setCacheInfo(stats);
  }, []);

  /**
   * Refresh cache statistics (size, entry count).
   */
  const refreshCacheInfo = useCallback(async (): Promise<CacheInfo> => {
    const stats = await getCacheStats();
    setCacheInfo(stats);
    return stats;
  }, []);

  /**
   * Check if Bybit API is reachable.
   */
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    const online = await pingBybit();
    setState(prev => ({ ...prev, isOnline: online }));
    return online;
  }, []);

  /**
   * Prefetch kline data for popular assets.
   * Call this on app launch to warm the cache.
   */
  const prefetchPopularAssets = useCallback(async (): Promise<void> => {
    const popularAssets: Asset[] = ['BTC', 'ETH'];
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(
      Date.now() - 365 * 86_400_000,
    ).toISOString().slice(0, 10);

    for (const asset of popularAssets) {
      try {
        const symbol = SYMBOL_MAP[asset];
        await getKlineData(symbol, 'D', startDate, endDate);
      } catch {
        // Silently skip — prefetch is best-effort
      }
    }
  }, []);

  return {
    // State
    candles: state.candles,
    loading: state.loading,
    error: state.error,
    isOnline: state.isOnline,
    cacheInfo,

    // Actions
    fetchKline,
    getLatestPrice,
    clearCache,
    refreshCacheInfo,
    checkConnectivity,
    prefetchPopularAssets,
  };
};
