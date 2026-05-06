import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme';

export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.line, style]} />
);

const styles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
  },
});
