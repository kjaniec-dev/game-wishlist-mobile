import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { PageTitle } from '@/components/ui';
import { isDemoPrices, priceApiUrl } from '@/lib/prices';
import { useWishlist } from '@/lib/store';
import { useKj, withAlpha } from '@/lib/theme';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="text-muted-foreground" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: 4, paddingBottom: 8 }}>
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-card">{children}</View>
    </View>
  );
}

function Row({ icon, label, sub, value, onPress, danger = false, last = false }: { icon: IconName; label: string; sub?: string; value?: string; onPress?: () => void; danger?: boolean; last?: boolean }) {
  const kj = useKj();
  const tint = danger ? kj.danger : kj.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center active:opacity-70"
      style={{ gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: kj.border }}
    >
      <View className="items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: danger ? withAlpha(kj.danger, 0.15) : kj.bgElevated }}>
        <Icon name={icon} size={15} stroke={2} color={tint} />
      </View>
      <View className="flex-1">
        <Text style={{ fontSize: 14, fontWeight: '600', color: danger ? kj.danger : kj.foreground }}>{label}</Text>
        {sub && (
          <Text className="text-muted-foreground" style={{ fontSize: 11.5, marginTop: 1 }}>
            {sub}
          </Text>
        )}
      </View>
      {value && (
        <Text className="text-muted-foreground" style={{ fontSize: 13 }}>
          {value}
        </Text>
      )}
      {onPress && <Icon name="chev" size={14} stroke={2} color={kj.mutedForeground} />}
    </Pressable>
  );
}

export default function Settings() {
  const { games, platforms, refreshing, lastRefreshAll, refreshAll, loadDemo, reset } = useWishlist();
  const offers = games.reduce((n, g) => n + Object.keys(g.offers).length, 0);

  const exportJson = () =>
    Share.share({ title: 'game-wishlist.json', message: JSON.stringify({ version: 1, games, platforms }, null, 2) });

  const confirmReset = () =>
    Alert.alert('Usunąć wszystkie dane?', 'Gry, linki i historia cen zostaną trwale usunięte.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: reset },
    ]);

  return (
    <Screen>
      <PageTitle title="Ustawienia" />
      <View style={{ paddingHorizontal: 18, gap: 18 }}>
        <Group title="Ceny">
          <Row
            icon="refresh"
            label="Odśwież wszystkie ceny"
            sub={
              refreshing.length > 0
                ? 'Trwa odświeżanie…'
                : lastRefreshAll
                  ? `Ostatnio: ${new Date(lastRefreshAll).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}`
                  : `${offers} śledzonych ofert`
            }
            onPress={refreshAll}
          />
          <Row
            icon="tag"
            label="Źródło cen"
            sub={isDemoPrices ? 'Tryb demo: ceny są symulowane. Ustaw EXPO_PUBLIC_PRICE_API_URL.' : priceApiUrl}
            value={isDemoPrices ? 'Demo' : 'API'}
            last
          />
        </Group>

        <Group title="Dane">
          <Row icon="download" label="Eksport do JSON" sub={`${games.length} gier, ${platforms.filter((p) => p.enabled).length} platform`} onPress={exportJson} />
          <Row icon="star" label="Załaduj dane demo" sub="Dodaje przykładowe gry z cenami" onPress={loadDemo} last />
        </Group>

        <Group title="Aplikacja">
          <Row icon="controller" label="Zarządzaj platformami" sub={`${platforms.filter((p) => p.enabled).length} włączonych`} onPress={() => router.navigate('/platforms')} />
          <Row icon="moon" label="Wygląd" sub="Motyw @kjaniec-dev/design" value="Ciemny" last />
        </Group>

        <Group title="Strefa ryzyka">
          <Row icon="trash" label="Resetuj dane" sub="Usuwa wszystkie gry, linki i historię cen" danger onPress={confirmReset} last />
        </Group>

        <Text className="text-center text-muted-foreground" style={{ fontSize: 11, marginTop: 6 }}>
          Game Wishlist · v1.0.0 · dane tylko lokalnie
        </Text>
      </View>
    </Screen>
  );
}
