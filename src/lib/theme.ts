import { useColorScheme } from 'react-native';

import { kjColors, type KjColors } from './kj-colors.generated';

/** Resolved @kjaniec-dev/design palette for the current scheme, for props that can't take a className (SVG, gradients). */
export function useKj(): KjColors {
  return kjColors[useColorScheme() === 'light' ? 'light' : 'dark'];
}

export function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
