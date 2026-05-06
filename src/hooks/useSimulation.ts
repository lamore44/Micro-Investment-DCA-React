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
} from '../data/mockData';

interface SimParams {
  asset:     Asset;
  amount:    number;
  frequency: Frequency;
  startDate: string;
  endDate:   string;
  mcMonths:  number;
}

interface SimResult {
  strategy:  Strategy;
  chartData: ChartPoint[];
  mcData:    MCResult[];
}

export const useSimulation = () => {
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState<SimResult | null>(null);
  const [error,   setError]     = useState<string | null>(null);

  const run = useCallback(async (params: SimParams) => {
    setLoading(true);
    setError(null);

    // Simulate async work (replace with real API calls later)
    await new Promise(r => setTimeout(r, 1100));

    try {
      // Pick closest mock strategy for the selected asset, then scale it
      const base = MOCK_STRATEGIES.find(s => s.asset === params.asset)
                ?? MOCK_STRATEGIES[0];

      const freqDays = params.frequency === 'daily'   ? 1
                     : params.frequency === 'weekly'  ? 7
                     : 30;
      const daysDiff = Math.max(1,
        (new Date(params.endDate).getTime() - new Date(params.startDate).getTime())
        / 86_400_000,
      );
      const steps         = Math.ceil(daysDiff / freqDays);
      const totalInvested = params.amount * steps;
      const scale         = totalInvested / (base.totalInvested || 1);

      const strategy: Strategy = {
        ...base,
        id:           String(Date.now()),
        asset:        params.asset,
        amount:       params.amount,
        frequency:    params.frequency,
        startDate:    params.startDate,
        endDate:      params.endDate,
        totalInvested,
        finalValue:   base.finalValue   * scale,
        totalCoins:   base.totalCoins   * scale,
        createdAt:    new Date().toISOString().slice(0, 10),
      };

      const chartData = generatePortfolioChart(strategy);
      const mcData    = generateMonteCarlo(strategy.finalValue, params.mcMonths);

      setResult({ strategy, chartData, mcData });
      setLoading(false);
      return { strategy, chartData, mcData };
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
