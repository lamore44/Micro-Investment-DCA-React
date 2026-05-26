// ─────────────────────────────────────────────
//  Mock data — UI/UX focused, no real API calls
// ─────────────────────────────────────────────

export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface Strategy {
  id: string;
  asset: string;
  amount: number;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  roi: number;
  finalValue: number;
  totalInvested: number;
  cagr: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalCoins: number;
  createdAt: string;
}

export interface ChartPoint {
  date: string;
  portfolioValue: number;
  totalInvested: number;
  roi: number;
}

export interface MCResult {
  month: number;
  worst: number;
  low: number;
  median: number;
  high: number;
  best: number;
}

// ── Strategies ──────────────────────────────
export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: '1',
    asset: 'BTC',
    amount: 100,
    frequency: 'weekly',
    startDate: '2020-01-01',
    endDate: '2023-01-01',
    roi: 214.5,
    finalValue: 42_300,
    totalInvested: 13_400,
    cagr: 44.2,
    maxDrawdown: 35.1,
    sharpeRatio: 1.82,
    totalCoins: 0.8934,
    createdAt: '2024-04-01',
  },
  {
    id: '2',
    asset: 'ETH',
    amount: 50,
    frequency: 'monthly',
    startDate: '2021-06-01',
    endDate: '2024-01-01',
    roi: -12.3,
    finalValue: 1_640,
    totalInvested: 1_850,
    cagr: -4.8,
    maxDrawdown: 61.4,
    sharpeRatio: -0.21,
    totalCoins: 0.9221,
    createdAt: '2024-04-02',
  },
  {
    id: '3',
    asset: 'SOL',
    amount: 25,
    frequency: 'weekly',
    startDate: '2023-01-01',
    endDate: '2024-06-01',
    roi: 387.2,
    finalValue: 8_850,
    totalInvested: 1_825,
    cagr: 198.4,
    maxDrawdown: 22.3,
    sharpeRatio: 2.41,
    totalCoins: 87.44,
    createdAt: '2024-04-03',
  },
];

// ── Portfolio chart points ───────────────────
export function generatePortfolioChart(strategy: Strategy): ChartPoint[] {
  const points: ChartPoint[] = [];
  const start = new Date(strategy.startDate).getTime();
  const end   = new Date(strategy.endDate).getTime();
  const freqMs = strategy.frequency === 'daily'   ? 86_400_000
               : strategy.frequency === 'weekly'  ? 604_800_000
                                                  : 2_592_000_000;
  const steps = Math.min(60, Math.floor((end - start) / freqMs));

  let totalInvested = 0;
  for (let i = 0; i <= steps; i++) {
    const t = start + (i / steps) * (end - start);
    totalInvested += strategy.totalInvested / steps;
    const progress = i / steps;
    // S-curve approximation
    const growthFactor = 1 + (strategy.roi / 100) * Math.pow(progress, 0.7);
    const portfolioValue = totalInvested * growthFactor;
    const roi = totalInvested > 0
      ? ((portfolioValue - totalInvested) / totalInvested) * 100
      : 0;
    points.push({
      date: new Date(t).toISOString().slice(0, 7),
      portfolioValue: Math.max(0, portfolioValue),
      totalInvested: Math.max(0, totalInvested),
      roi,
    });
  }
  return points;
}

// ── Monte Carlo projection ───────────────────
export function generateMonteCarlo(startValue: number, months: number): MCResult[] {
  const results: MCResult[] = [];
  for (let m = 0; m <= months; m++) {
    const t = m / 12;
    const base = startValue;
    results.push({
      month: m,
      worst:  base * Math.pow(0.72, t),
      low:    base * Math.pow(0.88, t) * (1 + 0.05 * t),
      median: base * Math.pow(1.18, t),
      high:   base * Math.pow(1.55, t),
      best:   base * Math.pow(2.20, t),
    });
  }
  return results;
}

// ── Assets list ──────────────────────────────
export const ASSETS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE'] as const;
export type Asset = typeof ASSETS[number];

/**
 * Mapping from user-facing asset ticker → Bybit trading pair symbol.
 * Used by the data layer to call the correct API endpoint.
 */
export const SYMBOL_MAP: Record<Asset, string> = {
  BTC:  'BTCUSDT',
  ETH:  'ETHUSDT',
  SOL:  'SOLUSDT',
  BNB:  'BNBUSDT',
  ADA:  'ADAUSDT',
  DOGE: 'DOGEUSDT',
};

export const ASSET_PRICES: Record<Asset, number> = {
  BTC:  62_400,
  ETH:   3_080,
  SOL:    148,
  BNB:    580,
  ADA:    0.45,
  DOGE:   0.17,
};

// ── Quick preset strategies ──────────────────
export const QUICK_PRESETS = [
  { label: '⚡ Classic BTC DCA', asset: 'BTC' as Asset, amount: 50,  frequency: 'weekly'  as Frequency, startDate: '2021-01-01', endDate: '2024-01-01' },
  { label: '⚡ ETH Bull Run',    asset: 'ETH' as Asset, amount: 100, frequency: 'monthly' as Frequency, startDate: '2020-06-01', endDate: '2021-11-01' },
  { label: '⚡ SOL Micro DCA',   asset: 'SOL' as Asset, amount: 25,  frequency: 'daily'   as Frequency, startDate: '2023-01-01', endDate: '2024-06-01' },
];

// ── Format helpers ───────────────────────────
export const fmtUSD = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

export const fmtPct = (n: number): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

export const fmtCoins = (n: number, asset: string): string => {
  if (n >= 1000) return `${n.toFixed(0)} ${asset}`;
  if (n >= 1)    return `${n.toFixed(4)} ${asset}`;
  return `${n.toFixed(6)} ${asset}`;
};
