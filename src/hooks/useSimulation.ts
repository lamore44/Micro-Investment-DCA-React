// ─────────────────────────────────────────────────────────
//  useSimulation Hook
//  Runs DCA backtest simulation using REAL Bybit kline data,
//  with graceful fallback to mock data if offline / API fails.
// ─────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import {
  Strategy,
  Asset,
  Frequency,
  MOCK_STRATEGIES,
  generatePortfolioChart,
  generateMonteCarlo,
  ChartPoint,
  MCResult,
  SYMBOL_MAP,
} from '../data/mockData';
import { getKlineData } from '../services/marketRepository';
import { CandleData } from '../services/api/types';

// ── Types ───────────────────────────────────────────────

interface SimParams {
  asset: Asset;
  amount: number;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  mcMonths: number;
}

interface SimResult {
  strategy: Strategy;
  chartData: ChartPoint[];
  mcData: MCResult[];
  /** Whether this result was computed from real Bybit data or mock fallback */
  isRealData: boolean;
}

// ── DCA Engine (real data) ──────────────────────────────

/**
 * Map DCA frequency to Bybit kline interval.
 * - daily → 'D' (daily candles)
 * - weekly → 'D' (use daily candles, pick every 7th)
 * - monthly → 'D' (use daily candles, pick every ~30th)
 *
 * We always fetch daily candles and subsample, because Bybit's
 * 'W' and 'M' intervals don't give us enough granularity for
 * arbitrary start dates.
 */
function getFrequencyDays(frequency: Frequency): number {
  switch (frequency) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'biweekly':
      return 14;
    case 'monthly':
      return 30;
  }
}

/**
 * Run a DCA simulation on real candlestick data.
 *
 * For each purchase interval:
 * 1. Find the closest candle to the purchase date
 * 2. Buy `amount` USD worth of the asset at the close price
 * 3. Track cumulative investment and coin holdings
 * 4. Calculate ROI, final value, etc.
 */
function runDCAOnRealData(
  candles: CandleData[],
  params: SimParams,
): { strategy: Omit<Strategy, 'id' | 'createdAt'>; chartData: ChartPoint[] } {
  const freqDays = getFrequencyDays(params.frequency);
  const freqMs = freqDays * 86_400_000;

  const startMs = new Date(params.startDate).getTime();
  const endMs = new Date(params.endDate).getTime();

  let totalInvested = 0;
  let totalCoins = 0;
  let peakValue = 0;
  let maxDrawdown = 0;
  const chartData: ChartPoint[] = [];
  const returns: number[] = [];
  let prevValue = 0;

  // Walk through each DCA purchase point
  let purchaseTime = startMs;
  while (purchaseTime <= endMs) {
    // Find the closest candle at or before this purchase time
    const candle = findClosestCandle(candles, purchaseTime);
    if (!candle) {
      purchaseTime += freqMs;
      continue;
    }

    // Execute DCA purchase
    const price = candle.close;
    const coinsBought = params.amount / price;
    totalInvested += params.amount;
    totalCoins += coinsBought;

    // Current portfolio value
    const portfolioValue = totalCoins * price;

    // Track drawdown
    if (portfolioValue > peakValue) {
      peakValue = portfolioValue;
    }
    const drawdown =
      peakValue > 0 ? ((peakValue - portfolioValue) / peakValue) * 100 : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    // Track returns for Sharpe ratio
    if (prevValue > 0) {
      returns.push((portfolioValue - prevValue) / prevValue);
    }
    prevValue = portfolioValue;

    // Record chart point
    const roi =
      totalInvested > 0
        ? ((portfolioValue - totalInvested) / totalInvested) * 100
        : 0;

    chartData.push({
      date: new Date(candle.startTime).toISOString().slice(0, 7),
      portfolioValue,
      totalInvested,
      roi,
    });

    purchaseTime += freqMs;
  }

  // Final valuation using the last candle
  const lastCandle = candles[candles.length - 1];
  const finalValue = lastCandle ? totalCoins * lastCandle.close : totalInvested;
  const roi =
    totalInvested > 0
      ? ((finalValue - totalInvested) / totalInvested) * 100
      : 0;

  // CAGR
  const years = (endMs - startMs) / (365.25 * 86_400_000);
  const cagr =
    years > 0
      ? (Math.pow(finalValue / Math.max(totalInvested, 1), 1 / years) - 1) * 100
      : 0;

  // Sharpe ratio (annualised, assuming risk-free rate ≈ 0)
  const avgReturn =
    returns.length > 0
      ? returns.reduce((a, b) => a + b, 0) / returns.length
      : 0;
  const stdReturn =
    returns.length > 1
      ? Math.sqrt(
          returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
            (returns.length - 1),
        )
      : 0;
  const periodsPerYear = 365 / getFrequencyDays(params.frequency);
  const sharpeRatio =
    stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(periodsPerYear) : 0;

  return {
    strategy: {
      asset: params.asset,
      amount: params.amount,
      frequency: params.frequency,
      startDate: params.startDate,
      endDate: params.endDate,
      roi: Math.round(roi * 10) / 10,
      finalValue: Math.round(finalValue * 100) / 100,
      totalInvested,
      cagr: Math.round(cagr * 10) / 10,
      maxDrawdown: Math.round(maxDrawdown * 10) / 10,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      totalCoins,
    },
    chartData,
  };
}

/**
 * Find the candle with startTime closest to (and ≤) the target timestamp.
 * Uses binary search for efficiency on large datasets.
 */
function findClosestCandle(
  candles: CandleData[],
  targetMs: number,
): CandleData | null {
  if (candles.length === 0) return null;

  let lo = 0;
  let hi = candles.length - 1;

  // If target is before all candles, return the first one
  if (targetMs <= candles[0].startTime) return candles[0];
  // If target is after all candles, return the last one
  if (targetMs >= candles[hi].startTime) return candles[hi];

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (candles[mid].startTime === targetMs) return candles[mid];
    if (candles[mid].startTime < targetMs) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  // `hi` is now the index of the largest element ≤ targetMs
  return candles[hi] ?? null;
}

// ── Mock Fallback ───────────────────────────────────────

/**
 * Generate simulation result from mock data (original logic).
 * Used when Bybit API is unreachable and no cache exists.
 */
function runMockSimulation(params: SimParams): SimResult {
  const base =
    MOCK_STRATEGIES.find(s => s.asset === params.asset) ?? MOCK_STRATEGIES[0];

  const freqDays = getFrequencyDays(params.frequency);
  const daysDiff = Math.max(
    1,
    (new Date(params.endDate).getTime() -
      new Date(params.startDate).getTime()) /
      86_400_000,
  );
  const steps = Math.ceil(daysDiff / freqDays);
  const totalInvested = params.amount * steps;
  const scale = totalInvested / (base.totalInvested || 1);

  const strategy: Strategy = {
    ...base,
    id: String(Date.now()),
    asset: params.asset,
    amount: params.amount,
    frequency: params.frequency,
    startDate: params.startDate,
    endDate: params.endDate,
    totalInvested,
    finalValue: base.finalValue * scale,
    totalCoins: base.totalCoins * scale,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  const chartData = generatePortfolioChart(strategy);
  const mcData = generateMonteCarlo(strategy.finalValue, params.mcMonths);

  return { strategy, chartData, mcData, isRealData: false };
}

// ── Hook ────────────────────────────────────────────────

export const useSimulation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (params: SimParams) => {
    setLoading(true);
    setError(null);

    try {
      // ── Try real data first ──────────────────────
      const symbol = SYMBOL_MAP[params.asset];
      let candles: CandleData[] = [];
      let isRealData = false;

      try {
        candles = await getKlineData(
          symbol,
          'D', // Always fetch daily candles for DCA granularity
          params.startDate,
          params.endDate,
        );
        isRealData = candles.length > 0;
      } catch (apiError) {
        console.warn(
          '[useSimulation] Bybit API unavailable, falling back to mock:',
          apiError instanceof Error ? apiError.message : apiError,
        );
      }

      // ── If we got real data, compute on it ───────
      if (isRealData && candles.length > 0) {
        const { strategy: strategyData, chartData } = runDCAOnRealData(
          candles,
          params,
        );

        const strategy: Strategy = {
          ...strategyData,
          id: String(Date.now()),
          createdAt: new Date().toISOString().slice(0, 10),
        };

        const mcData = generateMonteCarlo(strategy.finalValue, params.mcMonths);

        const simResult: SimResult = {
          strategy,
          chartData,
          mcData,
          isRealData: true,
        };

        setResult(simResult);
        setLoading(false);
        return simResult;
      }

      // ── Fallback to mock data ────────────────────
      const mockResult = runMockSimulation(params);
      setResult(mockResult);
      setLoading(false);
      return mockResult;
    } catch (e: any) {
      setError(e?.message ?? 'Simulation failed');
      setLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { run, loading, result, error, reset };
};
