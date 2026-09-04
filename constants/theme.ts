import { TextStyle, ViewStyle } from 'react-native';

/**
 * Arena Play design language: soft, light, 3D.
 * Teal/mint accents on an off-white ground with layered soft shadows.
 */
export const colors = {
  // Grounds
  bg: '#EAF4F0',
  bgAlt: '#F2F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F6F4',

  // Brand / accents
  primary: '#0FB89B',
  primaryDark: '#0A9A82',
  primaryLight: '#5FD9C4',
  mint: '#C9F0E6',
  accent: '#14B8A6',

  // Semantic
  success: '#22C55E',
  danger: '#F26D6D',
  warning: '#F5A623',
  info: '#4B9FE1',
  coin: '#F5B301',

  // Text
  text: '#0F2E28',
  textMuted: '#5B7570',
  textFaint: '#9CB3AD',
  onPrimary: '#FFFFFF',

  // Lines / shadow
  border: '#DCEAE5',
  shadow: '#0A9A82',
  shadowSoft: '#7FB8AC',
};

export const gradients = {
  primary: ['#12C7A6', '#0AA588'] as const,
  mint: ['#DFF7EF', '#C4EEDF'] as const,
  header: ['#14C2A4', '#0E9E86'] as const,
  gold: ['#FBD24B', '#F5A623'] as const,
  danger: ['#FF8C8C', '#F04E4E'] as const,
  card: ['#FFFFFF', '#F3FAF7'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const font = {
  h1: { fontSize: 26, fontWeight: '800' } as TextStyle,
  h2: { fontSize: 21, fontWeight: '800' } as TextStyle,
  h3: { fontSize: 17, fontWeight: '700' } as TextStyle,
  body: { fontSize: 15, fontWeight: '500' } as TextStyle,
  small: { fontSize: 13, fontWeight: '500' } as TextStyle,
  tiny: { fontSize: 11, fontWeight: '600' } as TextStyle,
};

/** Layered soft shadow for the "3D" raised look. */
export const shadow = {
  sm: {
    shadowColor: colors.shadowSoft,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,
  md: {
    shadowColor: colors.shadowSoft,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 14,
  } as ViewStyle,
};

export const theme = { colors, gradients, spacing, radius, font, shadow };
export default theme;
