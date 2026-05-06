import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../theme';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = Colors.muted,
  bgColor = Colors.bgCard,
  style,
}) => (
  <View style={[styles.badge, { backgroundColor: bgColor, borderColor: Colors.border }, style]}>
    <Text style={[styles.text, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
  },
});
