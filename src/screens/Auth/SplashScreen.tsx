import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../theme';

interface Props { navigation: any; }

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const tagAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start(() => {
      // Tagline fade in
      Animated.timing(tagAnim, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }).start();
      // Navigate after 2.2s — session already loaded by AuthProvider
      setTimeout(() => {
        // If already logged in, AppNavigator will show Main tabs
        navigation.replace('Login');
      }, 2200);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logoBadge,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.logoMu}>μ</Text>
        </Animated.View>

        <Animated.Text style={[styles.appName, { opacity: fadeAnim }]}>
          Micro<Text style={styles.purple}>DCA</Text>
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: tagAnim }]}>
          Simulate. Backtest. Project.
        </Animated.Text>
      </View>

      <Animated.View style={[styles.footer, { opacity: tagAnim }]}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoMu: {
    fontSize: 38,
    color: Colors.white,
    fontWeight: '800',
  },
  appName: {
    ...Typography.displayL,
    letterSpacing: -1,
    marginBottom: 10,
  },
  purple: {
    color: Colors.purple,
  },
  tagline: {
    ...Typography.caption,
    letterSpacing: 2,
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 40,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.purple,
    width: 18,
    borderRadius: 3,
  },
});
