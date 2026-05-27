-- ============================================================
-- MicroDCA — Supabase Database Setup
-- Copy-paste ke SQL Editor di dashboard Supabase
-- Urutan: profiles → portfolios → strategies → backtest_results
-- ============================================================

-- ============================================================
-- BAGIAN 1: PROFILES (Week 2-3)
-- Tabel user profile, auto-create via trigger saat register
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: auto-create profile saat user register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- BAGIAN 2: PORTFOLIOS (Week 3)
-- Menyimpan portofolio user (agregat dari semua strategi)
-- ============================================================

CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  description TEXT,
  total_invested_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_value_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- BAGIAN 3: STRATEGIES (Week 5)
-- Setiap strategi DCA yang dibuat user
-- ============================================================

CREATE TYPE public.frequency_type AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');

CREATE TABLE public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  asset TEXT NOT NULL CHECK (asset IN ('BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE')),
  amount_usd NUMERIC(12,2) NOT NULL CHECK (amount_usd > 0),
  frequency public.frequency_type NOT NULL DEFAULT 'weekly',
  start_date DATE NOT NULL,
  end_date DATE,
  mc_months INT NOT NULL DEFAULT 12 CHECK (mc_months BETWEEN 1 AND 60),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- BAGIAN 4: BACKTEST RESULTS (Week 5)
-- Hasil backtest untuk setiap strategi
-- ============================================================

CREATE TABLE public.backtest_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  total_invested NUMERIC(14,2) NOT NULL,
  final_value NUMERIC(14,2) NOT NULL,
  roi_pct NUMERIC(8,2) NOT NULL,
  cagr_pct NUMERIC(8,2),
  max_drawdown_pct NUMERIC(8,2),
  sharpe_ratio NUMERIC(8,4),
  sortino_ratio NUMERIC(8,4),
  volatility_pct NUMERIC(8,2),
  best_month_pct NUMERIC(8,2),
  worst_month_pct NUMERIC(8,2),
  total_trades INT NOT NULL DEFAULT 0,
  asset_acquired NUMERIC(14,6) NOT NULL DEFAULT 0,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backtest_strategy_id ON public.backtest_results(strategy_id);
CREATE INDEX idx_backtest_run_at ON public.backtest_results(run_at DESC);

-- ============================================================
-- BAGIAN 5: MONTE CARLO PROJECTIONS (Week 8)
-- Hasil simulasi Monte Carlo untuk setiap strategi
-- ============================================================

CREATE TABLE public.mc_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  median_return_pct NUMERIC(8,2),
  p10_return_pct NUMERIC(8,2),
  p25_return_pct NUMERIC(8,2),
  p75_return_pct NUMERIC(8,2),
  p90_return_pct NUMERIC(8,2),
  probability_of_profit_pct NUMERIC(5,2),
  simulation_count INT NOT NULL DEFAULT 500,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mc_strategy_id ON public.mc_projections(strategy_id);

-- ============================================================
-- BAGIAN 6: ROW LEVEL SECURITY (Week 4)
-- User hanya bisa akses data milik sendiri
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own portfolios" ON public.portfolios;
CREATE POLICY "Users can CRUD own portfolios"
  ON public.portfolios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Strategies
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own strategies" ON public.strategies;
CREATE POLICY "Users can CRUD own strategies"
  ON public.strategies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Backtest Results (akses via strategy ownership)
ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read backtests of own strategies" ON public.backtest_results;
CREATE POLICY "Users can read backtests of own strategies"
  ON public.backtest_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = backtest_results.strategy_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert backtests for own strategies" ON public.backtest_results;
CREATE POLICY "Users can insert backtests for own strategies"
  ON public.backtest_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = backtest_results.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- MC Projections (akses via strategy ownership)
ALTER TABLE public.mc_projections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read projections of own strategies" ON public.mc_projections;
CREATE POLICY "Users can read projections of own strategies"
  ON public.mc_projections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = mc_projections.strategy_id
      AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert projections for own strategies" ON public.mc_projections;
CREATE POLICY "Users can insert projections for own strategies"
  ON public.mc_projections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = mc_projections.strategy_id
      AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- BAGIAN 7: INDEXES (Performa)
-- ============================================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_portfolios_user ON public.portfolios(user_id);
CREATE INDEX idx_strategies_user ON public.strategies(user_id);
CREATE INDEX idx_strategies_portfolio ON public.strategies(portfolio_id);
CREATE INDEX idx_strategies_active ON public.strategies(is_active) WHERE is_active = true;

-- ============================================================
-- BAGIAN 7: PRICE CACHE (Week 6)
-- Cache data kline dari Bybit untuk Edge Function
-- ============================================================

CREATE TABLE IF NOT EXISTS public.price_cache (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ttl_seconds INT NOT NULL DEFAULT 86400
);

CREATE INDEX IF NOT EXISTS idx_price_cache_key ON public.price_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_price_cache_expiry ON public.price_cache(created_at);

-- ============================================================
-- BAGIAN 8: REALTIME (Week 8)
-- Enable Realtime on strategies & backtest_results
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.strategies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.backtest_results;

-- ============================================================
-- SELESAI — Semua tabel, trigger, RLS, index, cache, realtime siap.
-- ============================================================