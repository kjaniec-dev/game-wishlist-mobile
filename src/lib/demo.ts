import { demoHistory } from './prices';
import type { Game, Priority, Status, StoreId } from './types';

const DAY = 24 * 60 * 60 * 1000;

interface Seed {
  title: string;
  platformId: string;
  status: Status;
  priority: Priority;
  notes?: string;
  targetPrice?: number;
  stores: StoreId[];
}

const SEEDS: Seed[] = [
  { title: 'Cyberpunk 2077: Phantom Liberty', platformId: 'ps5', status: 'want', priority: 'high', notes: 'Czekam na cenę poniżej 150 zł.', targetPrice: 150, stores: ['ceneo', 'allegro', 'ggdeals'] },
  { title: 'Hollow Knight: Silksong', platformId: 'switch-2', status: 'want', priority: 'high', notes: 'Day one, bez czekania na promocję.', targetPrice: 120, stores: ['ceneo', 'allegro'] },
  { title: 'Doom: The Dark Ages', platformId: 'pc', status: 'want', priority: 'medium', notes: 'Letnia wyprzedaż na Steamie.', targetPrice: 180, stores: ['ggdeals', 'ceneo'] },
  { title: 'Final Fantasy VII Rebirth', platformId: 'ps5', status: 'playing', priority: 'high', stores: ['allegro'] },
  { title: 'Elden Ring: Shadow of the Erdtree', platformId: 'ps5', status: 'bought', priority: 'medium', notes: 'Kupione za 199 zł.', stores: [] },
];

const urlFor = (store: StoreId, title: string) => {
  const slug = encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  return {
    ceneo: `https://www.ceneo.pl/${slug}`,
    allegro: `https://allegro.pl/oferta/${slug}`,
    ggdeals: `https://gg.deals/pl/game/${slug}/`,
  }[store];
};

/** Sample data so a fresh install has something to look at. Prices are refreshed on first open. */
export function demoGames(): Game[] {
  const now = Date.now();
  return SEEDS.map((s, i) => ({
    id: `demo-${i}`,
    title: s.title,
    platformId: s.platformId,
    status: s.status,
    priority: s.priority,
    notes: s.notes,
    targetPrice: s.targetPrice,
    offers: Object.fromEntries(
      s.stores.map((store) => {
        const url = urlFor(store, s.title);
        return [store, { url, history: demoHistory(url, now) }];
      }),
    ),
    createdAt: now - (i + 3) * DAY,
    updatedAt: now - i * DAY,
  }));
}
