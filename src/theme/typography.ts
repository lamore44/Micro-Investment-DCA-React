import { Platform, TextStyle } from 'react-native';
import { Colors } from './colors';

const base = Platform.OS === 'android' ? 'sans-serif' : 'System';
const mono  = Platform.OS === 'android' ? 'monospace'   : 'Courier New';

export const Typography = {
  // Display
  displayXL: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: Colors.textPrimary,
    fontFamily: base,
  } as TextStyle,

  displayL: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: Colors.textPrimary,
    fontFamily: base,
  } as TextStyle,

  displayM: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    fontFamily: base,
  } as TextStyle,

  // Headings
  h1: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Colors.textPrimary,
    fontFamily: base,
  } as TextStyle,

  h2: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Colors.textPrimary,
    fontFamily: base,
  } as TextStyle,

  h3: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: Colors.textPrimary,
    fontFamily: base,
  } as TextStyle,

  // Body
  bodyL: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textPrimary,
    fontFamily: base,
  } as TextStyle,

  body: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textPrimary,
    fontFamily: base,
  } as TextStyle,

  bodyS: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    fontFamily: base,
  } as TextStyle,

  caption: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: Colors.muted,
    fontFamily: base,
  } as TextStyle,

  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    color: Colors.muted,
    fontFamily: base,
  } as TextStyle,

  // Monospace values
  valueBig: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: mono,
    color: Colors.textPrimary,
  } as TextStyle,

  valueM: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: mono,
    color: Colors.textPrimary,
  } as TextStyle,

  valueS: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: mono,
    color: Colors.textPrimary,
  } as TextStyle,

  valueTiny: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: mono,
    color: Colors.muted,
  } as TextStyle,
} as const;
