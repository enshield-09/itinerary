import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
const tintColorVibrant = '#FF6B00';

export const Colors = {
  // Common
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  TRANSPARENT: 'transparent',

  // Brand Colors
  PRIMARY: '#0A84FF',
  SECONDARY: '#30D158',
  TERTIARY: '#FF9F0A',

  // Status Colors
  SUCCESS: '#34C759',
  ERROR: '#FF3B30',
  WARNING: '#FF9500',
  INFO: '#5AC8FA',

  // Neutral Shades
  GRAY_100: '#F2F2F7',
  GRAY_200: '#E5E5EA',
  GRAY_300: '#D1D1D6',
  GRAY_400: '#C7C7CC',
  GRAY_500: '#AEAEB2',
  GRAY_600: '#8E8E93',
  GRAY_700: '#636366',
  GRAY_800: '#48484A',
  GRAY_900: '#1C1C1E',

  // Theme-based colors
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#F9FAFB',
    border: '#E5E7EB',
    shadow: '#00000020',
    button: '#0A84FF',
    gradient: ['#4facfe', '#00f2fe'],
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1C1C1E',
    border: '#2C2C2E',
    shadow: '#00000060',
    button: '#0A84FF',
    gradient: ['#434343', '#000000'],
  },
  vibrant: {
    text: '#FFFFFF',
    background: '#1E1E2E',
    tint: tintColorVibrant,
    icon: '#FFD580',
    tabIconDefault: '#FFD580',
    tabIconSelected: tintColorVibrant,
    card: '#26263A',
    border: '#FF6B00',
    shadow: '#FF6B0060',
    button: '#FF6B00',
    gradient: ['#FF6B00', '#FF9F0A'],
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
