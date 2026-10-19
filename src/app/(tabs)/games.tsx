import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Button, EmptyState, FilterPill, GameCard, PageTitle } from '@/components/ui';
import { PRIORITY_META, STATUS_META, STATUSES } from '@/lib/catalog';
import { bestOffer } from '@/lib/prices';
import { useWishlist } from '@/lib/store';
import { useKj } from '@/lib/theme';
import type { Game, Status } from '@/lib/types';

type Sort = 'updated' | 'created' | 'title' | 'priority' | 'price';

const SORTS: { v: Sort; l: string }[] = [
  { v: 'updated', l: 'Ostatnio zmienione' },
  { v: 'created', l: 'Ostatnio dodane' },
  { v: 'title', l: 'Tytuł A–Z' },
  { v: 'priority', l: 'Priorytet' },
  { v: 'price', l: 'Najtańsze' },
];

const SORTERS: Record<Sort, (a: Game, b: Game) => number> = {
  updated: (a, b) => b.updatedAt - a.updatedAt,
  created: (a, b) => b.createdAt - a.createdAt,
  title: (a, b) => a.title.localeCompare(b.title, 'pl'),
  priority: (a, b) => PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank,
  price: (a, b) => (bestOffer(a)?.price ?? Infinity) - (bestOffer(b)?.price ?? Infinity),
};

export default function Games() {
  const kj = useKj();
  const { platform: platformParam } = useLocalSearchParams<{ platform?: string }>();
  const { games, platforms, refreshing, refreshAll } = useWishlist();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('updated');
  const [sortOpen, setSortOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);

  // A platform picked from the home screen overrides the local pill selection until the user changes it.
  const activePlatform = platformId ?? platformParam ?? null;

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return games
      .filter((g) => (!activePlatform || g.platformId === activePlatform) && (!status || g.status === status) && (!q || g.title.toLowerCase().includes(q)))
      .sort(SORTERS[sort]);
  }, [games, activePlatform, status, search, sort]);

  const platformOf = (id: string) => platforms.find((p) => p.id === id);

  return (
    <View className="flex-1 bg-canvas">
      <Screen refreshing={refreshing.length > 0} onRefresh={refreshAll} bottomPadding={96}>
        <PageTitle title="Gry" right={<Text className="text-muted-foreground" style={{ fontSize: 13 }}>{list.length} z {games.length}</Text>} />

        <View style={{ paddingHorizontal: 18, paddingBottom: 12 }}>
          <View className="flex-row items-center rounded-xl border border-border bg-card" style={{ gap: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Icon name="search" size={16} stroke={2} color={kj.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Szukaj tytułu…"
              placeholderTextColor={kj.mutedForeground}
              className="flex-1 text-foreground"
              style={{ fontSize: 14, paddingVertical: 8 }}
            />
            <Pressable
              onPress={() => setSortOpen((o) => !o)}
              className="flex-row items-center rounded-lg border border-border bg-elevated"
              style={{ gap: 4, paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <Icon name="filter" size={11} stroke={2} color={kj.mutedForeground} />
              <Text className="text-muted-foreground" style={{ fontSize: 11, fontWeight: '600' }}>
                Sortuj
              </Text>
            </Pressable>
          </View>
          {sortOpen && (
            <View className="flex-row flex-wrap" style={{ marginTop: 6, gap: 6 }}>
              {SORTS.map((o) => (
                <FilterPill
                  key={o.v}
                  label={o.l}
                  active={sort === o.v}
                  onPress={() => {
                    setSort(o.v);
                    setSortOpen(false);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 6, paddingBottom: 6 }}>
          <FilterPill label="Wszystkie" active={!activePlatform} onPress={() => { setPlatformId(null); router.setParams({ platform: undefined }); }} />
          {platforms.filter((p) => p.enabled).map((p) => (
            <FilterPill key={p.id} label={p.name} color={p.color} active={activePlatform === p.id} onPress={() => setPlatformId(p.id)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 6, paddingTop: 4, paddingBottom: 14 }}>
          <FilterPill label="Dowolny status" active={!status} onPress={() => setStatus(null)} />
          {STATUSES.map((s) => (
            <FilterPill key={s} label={STATUS_META[s].label} color={STATUS_META[s].color} active={status === s} onPress={() => setStatus(s)} />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 18, gap: 8 }}>
          {list.length === 0 ? (
            <EmptyState
              title="Brak gier"
              text="Zmień filtry albo dodaj nowy tytuł do wishlisty."
              action={<Button full={false} icon="plus" onPress={() => router.push('/form')}>Dodaj grę</Button>}
            />
          ) : (
            list.map((g) => <GameCard key={g.id} game={g} platform={platformOf(g.platformId)} />)
          )}
        </View>
      </Screen>

      <Pressable
        onPress={() => router.push('/form')}
        accessibilityLabel="Dodaj grę"
        className="absolute items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{ right: 18, bottom: 18, width: 56, height: 56, elevation: 6 }}
      >
        <Icon name="plus" size={26} stroke={2.4} color={kj.primaryForeground} />
      </Pressable>
    </View>
  );
}
