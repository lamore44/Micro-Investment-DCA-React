/**
 * Shared formatting utilities used across the app.
 * Centralised here so screens don't duplicate logic.
 */

export const fmtUSD = (n: number): string => {
  if (!isFinite(n)) return '$—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

export const fmtPct = (n: number, decimals = 1): string => {
  if (!isFinite(n)) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
};

export const fmtCoins = (n: number, ticker: string): string => {
  if (!isFinite(n)) return `— ${ticker}`;
  if (n >= 10_000) return `${n.toFixed(0)} ${ticker}`;
  if (n >= 1)      return `${n.toFixed(4)} ${ticker}`;
  return `${n.toFixed(6)} ${ticker}`;
};

export const fmtDate = (iso: string): string => {
  // "2021-01-15" → "Jan 2021"
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const fmtDateShort = (iso: string): string =>
  iso.slice(0, 7); // "2021-01"

export const fmtNumber = (n: number, dec = 2): string =>
  isFinite(n) ? n.toFixed(dec) : '—';

export const roiColor = (roi: number, colors: {
  green: string; red: string; textPrimary: string;
}): string =>
  roi > 0 ? colors.green : roi < 0 ? colors.red : colors.textPrimary;
