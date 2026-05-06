import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  highlight?: boolean;
  purple?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  highlight = false,
  purple = false,
}) => (
  <View
    style={[
      styles.card,
      highlight && styles.cardHighlight,
      purple  && styles.cardPurple,
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHighlight: {
    backgroundColor: Colors.bgCardElevated,
    borderColor: Colors.purpleBorder,
  },
  cardPurple: {
    backgroundColor: Colors.purple,
    borderWidth: 0,
  },
});
