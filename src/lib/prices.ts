import { STORE_META } from './catalog';
import type { Game, Offer, PricePoint, StoreId } from './types';

const DAY = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 30;
/** Max points kept per offer; oldest are dropped first. */
const HISTORY_LIMIT = 180;

export const priceApiUrl = process.env.EXPO_PUBLIC_PRICE_API_URL?.replace(/\/+$/, '') || undefined;
export const isDemoPrices = !priceApiUrl;

export function detectStore(url: string): StoreId | undefined {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return (Object.keys(STORE_META) as StoreId[]).find((id) =>
      STORE_META[id].hosts.some((h) => host === h || host.endsWith(`.${h}`)),
    );
  } catch {
    return undefined;
  }
}

export function formatPLN(value: number | undefined): string {
  if (value === undefined) return '—';
  return `${value.toFixed(2).replace('.', ',')} zł`;
}

export function parsePLN(text: string): number | undefined {
  const n = Number(text.replace(/\s/g, '').replace(',', '.').replace(/zł$/i, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
}

// ── Price source ────────────────────────────────────────────────────────
// Real prices come from a backend implementing `GET {EXPO_PUBLIC_PRICE_API_URL}/price?store=&url=`
// that answers `{ "price": 129.99 }` (or `{ "price": null }` when the offer has no price).
// Without it the app falls back to deterministic demo prices.

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

function demoPriceAt(url: string, t: number): number {
  const h = hash(url);
  const base = 60 + (h % 240);
  const bucket = Math.floor(t / (6 * 60 * 60 * 1000));
  const noise = (hash(`${url}:${bucket}`) % 1000) / 1000; // 0..1, stable per 6h bucket
  const dip = hash(`${url}:${Math.floor(bucket / 9)}`) % 4 === 0 ? 0.78 : 1; // occasional sale
  return Math.max(9.99, Math.round(base * (0.82 + noise * 0.2) * dip) - 0.01);
}

export async function fetchPrice(store: StoreId, url: string): Promise<number | null> {
  if (!priceApiUrl) {
    await new Promise((r) => setTimeout(r, 250));
    return demoPriceAt(url, Date.now());
  }
  const res = await fetch(`${priceApiUrl}/price?store=${store}&url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Serwer cen odpowiedział ${res.status}`);
  const body = (await res.json()) as { price?: number | null };
  return typeof body.price === 'number' ? body.price : null;
}

/** Demo mode only: lets a freshly added link show a chart straight away. */
export function demoHistory(url: string, now = Date.now()): PricePoint[] {
  if (!isDemoPrices) return [];
  const points: PricePoint[] = [];
  for (let d = HISTORY_DAYS; d >= 1; d -= 2) points.push({ t: now - d * DAY, price: demoPriceAt(url, now - d * DAY) });
  return points;
}

export function recordPrice(offer: Offer, price: number | null, now = Date.now()): Offer {
  if (price === null) return { ...offer, price: undefined, checkedAt: now, error: 'Brak ceny w ofercie' };
  const last = offer.history[offer.history.length - 1];
  // Skip duplicate readings taken within the hour at the same price.
  const history =
    last && last.price === price && now - last.t < 60 * 60 * 1000
      ? offer.history
      : [...offer.history, { t: now, price }].slice(-HISTORY_LIMIT);
  return { ...offer, price, history, checkedAt: now, error: undefined };
}

// ── Derived data ────────────────────────────────────────────────────────
export interface StorePrice {
  store: StoreId;
  offer: Offer;
  price: number;
}

export function pricedOffers(game: Game): StorePrice[] {
  return (Object.entries(game.offers) as [StoreId, Offer][])
    .filter((e): e is [StoreId, Offer & { price: number }] => e[1].price !== undefined)
    .map(([store, offer]) => ({ store, offer, price: offer.price }));
}

export function bestOffer(game: Game): StorePrice | undefined {
  return pricedOffers(game).sort((a, b) => a.price - b.price)[0];
}

export function lowestEver(offer: Offer): number | undefined {
  return offer.history.length ? Math.min(...offer.history.map((p) => p.price)) : undefined;
}

export function isDeal(game: Game): boolean {
  const best = bestOffer(game);
  return !!best && game.targetPrice !== undefined && best.price <= game.targetPrice;
}

/** Change vs the previous distinct reading, as a fraction (negative = cheaper). */
export function lastChange(offer: Offer): number | undefined {
  const h = offer.history;
  if (h.length < 2) return undefined;
  const cur = h[h.length - 1].price;
  for (let i = h.length - 2; i >= 0; i--) {
    if (h[i].price !== cur) return (cur - h[i].price) / h[i].price;
  }
  return undefined;
}
