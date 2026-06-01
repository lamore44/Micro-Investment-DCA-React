import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface ConfidenceBadgeProps {
  probability: number; // 0–100
}

function getConfig(p: number) {
  if (p >= 65) {
    return {
      label: 'HIGH CONFIDENCE',
      color: Colors.green,
      bg: Colors.greenDim,
      border: `${Colors.green}33`,
    };
  }
  if (p >= 45) {
    return {
      label: 'MODERATE',
      color: Colors.orange,
      bg: 'rgba(255,159,67,0.12)',
      border: 'rgba(255,159,67,0.2)',
    };
  }
  return {
    label: 'LOW CONFIDENCE',
    color: Colors.red,
    bg: Colors.redDim,
    border: `${Colors.red}33`,
  };
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  probability,
}) => {
  const cfg = getConfig(probability);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
      <Text style={[styles.value, { color: cfg.color }]}>
        {probability.toFixed(1)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...Typography.label,
    fontSize: 10,
  },
  value: {
    ...Typography.valueS,
    fontSize: 13,
  },
});
