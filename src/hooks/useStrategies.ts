import { useState, useCallback } from 'react';
import { MOCK_STRATEGIES, Strategy } from '../data/mockData';

export const useStrategies = () => {
  const [strategies, setStrategies] = useState<Strategy[]>(MOCK_STRATEGIES);

  const addStrategy = useCallback((s: Strategy) => {
    setStrategies(prev => {
      const exists = prev.find(x => x.id === s.id);
      return exists ? prev : [s, ...prev];
    });
  }, []);

  const removeStrategy = useCallback((id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
  }, []);

  const totalValue    = strategies.reduce((sum, s) => sum + s.finalValue,    0);
  const totalInvested = strategies.reduce((sum, s) => sum + s.totalInvested, 0);
  const avgRoi        = strategies.length
    ? strategies.reduce((sum, s) => sum + s.roi, 0) / strategies.length
    : 0;
  const winners = strategies.filter(s => s.roi >= 0).length;
  const bestRoi = strategies.length
    ? Math.max(...strategies.map(s => s.roi))
    : 0;

  return {
    strategies,
    addStrategy,
    removeStrategy,
    totalValue,
    totalInvested,
    avgRoi,
    winners,
    bestRoi,
  };
};
