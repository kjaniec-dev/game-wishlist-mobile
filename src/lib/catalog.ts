import type { Platform, Priority, Status, StoreId } from './types';

export const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'pc', name: 'PC', short: 'PC', type: 'pc', color: '#94a3b8', enabled: true },
  { id: 'steam', name: 'Steam', short: 'Steam', type: 'pc', color: '#60a5fa', enabled: true },
  { id: 'steam-deck', name: 'Steam Deck', short: 'Deck', type: 'handheld', color: '#f59e0b', enabled: false },
  { id: 'ps5', name: 'PlayStation 5', short: 'PS5', type: 'console', color: '#3b82f6', enabled: true },
  { id: 'ps4', name: 'PlayStation 4', short: 'PS4', type: 'console', color: '#1d4ed8', enabled: false },
  { id: 'xbox-series', name: 'Xbox Series X/S', short: 'Xbox', type: 'console', color: '#22c55e', enabled: false },
  { id: 'xbox-one', name: 'Xbox One', short: 'Xbox One', type: 'console', color: '#16a34a', enabled: false },
  { id: 'switch', name: 'Nintendo Switch', short: 'Switch', type: 'handheld', color: '#ef4444', enabled: true },
  { id: 'switch-2', name: 'Nintendo Switch 2', short: 'Switch 2', type: 'handheld', color: '#dc2626', enabled: true },
  { id: '3ds', name: 'Nintendo 3DS', short: '3DS', type: 'handheld', color: '#f97316', enabled: false },
  { id: 'vita', name: 'PS Vita', short: 'Vita', type: 'handheld', color: '#0ea5e9', enabled: false },
  { id: 'retro', name: 'Custom / Retro', short: 'Retro', type: 'retro', color: '#a78bfa', enabled: false },
];

export const PLATFORM_GROUPS: { type: Platform['type']; label: string }[] = [
  { type: 'pc', label: 'PC' },
  { type: 'console', label: 'Konsole' },
  { type: 'handheld', label: 'Handheldy' },
  { type: 'retro', label: 'Retro / własne' },
];

export const STATUSES: Status[] = ['want', 'bought', 'playing', 'finished', 'dropped'];

export const STATUS_META: Record<Status, { label: string; short: string; color: string; dim: string }> = {
  want: { label: 'Chcę', short: 'Chcę', color: '#a78bfa', dim: '#7c3aed' },
  bought: { label: 'Kupiona', short: 'Kupiona', color: '#fbbf24', dim: '#b45309' },
  playing: { label: 'Gram', short: 'Gram', color: '#34d399', dim: '#047857' },
  finished: { label: 'Ukończona', short: 'Skończ.', color: '#94a3b8', dim: '#475569' },
  dropped: { label: 'Porzucona', short: 'Rzucona', color: '#64748b', dim: '#334155' },
};

export const PRIORITY_META: Record<Priority, { label: string; pips: number; rank: number }> = {
  high: { label: 'Wysoki', pips: 3, rank: 0 },
  medium: { label: 'Średni', pips: 2, rank: 1 },
  low: { label: 'Niski', pips: 1, rank: 2 },
};

/** Stores whose prices are tracked in the app. */
export const TRACKED_STORES: StoreId[] = ['ceneo', 'allegro', 'ggdeals'];

export const STORE_META: Record<
  StoreId,
  { name: string; domain: string; hosts: string[]; colors: [string, string]; mark: string; placeholder: string }
> = {
  ceneo: {
    name: 'Ceneo',
    domain: 'ceneo.pl',
    hosts: ['ceneo.pl'],
    colors: ['#f4ca16', '#d68f00'],
    mark: 'C',
    placeholder: 'https://www.ceneo.pl/123456',
  },
  allegro: {
    name: 'Allegro',
    domain: 'allegro.pl',
    hosts: ['allegro.pl'],
    colors: ['#ff5a00', '#ff8a00'],
    mark: 'a',
    placeholder: 'https://allegro.pl/oferta/...',
  },
  ggdeals: {
    name: 'GG.deals',
    domain: 'gg.deals',
    hosts: ['gg.deals'],
    colors: ['#00b67a', '#008b5d'],
    mark: 'gg',
    placeholder: 'https://gg.deals/pl/game/...',
  },
};

/** "Find offers" shortcuts from the design: the first three are the tracked stores. */
export const SEARCH_PROVIDERS: {
  id: string;
  name: string;
  domain: string;
  colors: [string, string];
  mark: string;
  search: (q: string) => string;
}[] = [
  { id: 'allegro', name: 'Allegro', domain: 'allegro.pl', colors: ['#ff5a00', '#ff8a00'], mark: 'a', search: (q) => `https://allegro.pl/listing?string=${q}` },
  { id: 'ceneo', name: 'Ceneo', domain: 'ceneo.pl', colors: ['#f4ca16', '#d68f00'], mark: 'C', search: (q) => `https://www.ceneo.pl/;szukaj-${q}` },
  { id: 'ggdeals', name: 'GG.deals', domain: 'gg.deals', colors: ['#00b67a', '#008b5d'], mark: 'gg', search: (q) => `https://gg.deals/games/?title=${q}` },
  { id: 'lowcygier', name: 'Łowcy Gier', domain: 'lowcygier.pl', colors: ['#dc2626', '#9b1c1c'], mark: 'ŁG', search: (q) => `https://lowcygier.pl/?s=${q}` },
  { id: 'pepper', name: 'Pepper', domain: 'pepper.pl', colors: ['#e8112d', '#a30d22'], mark: 'P', search: (q) => `https://www.pepper.pl/search?q=${q}` },
  { id: 'psprices', name: 'PSPrices', domain: 'psprices.com', colors: ['#003791', '#006fcd'], mark: 'PSP', search: (q) => `https://psprices.com/region-pl/search/?q=${q}` },
  { id: 'deku', name: 'DekuDeals', domain: 'dekudeals.com', colors: ['#00c2a8', '#00807a'], mark: 'D', search: (q) => `https://www.dekudeals.com/search?q=${q}` },
  { id: 'google', name: 'Google', domain: 'google.com', colors: ['#4285f4', '#34a853'], mark: 'G', search: (q) => `https://www.google.com/search?q=${q}` },
];

const COVER_PALETTES: [string, string][] = [
  ['#7c2d12', '#fbbf24'],
  ['#0c4a6e', '#f59e0b'],
  ['#1e1b4b', '#facc15'],
  ['#064e3b', '#a3e635'],
  ['#581c87', '#ec4899'],
  ['#7f1d1d', '#fb923c'],
  ['#0c0a09', '#dc2626'],
  ['#1e3a8a', '#22d3ee'],
  ['#365314', '#fde047'],
  ['#831843', '#fbcfe8'],
  ['#172554', '#60a5fa'],
  ['#3b0764', '#c084fc'],
];

/** No real art, so covers are two-stop gradients keyed off the title. */
export function coverFor(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COVER_PALETTES[h % COVER_PALETTES.length];
}
