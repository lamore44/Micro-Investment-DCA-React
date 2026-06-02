import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';
import { useRealtime, RealtimePayload } from './useRealtime';
import { useStrategies } from './useStrategies';

interface NotificationContextValue {
  showNotification: (msg: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current; // Start offscreen (above)
  const { strategies, refresh: refreshStrategies } = useStrategies();

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);

    // Slide down animation
    Animated.spring(slideAnim, {
      toValue: Platform.OS === 'ios' ? 60 : 20, // Final position below status bar
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150, // Slide back offscreen
        duration: 350,
        useNativeDriver: true,
      }).start(() => setNotification(null));
    }, 5000);

    return () => clearTimeout(timer);
  }, [slideAnim]);

  const handleRealtimeEvent = useCallback(
    (payload: RealtimePayload) => {
      const { table, event, data } = payload;
      let asset = (data as any)?.asset;

      if (table === 'backtest_results') {
        const stratId = (data as any)?.strategy_id;
        const matchingStrat = strategies.find(s => s.id === stratId);
        if (matchingStrat) {
          asset = matchingStrat.asset;
        }
      }

      // Skip redundant backtest notification for brand new strategy saves
      if (table === 'backtest_results' && !asset) {
        refreshStrategies();
        return;
      }

      const displayName = asset || 'Unknown';

      if (event === 'INSERT') {
        showNotification(
          `📊 New ${table === 'strategies' ? 'strategy' : 'backtest'}: ${displayName}`,
        );
      } else if (event === 'UPDATE') {
        showNotification(`🔄 ${displayName} strategy updated`);
      }
      refreshStrategies();
    },
    [strategies, refreshStrategies, showNotification],
  );

  // 1. Hook up Supabase Realtime globally
  useRealtime({
    onStrategyChange: handleRealtimeEvent,
    onBacktestComplete: handleRealtimeEvent,
  });

  // 2. Pre-wire Firebase Messaging (FCM) Foreground Listener
  // NOTE FOR ARIL: Once you install @react-native-firebase/app and @react-native-firebase/messaging,
  // and set up the google-services.json / GoogleService-Info.plist config files,
  // you can uncomment the block below to enable foreground push notifications.
  useEffect(() => {
    let unsubscribeFCM: (() => void) | undefined;

    /*
    try {
      const messaging = require('@react-native-firebase/messaging').default;

      unsubscribeFCM = messaging().onMessage(async (remoteMessage: any) => {
        const title = remoteMessage.notification?.title || 'Notification';
        const body = remoteMessage.notification?.body || '';
        showNotification(`🔔 ${title}: ${body}`);
      });
    } catch (e) {
      console.warn('Firebase Messaging failed to initialize:', e);
    }
    */

    return () => {
      if (unsubscribeFCM) {
        unsubscribeFCM();
      }
    };
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <View style={styles.container}>
        {children}
        {notification && (
          <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>📢</Text>
            </View>
            <Text style={styles.text} numberOfLines={2}>
              {notification}
            </Text>
          </Animated.View>
        )}
      </View>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: Spacing.xl,
    width: windowWidth - Spacing.xl * 2,
    backgroundColor: Colors.bgCardElevated,
    borderColor: Colors.purpleBorder,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999, // Floating on top of navigation, headers, etc.
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.purpleDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 16,
  },
  text: {
    ...Typography.bodyS,
    color: Colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
});
