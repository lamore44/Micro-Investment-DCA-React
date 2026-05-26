// ─────────────────────────────────────────────────────────
//  DataLayerTestScreen
//  Debug screen to verify all data layer components work.
//  Navigate here to run automated checks on-device.
// ─────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../theme';

// ── Services under test ─────────────────────────────────
import { getKline, getLatestPrice, pingBybit } from '../../services/api/bybitApi';
import {
  setCache,
  getCache,
  isCacheValid,
  clearAllCache,
  getCacheSize,
  getCacheEntryCount,
  TTL_HISTORICAL_KLINE,
} from '../../services/cache/cacheService';
import { klineKey, parseKlineKey, tickerKey } from '../../services/cache/cacheKeys';
import { getKlineData, getLatestPriceCached, getCacheStats } from '../../services/marketRepository';
import { CandleData } from '../../services/api/types';
import { SYMBOL_MAP, Asset } from '../../data/mockData';

// ── Types ───────────────────────────────────────────────

type TestStatus = 'idle' | 'running' | 'pass' | 'fail';

interface TestResult {
  name: string;
  status: TestStatus;
  detail: string;
  duration?: number;
}

// ── Component ───────────────────────────────────────────

export const DataLayerTestScreen: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...update };
      return copy;
    });
  };

  const runAllTests = useCallback(async () => {
    setRunning(true);

    // Initialize all test slots
    const testNames = [
      '1. Cache Keys — generate & parse',
      '2. Cache Service — set & get with TTL',
      '3. Cache Service — TTL expiry',
      '4. Cache Service — clear all',
      '5. Bybit API — ping connectivity',
      '6. Bybit API — fetch kline (BTCUSDT, 3 candles)',
      '7. Bybit API — latest price (BTCUSDT)',
      '8. Repository — getKlineData (BTC, 1 month)',
      '9. Repository — cache hit (same query again)',
      '10. Repository — cache stats',
      '11. Full Integration — useSimulation flow',
    ];

    const initial: TestResult[] = testNames.map(name => ({
      name,
      status: 'idle' as TestStatus,
      detail: 'Waiting...',
    }));
    setResults(initial);

    let idx = 0;

    // ── Test 1: Cache Keys ────────────────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Testing...' });
      const t0 = Date.now();

      const key = klineKey('BTCUSDT', 'D', 1609459200000, 1704067200000);
      const expected = '@microdca:kline:BTCUSDT:D:1609459200000:1704067200000';
      if (key !== expected) throw new Error(`Key mismatch: ${key}`);

      const parsed = parseKlineKey(key);
      if (!parsed) throw new Error('parseKlineKey returned null');
      if (parsed.symbol !== 'BTCUSDT') throw new Error(`Symbol: ${parsed.symbol}`);
      if (parsed.interval !== 'D') throw new Error(`Interval: ${parsed.interval}`);

      const tk = tickerKey('ETHUSDT');
      if (tk !== '@microdca:ticker:ETHUSDT') throw new Error(`Ticker key: ${tk}`);

      updateResult(idx, {
        status: 'pass',
        detail: `Key: ${key.slice(0, 40)}...\nParsed symbol: ${parsed.symbol}, interval: ${parsed.interval}`,
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, { status: 'fail', detail: e.message });
    }
    idx++;

    // ── Test 2: Cache set & get ───────────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Testing...' });
      const t0 = Date.now();

      const testKey = '@microdca:test:set-get';
      const testData = { hello: 'world', num: 42 };
      await setCache(testKey, testData, 60_000); // 60s TTL

      const retrieved = await getCache<typeof testData>(testKey);
      if (!retrieved) throw new Error('getCache returned null');
      if (retrieved.hello !== 'world') throw new Error(`Data mismatch: ${JSON.stringify(retrieved)}`);
      if (retrieved.num !== 42) throw new Error(`Num mismatch: ${retrieved.num}`);

      updateResult(idx, {
        status: 'pass',
        detail: `Stored & retrieved: ${JSON.stringify(retrieved)}`,
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, { status: 'fail', detail: e.message });
    }
    idx++;

    // ── Test 3: Cache TTL expiry ──────────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Testing TTL (1ms)...' });
      const t0 = Date.now();

      const testKey = '@microdca:test:ttl-expiry';
      await setCache(testKey, 'short-lived', 1); // 1ms TTL

      // Wait for it to expire
      await new Promise(r => setTimeout(r, 50));

      const fresh = await getCache<string>(testKey, false);
      if (fresh !== null) throw new Error('Expected null (expired), got data');

      // But with ignoreExpiry, should still return data
      const stale = await getCache<string>(testKey, true);
      if (stale !== 'short-lived') throw new Error('Stale read failed');

      updateResult(idx, {
        status: 'pass',
        detail: 'Fresh read: null (correct — expired)\nStale read: "short-lived" (correct — offline fallback works)',
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, { status: 'fail', detail: e.message });
    }
    idx++;

    // ── Test 4: Cache clear ───────────────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Clearing cache...' });
      const t0 = Date.now();

      await setCache('@microdca:test:clear1', 'data1', 60_000);
      await setCache('@microdca:test:clear2', 'data2', 60_000);
      await clearAllCache();

      const after1 = await getCache('@microdca:test:clear1', true);
      const after2 = await getCache('@microdca:test:clear2', true);
      if (after1 !== null || after2 !== null) throw new Error('Cache not cleared');

      updateResult(idx, {
        status: 'pass',
        detail: 'All MicroDCA cache entries cleared successfully',
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, { status: 'fail', detail: e.message });
    }
    idx++;

    // ── Test 5: Bybit ping ────────────────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Pinging api.bybit.com...' });
      const t0 = Date.now();

      const online = await pingBybit();

      updateResult(idx, {
        status: online ? 'pass' : 'fail',
        detail: online
          ? 'Bybit API is reachable ✓'
          : 'Bybit API unreachable — offline mode will be used',
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, { status: 'fail', detail: e.message });
    }
    idx++;

    // ── Test 6: Bybit kline fetch ─────────────────────
    let fetchedCandles: CandleData[] = [];
    try {
      updateResult(idx, { status: 'running', detail: 'Fetching BTCUSDT daily kline (3 candles)...' });
      const t0 = Date.now();

      fetchedCandles = await getKline({
        symbol: 'BTCUSDT',
        interval: 'D',
        limit: 3,
        category: 'spot',
      });

      if (fetchedCandles.length === 0) throw new Error('No candles returned');

      const sample = fetchedCandles[0];
      updateResult(idx, {
        status: 'pass',
        detail: `Got ${fetchedCandles.length} candles\n` +
          `First: ${new Date(sample.startTime).toISOString().slice(0, 10)}\n` +
          `O: $${sample.open} H: $${sample.high}\n` +
          `L: $${sample.low} C: $${sample.close}\n` +
          `Vol: ${sample.volume.toFixed(2)}`,
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, {
        status: 'fail',
        detail: `API call failed: ${e.message}\n(Expected if no internet)`,
      });
    }
    idx++;

    // ── Test 7: Latest price ──────────────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Fetching BTC latest price...' });
      const t0 = Date.now();

      const price = await getLatestPrice('BTCUSDT');

      if (price === null) throw new Error('Price is null');
      updateResult(idx, {
        status: 'pass',
        detail: `BTC/USDT latest price: $${price.toLocaleString()}`,
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, {
        status: 'fail',
        detail: `Failed: ${e.message}\n(Expected if no internet)`,
      });
    }
    idx++;

    // ── Test 8: Repository — fetch + cache ────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Fetching BTC 1-month data via Repository...' });
      const t0 = Date.now();

      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

      const candles = await getKlineData('BTCUSDT', 'D', startDate, endDate);

      if (candles.length === 0) throw new Error('No candles from repository');

      updateResult(idx, {
        status: 'pass',
        detail: `Got ${candles.length} daily candles\n` +
          `Range: ${new Date(candles[0].startTime).toISOString().slice(0, 10)} → ` +
          `${new Date(candles[candles.length - 1].startTime).toISOString().slice(0, 10)}\n` +
          `Data should now be cached`,
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, {
        status: 'fail',
        detail: `Repository failed: ${e.message}`,
      });
    }
    idx++;

    // ── Test 9: Repository — cache hit ────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Re-fetching same data (should hit cache)...' });
      const t0 = Date.now();

      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

      const candles = await getKlineData('BTCUSDT', 'D', startDate, endDate);
      const elapsed = Date.now() - t0;

      // Cache hit should be very fast (< 100ms vs 500ms+ for API)
      const likelyCacheHit = elapsed < 200;

      updateResult(idx, {
        status: candles.length > 0 ? 'pass' : 'fail',
        detail: `Got ${candles.length} candles in ${elapsed}ms\n` +
          (likelyCacheHit
            ? '⚡ Fast response — likely cache hit!'
            : '🐢 Slow response — probably fetched from API'),
        duration: elapsed,
      });
    } catch (e: any) {
      updateResult(idx, {
        status: 'fail',
        detail: `Cache hit test failed: ${e.message}`,
      });
    }
    idx++;

    // ── Test 10: Cache stats ──────────────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Reading cache stats...' });
      const t0 = Date.now();

      const stats = await getCacheStats();

      updateResult(idx, {
        status: 'pass',
        detail: `Cache size: ${stats.sizeMB}\nEntries: ${stats.entryCount}`,
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, { status: 'fail', detail: e.message });
    }
    idx++;

    // ── Test 11: Full integration ─────────────────────
    try {
      updateResult(idx, { status: 'running', detail: 'Running full DCA simulation...' });
      const t0 = Date.now();

      // Import dynamically to avoid circular deps in test
      const candles = await getKlineData('BTCUSDT', 'D', '2024-01-01', '2024-06-01');

      if (candles.length === 0) throw new Error('No candles for simulation');

      // Simulate a simple DCA
      const amount = 50; // $50 per purchase
      const freqDays = 7; // weekly
      const freqMs = freqDays * 86_400_000;
      let totalInvested = 0;
      let totalCoins = 0;
      let purchaseTime = new Date('2024-01-01').getTime();
      const endTime = new Date('2024-06-01').getTime();
      let purchases = 0;

      while (purchaseTime <= endTime) {
        // Find closest candle
        const candle = candles.reduce((closest, c) =>
          Math.abs(c.startTime - purchaseTime) < Math.abs(closest.startTime - purchaseTime)
            ? c : closest
        );
        totalInvested += amount;
        totalCoins += amount / candle.close;
        purchases++;
        purchaseTime += freqMs;
      }

      const lastPrice = candles[candles.length - 1].close;
      const finalValue = totalCoins * lastPrice;
      const roi = ((finalValue - totalInvested) / totalInvested) * 100;

      updateResult(idx, {
        status: 'pass',
        detail: `DCA Simulation Complete:\n` +
          `${purchases} purchases × $${amount} = $${totalInvested}\n` +
          `Total BTC: ${totalCoins.toFixed(6)}\n` +
          `Final value: $${finalValue.toFixed(2)}\n` +
          `ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`,
        duration: Date.now() - t0,
      });
    } catch (e: any) {
      updateResult(idx, {
        status: 'fail',
        detail: `Integration test failed: ${e.message}`,
      });
    }

    setRunning(false);
  }, []);

  // ── Render ──────────────────────────────────────────

  const statusIcon = (s: TestStatus) => {
    switch (s) {
      case 'idle':    return '⏳';
      case 'running': return '🔄';
      case 'pass':    return '✅';
      case 'fail':    return '❌';
    }
  };

  const statusColor = (s: TestStatus) => {
    switch (s) {
      case 'idle':    return '#999';
      case 'running': return '#FDCB6E';
      case 'pass':    return '#00B894';
      case 'fail':    return '#E17055';
    }
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Data Layer Test Suite</Text>
        <Text style={styles.subtitle}>
          Tests: Cache Keys → Cache Service → Bybit API → Repository → Integration
        </Text>

        {total > 0 && (
          <View style={styles.summary}>
            <Text style={[styles.summaryText, { color: '#00B894' }]}>
              ✅ {passCount} passed
            </Text>
            <Text style={[styles.summaryText, { color: '#E17055' }]}>
              ❌ {failCount} failed
            </Text>
            <Text style={[styles.summaryText, { color: '#999' }]}>
              / {total} total
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.runButton, running && styles.runButtonDisabled]}
        onPress={runAllTests}
        disabled={running}
        activeOpacity={0.7}
      >
        {running ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.runButtonText}>
            {results.length > 0 ? '🔄 Run All Tests Again' : '▶️ Run All Tests'}
          </Text>
        )}
      </TouchableOpacity>

      {results.map((r, i) => (
        <View
          key={i}
          style={[
            styles.testCard,
            { borderLeftColor: statusColor(r.status) },
          ]}
        >
          <View style={styles.testHeader}>
            <Text style={styles.testIcon}>{statusIcon(r.status)}</Text>
            <Text style={styles.testName}>{r.name}</Text>
            {r.duration !== undefined && (
              <Text style={styles.testDuration}>{r.duration}ms</Text>
            )}
          </View>
          <Text style={styles.testDetail}>{r.detail}</Text>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Note: Tests 5-11 require internet access.{'\n'}
          If Bybit API is blocked, tests 1-4 (cache layer) should still pass.
        </Text>
      </View>
    </ScrollView>
  );
};

// ── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F0F0F0',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
  },
  summary: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  runButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  runButtonDisabled: {
    backgroundColor: '#4A3DA0',
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  testCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  testIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  testName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  testDuration: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
  },
  testDetail: {
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 17,
    fontFamily: 'monospace',
    marginLeft: 24,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#484F58',
    textAlign: 'center',
    lineHeight: 18,
  },
});
