//  Cache Service
//  AsyncStorage wrapper with TTL, versioning, and
//  size-aware storage for offline-first kline data.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedData, CACHE_VERSION } from '../api/types';
import {
  CACHE_KEY_PREFIX,
  isMicroDCAKey,
  klinePrefixForSymbol,
} from './cacheKeys';

/** Historical kline data that's older than today - rarely changes */
export const TTL_HISTORICAL_KLINE = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Kline data from the current day - price may still change */
export const TTL_RECENT_KLINE = 5 * 60 * 1000; // 5 minutes

/** Latest ticker price - needs to stay fresh */
export const TTL_TICKER = 30 * 1000; // 30 seconds

/**
 * Save data to cache with TTL metadata.
 *
 * Data is JSON-serialised and wrapped in a `CachedData<T>` envelope
 * that records when it was cached and how long it's valid for.
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number,
): Promise<void> {
  const wrapper: CachedData<T> = {
    data,
    cachedAt: Date.now(),
    ttl,
    version: CACHE_VERSION,
  };
  try {
    await AsyncStorage.setItem(key, JSON.stringify(wrapper));
  } catch (error) {
    // Storage full or other I/O error — log but don't crash
    console.warn('[CacheService] setCache failed:', key, error);
  }
}

/**
 * Retrieve data from cache.
 *
 * Returns `null` if:
 * - Key doesn't exist
 * - TTL has expired
 * - Cache version doesn't match (schema migration)
 * - JSON parsing fails
 */
export async function getCache<T>(
  key: string,
  ignoreExpiry = false,
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const wrapper: CachedData<T> = JSON.parse(raw);

    // Schema version mismatch → treat as miss
    if (wrapper.version !== CACHE_VERSION) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    // TTL check
    if (!ignoreExpiry) {
      const age = Date.now() - wrapper.cachedAt;
      if (age > wrapper.ttl) {
        // Don't delete - keep for offline fallback, just return null
        return null;
      }
    }

    return wrapper.data;
  } catch {
    return null;
  }
}

/**
 * Check if a cache entry exists and is still valid (within TTL).
 */
export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return false;

    const wrapper: CachedData<unknown> = JSON.parse(raw);
    if (wrapper.version !== CACHE_VERSION) return false;

    const age = Date.now() - wrapper.cachedAt;
    return age <= wrapper.ttl;
  } catch {
    return false;
  }
}

/**
 * Clear all MicroDCA cache entries from AsyncStorage.
 * Leaves other app data (e.g., auth tokens) untouched.
 */
export async function clearAllCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const ourKeys = allKeys.filter(isMicroDCAKey);
    if (ourKeys.length > 0) {
      await AsyncStorage.multiRemove(ourKeys);
    }
  } catch (error) {
    console.warn('[CacheService] clearAllCache failed:', error);
  }
}

//Clear all kline cache entries for a specific symbol
export async function clearCacheForSymbol(symbol: string): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefix = klinePrefixForSymbol(symbol);
    const matching = allKeys.filter(k => k.startsWith(prefix));
    if (matching.length > 0) {
      await AsyncStorage.multiRemove(matching);
    }
  } catch (error) {
    console.warn('[CacheService] clearCacheForSymbol failed:', error);
  }
}

//Estimate total cache size in bytes
export async function getCacheSize(): Promise<number> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const ourKeys = allKeys.filter(isMicroDCAKey);

    if (ourKeys.length === 0) return 0;

    const pairs = await AsyncStorage.multiGet(ourKeys);
    let totalBytes = 0;
    pairs.forEach(([key, value]) => {
      totalBytes += (key?.length ?? 0) * 2; // UTF-16 chars = 2 bytes
      totalBytes += (value?.length ?? 0) * 2;
    });

    return totalBytes;
  } catch {
    return -1;
  }
}

// Get the number of cached kline entries
export async function getCacheEntryCount(): Promise<number> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(isMicroDCAKey).length;
  } catch {
    return 0;
  }
}
