import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/api/supabase';
import { useAuth } from './useAuth';
import { Strategy, Frequency } from '../data/mockData';

type DbStrategyRow = {
  id: string;
  asset: string;
  amount_usd: number;
  frequency: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
};

type DbBacktestRow = {
  strategy_id: string;
  total_invested: number;
  final_value: number;
  roi_pct: number;
  cagr_pct: number | null;
  max_drawdown_pct: number | null;
  sharpe_ratio: number | null;
  asset_acquired: number | null;
  run_at: string;
};

const toFrequency = (value: string): Frequency => {
  switch (value) {
    case 'daily':
    case 'weekly':
    case 'biweekly':
    case 'monthly':
      return value;
    default:
      return 'weekly';
  }
};

const normalizeDate = (value?: string | null): string => {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
};

const estimateTotalInvested = (
  amount: number,
  frequency: Frequency,
  startDate: string,
  endDate: string,
): number => {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const days = Math.max(0, (endMs - startMs) / 86_400_000);
  const stepDays =
    frequency === 'daily'
      ? 1
      : frequency === 'weekly'
        ? 7
        : frequency === 'biweekly'
          ? 14
          : 30;
  const steps = Math.max(1, Math.ceil(days / stepDays));
  return amount * steps;
};

export const useStrategies = () => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStrategies = useCallback(async () => {
    if (!user?.id) {
      setStrategies([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: rows, error: rowsError } = await supabase
      .from('strategies')
      .select(
        'id, asset, amount_usd, frequency, start_date, end_date, created_at',
      )
      .order('created_at', { ascending: false });

    if (rowsError) {
      setStrategies([]);
      setLoading(false);
      setError(rowsError.message);
      return;
    }

    const strategiesRows = (rows ?? []) as DbStrategyRow[];
    if (strategiesRows.length === 0) {
      setStrategies([]);
      setLoading(false);
      return;
    }

    const ids = strategiesRows.map(row => row.id);
    const { data: backtests, error: backtestsError } = await supabase
      .from('backtest_results')
      .select(
        'strategy_id, total_invested, final_value, roi_pct, cagr_pct, max_drawdown_pct, sharpe_ratio, asset_acquired, run_at',
      )
      .in('strategy_id', ids)
      .order('run_at', { ascending: false });

    if (backtestsError) {
      setError(backtestsError.message);
    }

    const latestByStrategy = new Map<string, DbBacktestRow>();
    for (const row of (backtests ?? []) as DbBacktestRow[]) {
      if (!latestByStrategy.has(row.strategy_id)) {
        latestByStrategy.set(row.strategy_id, row);
      }
    }

    const mapped = strategiesRows.map(row => {
      const freq = toFrequency(row.frequency);
      const startDate = normalizeDate(row.start_date);
      const endDate = normalizeDate(row.end_date ?? row.start_date);
      const result = latestByStrategy.get(row.id);

      const totalInvested = result
        ? Number(result.total_invested)
        : estimateTotalInvested(
            Number(row.amount_usd),
            freq,
            startDate,
            endDate,
          );
      const finalValue = result ? Number(result.final_value) : totalInvested;
      const roi = result ? Number(result.roi_pct) : 0;
      const cagr = result?.cagr_pct != null ? Number(result.cagr_pct) : 0;
      const maxDrawdown =
        result?.max_drawdown_pct != null ? Number(result.max_drawdown_pct) : 0;
      const sharpeRatio =
        result?.sharpe_ratio != null ? Number(result.sharpe_ratio) : 0;
      const totalCoins =
        result?.asset_acquired != null ? Number(result.asset_acquired) : 0;

      return {
        id: row.id,
        asset: row.asset,
        amount: Number(row.amount_usd),
        frequency: freq,
        startDate,
        endDate,
        roi,
        finalValue,
        totalInvested,
        cagr,
        maxDrawdown,
        sharpeRatio,
        totalCoins,
        createdAt: normalizeDate(row.created_at),
      };
    });

    setStrategies(mapped);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  const saveStrategy = useCallback(async (s: Strategy) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setError(null);

    // 1. Get or create portfolio
    let portfolioId: string;
    const { data: portData, error: portError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (portError) {
      throw new Error(portError.message);
    }

    if (portData && portData.length > 0) {
      portfolioId = portData[0].id;
    } else {
      const { data: newPort, error: newPortError } = await supabase
        .from('portfolios')
        .insert({ user_id: user.id, name: 'My Portfolio' })
        .select('id')
        .single();

      if (newPortError) {
        throw new Error(newPortError.message);
      }
      portfolioId = newPort.id;
    }

    // 2. Insert strategy
    const { data: stratData, error: stratError } = await supabase
      .from('strategies')
      .insert({
        user_id: user.id,
        portfolio_id: portfolioId,
        asset: s.asset,
        amount_usd: s.amount,
        frequency: s.frequency,
        start_date: s.startDate,
        end_date: s.endDate || null,
        mc_months: 12,
        is_active: true,
      })
      .select('id')
      .single();

    if (stratError) {
      throw new Error(stratError.message);
    }

    const newStrategyId = stratData.id;

    // 3. Insert backtest result
    const { error: btError } = await supabase
      .from('backtest_results')
      .insert({
        strategy_id: newStrategyId,
        total_invested: s.totalInvested,
        final_value: s.finalValue,
        roi_pct: s.roi,
        cagr_pct: s.cagr,
        max_drawdown_pct: s.maxDrawdown,
        sharpe_ratio: s.sharpeRatio,
        asset_acquired: s.totalCoins,
      });

    if (btError) {
      // Clean up strategy if backtest insertion fails
      await supabase.from('strategies').delete().eq('id', newStrategyId);
      throw new Error(btError.message);
    }

    // Refresh strategies list to update local state
    await loadStrategies();
  }, [user?.id, loadStrategies]);

  const removeStrategy = useCallback(async (id: string) => {
    if (!user?.id) {
      // Offline / local fallback
      setStrategies(prev => prev.filter(s => s.id !== id));
      return;
    }

    setError(null);
    try {
      const { error: dbError } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setStrategies(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      setError(e.message || 'Failed to delete strategy');
    }
  }, [user?.id]);

  const totalValue = strategies.reduce((sum, s) => sum + s.finalValue, 0);
  const totalInvested = strategies.reduce((sum, s) => sum + s.totalInvested, 0);
  const avgRoi = strategies.length
    ? strategies.reduce((sum, s) => sum + s.roi, 0) / strategies.length
    : 0;
  const winners = strategies.filter(s => s.roi >= 0).length;
  const bestRoi = strategies.length
    ? Math.max(...strategies.map(s => s.roi))
    : 0;

  return {
    strategies,
    saveStrategy,
    removeStrategy,
    totalValue,
    totalInvested,
    avgRoi,
    winners,
    bestRoi,
    loading,
    error,
    refresh: loadStrategies,
  };
};
