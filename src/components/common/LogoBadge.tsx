import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

interface LogoBadgeProps {
  size?: number;
  fontSize?: number;
}

export const LogoBadge: React.FC<LogoBadgeProps> = ({
  size = 40,
  fontSize = 17,
}) => (
  <View style={[styles.badge, { width: size, height: size, borderRadius: Radius.sm }]}>
    <Text style={[styles.text, { fontSize }]}>μ</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.white,
    fontWeight: '800',
  },
});
