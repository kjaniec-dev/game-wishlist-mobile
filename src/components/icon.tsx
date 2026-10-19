import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Stroke icons ported from the design (24x24 grid, currentColor -> explicit color).
const SHAPES: Record<string, (color: string) => ReactNode> = {
  home: () => <Path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  list: (c) => (
    <>
      <Path d="M8 6h13M8 12h13M8 18h13" />
      <Circle cx="4" cy="6" r="1" fill={c} />
      <Circle cx="4" cy="12" r="1" fill={c} />
      <Circle cx="4" cy="18" r="1" fill={c} />
    </>
  ),
  cog: () => (
    <>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  plus: () => <Path d="M12 5v14M5 12h14" />,
  search: () => (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="m20 20-3.5-3.5" />
    </>
  ),
  filter: () => <Path d="M3 5h18M6 12h12M10 19h4" />,
  back: () => <Path d="m15 18-6-6 6-6" />,
  chev: () => <Path d="m9 6 6 6-6 6" />,
  edit: () => (
    <>
      <Path d="M11 4H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-7" />
      <Path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
    </>
  ),
  trash: () => (
    <>
      <Path d="M3 6h18" />
      <Path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <Path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
      <Path d="M10 11v6M14 11v6" />
    </>
  ),
  external: () => (
    <>
      <Path d="M15 3h6v6" />
      <Path d="M10 14 21 3" />
      <Path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" />
    </>
  ),
  link: () => (
    <>
      <Path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <Path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </>
  ),
  star: () => <Path d="m12 3 2.7 5.7 6.3.9-4.5 4.4 1 6.3L12 17.3 6.5 20.3l1-6.3L3 9.6l6.3-.9z" />,
  check: () => <Path d="m5 12 5 5L20 7" />,
  close: () => <Path d="M6 6l12 12M18 6 6 18" />,
  flame: () => <Path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-2 1-5 1-9z" />,
  clock: () => (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  download: () => (
    <>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="m7 10 5 5 5-5" />
      <Path d="M12 15V3" />
    </>
  ),
  moon: () => <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  controller: (c) => (
    <>
      <Path d="M6 7h12a4 4 0 0 1 4 4v3a4 4 0 0 1-7 2.6L13 15h-2l-2 1.6A4 4 0 0 1 2 14v-3a4 4 0 0 1 4-4z" />
      <Path d="M7 11v3M5.5 12.5h3" />
      <Circle cx="16" cy="11" r="0.8" fill={c} />
      <Circle cx="18" cy="13" r="0.8" fill={c} />
    </>
  ),
  bolt: () => <Path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  refresh: () => (
    <>
      <Path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <Path d="M3 21v-5h5" />
      <Path d="M3 12A9 9 0 0 1 18.5 5.8L21 8" />
      <Path d="M21 3v5h-5" />
    </>
  ),
  tag: (c) => (
    <>
      <Path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <Circle cx="7.5" cy="7.5" r="1" fill={c} />
    </>
  ),
  trendDown: () => (
    <>
      <Path d="m22 17-8.5-8.5-5 5L2 7" />
      <Path d="M16 17h6v-6" />
    </>
  ),
  trendUp: () => (
    <>
      <Path d="m22 7-8.5 8.5-5-5L2 17" />
      <Path d="M16 7h6v6" />
    </>
  ),
  bell: () => (
    <>
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
};

export type IconName = keyof typeof SHAPES;

export function Icon({
  name,
  size = 22,
  stroke = 1.75,
  color,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  color: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {SHAPES[name](color)}
    </Svg>
  );
}
