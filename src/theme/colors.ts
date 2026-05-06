export const Colors = {
  // Backgrounds
  bgPrimary:       '#050507',
  bgCard:          '#0E0E14',
  bgCardElevated:  '#141420',
  bgCardHighlight: '#18182A',

  // Borders
  border:          '#1E1E2E',
  borderSubtle:    '#161622',

  // Brand Purple
  purple:          '#6C47FF',
  purpleHover:     '#7C5AFF',
  purpleDim:       'rgba(108,71,255,0.12)',
  purpleBorder:    'rgba(108,71,255,0.28)',

  // Accent
  violet:          '#A78BFA',

  // Semantic
  green:           '#00E5A0',
  greenDim:        'rgba(0,229,160,0.12)',
  red:             '#FF4757',
  redDim:          'rgba(255,71,87,0.12)',
  orange:          '#FF9F43',

  // Text
  textPrimary:     '#E8E8F0',
  textSecondary:   '#B0B0C8',
  muted:           '#5C5C7A',

  // Chart
  chart: {
    purple:  '#6C47FF',
    green:   '#00E5A0',
    red:     '#FF4757',
    violet:  '#A78BFA',
    orange:  '#FF9F43',
    blue:    '#48CAE4',
  },

  // System
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
