export type StoreId = 'ceneo' | 'allegro' | 'ggdeals';
export type Status = 'want' | 'bought' | 'playing' | 'finished' | 'dropped';
export type Priority = 'high' | 'medium' | 'low';
export type PlatformType = 'pc' | 'console' | 'handheld' | 'retro';

export interface PricePoint {
  t: number;
  price: number;
}

export interface Offer {
  url: string;
  price?: number;
  history: PricePoint[];
  checkedAt?: number;
  error?: string;
}

export interface Game {
  id: string;
  title: string;
  platformId: string;
  status: Status;
  priority: Priority;
  notes?: string;
  customSearchQuery?: string;
  /** Alert threshold in PLN: the game is a "deal" when the best offer is at or below it. */
  targetPrice?: number;
  offers: Partial<Record<StoreId, Offer>>;
  createdAt: number;
  updatedAt: number;
}

export interface Platform {
  id: string;
  name: string;
  short: string;
  type: PlatformType;
  color: string;
  enabled: boolean;
}
