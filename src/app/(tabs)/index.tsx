import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Button, EmptyState, GameCard, SectionHeader, StatTile } from '@/components/ui';
import { isDeal } from '@/lib/prices';
import { useWishlist } from '@/lib/store';
import { useKj } from '@/lib/theme';

export default function Home() {
  const kj = useKj();
  const { games, platforms, refreshing, refreshAll, loadDemo } = useWishlist();

  const byStatus = (s: string) => games.filter((g) => g.status === s).length;
  const deals = games.filter((g) => isDeal(g) && g.status === 'want');
  const priority = games.filter((g) => g.priority === 'high' && (g.status === 'want' || g.status === 'playing'));
  const recent = [...games].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  const enabled = platforms.filter((p) => p.enabled);
  const byPlatform = enabled
    .map((p) => ({ ...p, count: games.filter((g) => g.platformId === p.id).length }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);
  const platformOf = (id: string) => platforms.find((p) => p.id === id);

  const date = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen refreshing={refreshing.length > 0} onRefresh={refreshAll}>
      <View style={{ paddingHorizontal: 18, gap: 22 }}>
        <View>
          <Text className="text-muted-foreground" style={{ fontSize: 13, fontWeight: '500' }}>
            {date}
          </Text>
          <Text className="text-foreground" style={{ fontSize: 30, fontWeight: '700', letterSpacing: -1.2, marginTop: 4 }}>
            Twoja wishlista
          </Text>
        </View>

        {games.length === 0 ? (
          <EmptyState
            title="Wishlista jest pusta"
            text="Dodaj grę i podepnij linki do Ceneo, Allegro lub GG.deals, a aplikacja będzie pilnować ceny."
            action={
              <View style={{ gap: 8, alignSelf: 'stretch' }}>
                <Button icon="plus" onPress={() => router.push('/form')}>Dodaj grę</Button>
                <Button variant="ghost" onPress={loadDemo}>Załaduj dane demo</Button>
              </View>
            }
          />
        ) : (
          <>
            <View className="flex-row" style={{ gap: 10 }}>
              <StatTile label="Razem" value={games.length} sub={`${enabled.length} platform`} icon="list" accent />
              <StatTile label="Chcę" value={byStatus('want')} sub={`${priority.length} priorytet`} icon="star" />
              <StatTile label="Okazje" value={deals.length} sub="poniżej celu" icon="tag" />
            </View>

            {deals.length > 0 && (
              <View>
                <SectionHeader
                  title="Okazje"
                  action={
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Icon name="trendDown" size={12} stroke={2} color={kj.success} />
                      <Text className="text-success" style={{ fontSize: 12, fontWeight: '600' }}>
                        {deals.length} {deals.length === 1 ? 'gra' : 'gry'}
                      </Text>
                    </View>
                  }
                />
                <View style={{ gap: 8 }}>
                  {deals.slice(0, 3).map((g) => (
                    <GameCard key={g.id} game={g} platform={platformOf(g.platformId)} />
                  ))}
                </View>
              </View>
            )}

            {byPlatform.length > 0 && (
              <View>
                <SectionHeader
                  title="Według platformy"
                  action={
                    <Pressable onPress={() => router.navigate('/platforms')}>
                      <Text className="text-primary" style={{ fontSize: 12, fontWeight: '600' }}>
                        Zarządzaj
                      </Text>
                    </Pressable>
                  }
                />
                <View style={{ gap: 6 }}>
                  {byPlatform.slice(0, 5).map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => router.navigate({ pathname: '/games', params: { platform: p.id } })}
                      className="flex-row items-center rounded-xl border border-border bg-card active:opacity-80"
                      style={{ gap: 12, paddingHorizontal: 12, paddingVertical: 10 }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: p.color }} />
                      <Text className="text-foreground" style={{ fontSize: 14, fontWeight: '500' }}>
                        {p.name}
                      </Text>
                      <View className="flex-1 overflow-hidden rounded-full" style={{ height: 4, backgroundColor: kj.border }}>
                        <View
                          style={{ width: `${(p.count / byPlatform[0].count) * 100}%`, height: 4, backgroundColor: p.color, opacity: 0.7 }}
                        />
                      </View>
                      <Text className="text-muted-foreground" style={{ fontSize: 13, fontWeight: '600', minWidth: 22, textAlign: 'right' }}>
                        {p.count}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {priority.length > 0 && (
              <View>
                <SectionHeader
                  title="Wysoki priorytet"
                  action={
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Icon name="flame" size={12} stroke={2} color={kj.primary} />
                      <Text className="text-primary" style={{ fontSize: 12 }}>
                        {priority.length} gier
                      </Text>
                    </View>
                  }
                />
                <View style={{ gap: 8 }}>
                  {priority.slice(0, 3).map((g) => (
                    <GameCard key={g.id} game={g} platform={platformOf(g.platformId)} />
                  ))}
                </View>
              </View>
            )}

            <View>
              <SectionHeader title="Ostatnio zmienione" />
              <View style={{ gap: 8 }}>
                {recent.map((g) => (
                  <GameCard key={g.id} game={g} platform={platformOf(g.platformId)} compact />
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
