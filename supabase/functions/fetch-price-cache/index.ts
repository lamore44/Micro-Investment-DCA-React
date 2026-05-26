// ─────────────────────────────────────────────────────────
// Edge Function: fetch-price-cache
// Proxy Bybit v5 kline endpoint with server-side caching.
// Reduces rate limit pressure on Bybit API from mobile clients.
// ─────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Config ───────────────────────────────────────────────

const BYBIT_KLINE_URL = 'https://api.bybit.com/v5/market/kline';
const BYBIT_MAX_LIMIT = 1000;
const THROTTLE_MS = 600; // ~100 req/min with safety margin

const TTL_RECENT = 3600;      // 1 hour for data including today
const TTL_HISTORICAL = 604800; // 7 days for historical data

// Static API key for client auth (no JWT needed)
const EDGE_API_KEY = Deno.env.get('EDGE_API_KEY') ?? '';

// ── Clients ──────────────────────────────────────────────

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// ── Helpers ──────────────────────────────────────────────

interface KlineParams {
  symbol: string;
  interval: string;
  start: number;
  end: number;
  limit?: number;
  category?: string;
}

function buildCacheKey(params: KlineParams): string {
  return `kline:${params.category ?? 'spot'}:${params.symbol}:${params.interval}:${params.start}:${params.end}`;
}

function chooseTTL(end: number): number {
  const now = Date.now();
  return end >= now - 86_400_000 ? TTL_RECENT : TTL_HISTORICAL;
}

// Simple throttle
let lastRequest = 0;
async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequest;
  if (elapsed < THROTTLE_MS) {
    await new Promise(r => setTimeout(r, THROTTLE_MS - elapsed));
  }
  lastRequest = Date.now();
}

// ── Cache Layer ──────────────────────────────────────────

async function getCached(key: string): Promise<unknown | null> {
  const { data } = await supabase
    .from('price_cache')
    .select('data, created_at, ttl_seconds')
    .eq('cache_key', key)
    .single();

  if (!data) return null;

  const expiry = new Date(data.created_at).getTime() + data.ttl_seconds * 1000;
  if (Date.now() > expiry) return null; // expired

  return data.data;
}

async function setCache(key: string, data: unknown, ttl: number) {
  await supabase
    .from('price_cache')
    .upsert({ cache_key: key, data, ttl_seconds: ttl, created_at: new Date().toISOString() });
}

// ── Bybit Fetcher ────────────────────────────────────────

async function fetchFromBybit(params: KlineParams) {
  await throttle();

  const query = new URLSearchParams({
    category: params.category ?? 'spot',
    symbol: params.symbol,
    interval: params.interval,
    start: String(params.start),
    end: String(params.end),
    limit: String(params.limit ?? BYBIT_MAX_LIMIT),
  });

  const url = `${BYBIT_KLINE_URL}?${query}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Bybit API error: ${response.status}`);
  }

  const json = await response.json();

  if (json.retCode !== 0) {
    throw new Error(`Bybit error [${json.retCode}]: ${json.retMsg}`);
  }

  // Reverse to chronological order (Bybit returns newest first)
  const list = (json.result.list ?? []).reverse();
  return list;
}

// ── Main Handler ─────────────────────────────────────────

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // ── Auth check ──────────────────────────────────
  if (EDGE_API_KEY) {
    const auth = req.headers.get('Authorization');
    if (auth !== `Bearer ${EDGE_API_KEY}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders() },
      );
    }
  }

  try {
    const url = new URL(req.url);
    const params: KlineParams = {
      symbol: url.searchParams.get('symbol') ?? '',
      interval: url.searchParams.get('interval') ?? 'D',
      start: parseInt(url.searchParams.get('start') ?? '0'),
      end: parseInt(url.searchParams.get('end') ?? '0'),
      limit: parseInt(url.searchParams.get('limit') ?? String(BYBIT_MAX_LIMIT)),
      category: url.searchParams.get('category') ?? 'spot',
    };

    // Validate
    if (!params.symbol || !params.start || !params.end) {
      return new Response(
        JSON.stringify({ error: 'Missing required params: symbol, start, end' }),
        { status: 400, headers: corsHeaders() },
      );
    }

    const cacheKey = buildCacheKey(params);

    // ── Try cache ──────────────────────────────────
    const cached = await getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, source: 'cache' }),
        { headers: corsHeaders() },
      );
    }

    // ── Fetch from Bybit ───────────────────────────
    const candles = await fetchFromBybit(params);

    // ── Save to cache ──────────────────────────────
    const ttl = chooseTTL(params.end);
    await setCache(cacheKey, candles, ttl);

    return new Response(
      JSON.stringify({ data: candles, source: 'bybit' }),
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders() },
    );
  }
});

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
}
