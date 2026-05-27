import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../services/api/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimePayload<T = Record<string, unknown>> {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: T;
  old?: T;
}

interface UseRealtimeOptions {
  onStrategyChange?: (payload: RealtimePayload) => void;
  onBacktestComplete?: (payload: RealtimePayload) => void;
}

interface RealtimeState {
  isConnected: boolean;
  lastEvent: RealtimePayload | null;
}

export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    lastEvent: null,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Subscribe to all relevant tables
    const channel = supabase
      .channel('microdca-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'strategies' },
        (payload) => {
          const event: RealtimePayload = {
            event: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'strategies',
            data: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown> | undefined,
          };
          setState(prev => ({ ...prev, lastEvent: event }));
          optionsRef.current.onStrategyChange?.(event);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'backtest_results' },
        (payload) => {
          const event: RealtimePayload = {
            event: 'INSERT',
            table: 'backtest_results',
            data: payload.new as Record<string, unknown>,
          };
          setState(prev => ({ ...prev, lastEvent: event }));
          optionsRef.current.onBacktestComplete?.(event);
        },
      )
      .subscribe((status) => {
        setState(prev => ({ ...prev, isConnected: status === 'SUBSCRIBED' }));
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  return { ...state, disconnect };
};
