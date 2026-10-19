import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import {
  Button,
  Cover,
  DealBadge,
  PlatformChip,
  PriorityPips,
  SectionHeader,
  Sparkline,
  StatusChip,
  StoreLogo,
  StoreMark,
  TextField,
} from '@/components/ui';
import { coverFor, PRIORITY_META, SEARCH_PROVIDERS, STORE_META, TRACKED_STORES } from '@/lib/catalog';
import { bestOffer, detectStore, formatPLN, isDeal, lastChange, lowestEver } from '@/lib/prices';
import { useWishlist } from '@/lib/store';
import { useKj, withAlpha } from '@/lib/theme';
import type { Game, StoreId } from '@/lib/types';

const openUrl = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Nie udało się otworzyć linku', url));

function timeAgo(t?: number): string {
  if (!t) return 'jeszcze nie sprawdzano';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'przed chwilą';
  if (m < 60) return `${m} min temu`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h temu` : `${Math.round(h / 24)} d temu`;
}

function StoreCard({ game, store }: { game: Game; store: StoreId }) {
  const kj = useKj();
  const { width } = useWindowDimensions();
  const { refreshing, refreshOffer, setOfferUrl } = useWishlist();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string>();
  const meta = STORE_META[store];
  const offer = game.offers[store];
  const busy = refreshing.includes(`${game.id}:${store}`);

  const add = () => {
    const detected = detectStore(draft);
    if (detected !== store) {
      setError(`To nie jest link do ${meta.name} (${meta.domain})`);
      return;
    }
    setError(undefined);
    setOfferUrl(game.id, store, draft);
    setDraft('');
  };

  if (!offer) {
    return (
      <View className="rounded-2xl border border-dashed border-border bg-card" style={{ padding: 14, gap: 10 }}>
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <StoreLogo store={store} />
          <View className="flex-1">
            <Text className="text-foreground" style={{ fontSize: 13.5, fontWeight: '600' }}>{meta.name}</Text>
            <Text className="text-muted-foreground" style={{ fontSize: 11.5 }}>Wklej link do oferty, aby śledzić cenę</Text>
          </View>
        </View>
        <TextField
          value={draft}
          onChangeText={(v) => { setDraft(v); setError(undefined); }}
          placeholder={meta.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={add}
        />
        {error && <Text className="text-danger" style={{ fontSize: 12 }}>{error}</Text>}
        <Button variant="secondary" icon="plus" disabled={!draft.trim()} onPress={add}>Śledź cenę</Button>
      </View>
    );
  }

  const change = lastChange(offer);
  const low = lowestEver(offer);
  const best = bestOffer(game);
  const isBest = best?.store === store && offer.price !== undefined;
  const chartColor = isBest && isDeal(game) ? kj.success : kj.primary;

  return (
    <View className="rounded-2xl border bg-card" style={{ padding: 14, gap: 12, borderColor: isBest ? withAlpha(chartColor, 0.5) : kj.border }}>
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <StoreLogo store={store} />
        <View className="flex-1">
          <Text className="text-foreground" style={{ fontSize: 13.5, fontWeight: '600' }}>{meta.name}</Text>
          <Text className="text-muted-foreground" style={{ fontSize: 11.5 }}>
            {offer.error ? <Text className="text-danger">{offer.error}</Text> : `sprawdzono ${timeAgo(offer.checkedAt)}`}
          </Text>
        </View>
        <View className="items-end" style={{ gap: 2 }}>
          {busy ? (
            <ActivityIndicator color={kj.primary} />
          ) : (
            <Text className="text-foreground" style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.5 }}>{formatPLN(offer.price)}</Text>
          )}
          {change !== undefined && (
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Icon name={change < 0 ? 'trendDown' : 'trendUp'} size={12} stroke={2.2} color={change < 0 ? kj.success : kj.danger} />
              <Text style={{ fontSize: 11.5, fontWeight: '600', color: change < 0 ? kj.success : kj.danger }}>
                {change > 0 ? '+' : ''}{(change * 100).toFixed(1).replace('.', ',')}%
              </Text>
            </View>
          )}
        </View>
      </View>

      <Sparkline points={offer.history} width={width - 40 - 28} height={72} color={chartColor} target={game.targetPrice} />

      <View className="flex-row justify-between">
        <Text className="text-muted-foreground" style={{ fontSize: 11.5 }}>
          najniższa: <Text className="text-foreground" style={{ fontWeight: '600' }}>{formatPLN(low)}</Text>
        </Text>
        {isBest && <Text className="text-success" style={{ fontSize: 11.5, fontWeight: '600' }}>najtańsza oferta</Text>}
      </View>

      <View className="flex-row" style={{ gap: 8 }}>
        <Button variant="secondary" icon="external" onPress={() => openUrl(offer.url)}>Otwórz</Button>
        <Button variant="secondary" icon="refresh" disabled={busy} onPress={() => refreshOffer(game.id, store)}>Odśwież</Button>
        <Button
          variant="secondary"
          danger
          full={false}
          icon="trash"
          onPress={() =>
            Alert.alert(`Przestać śledzić w ${meta.name}?`, 'Historia cen z tego sklepu zostanie usunięta.', [
              { text: 'Anuluj', style: 'cancel' },
              { text: 'Usuń link', style: 'destructive', onPress: () => setOfferUrl(game.id, store, '') },
            ])
          }
        />
      </View>
    </View>
  );
}

export default function GameDetails() {
  const kj = useKj();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { games, platforms, deleteGame } = useWishlist();
  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <Screen>
        <View style={{ padding: 24, gap: 12 }}>
          <Text className="text-foreground" style={{ fontSize: 16, fontWeight: '600' }}>Nie znaleziono gry</Text>
          <Button variant="secondary" onPress={() => router.back()}>Wróć</Button>
        </View>
      </Screen>
    );
  }

  const platform = platforms.find((p) => p.id === game.platformId);
  const [a, b] = coverFor(game.title);
  const high = game.priority === 'high';
  const best = bestOffer(game);
  const deal = isDeal(game);
  const query = game.customSearchQuery || `${game.title} ${platform?.short ?? ''}`.trim();

  const confirmDelete = () =>
    Alert.alert('Usunąć tę grę?', `„${game.title}” zostanie trwale usunięta.`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteGame(game.id);
        },
      },
    ]);

  return (
    <View className="flex-1 bg-canvas">
      <Screen topInset={false}>
        <View style={{ height: 200 + insets.top, marginBottom: -32 }}>
          <LinearGradient colors={[a, b, kj.bgCanvas]} locations={[0, 0.65, 1]} style={{ flex: 1 }} />
          <LinearGradient colors={['transparent', kj.bgCanvas]} locations={[0.3, 1]} style={{ position: 'absolute', inset: 0 }} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Cover title={game.title} size={84} radius={16} />
          <Text className="text-foreground" style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.8, lineHeight: 29, marginTop: 14 }}>
            {game.title}
          </Text>
          <View className="flex-row flex-wrap items-center" style={{ gap: 8, marginTop: 10 }}>
            <PlatformChip platform={platform} />
            <StatusChip status={game.status} large />
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <PriorityPips priority={game.priority} color={high ? kj.primary : kj.mutedForeground} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: high ? kj.primary : kj.mutedForeground }}>
                {PRIORITY_META[game.priority].label} priorytet
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row" style={{ paddingHorizontal: 20, paddingTop: 20, gap: 8 }}>
          <Button icon="edit" onPress={() => router.push({ pathname: '/form', params: { id: game.id } })}>Edytuj</Button>
          <Button variant="secondary" danger full={false} icon="trash" onPress={confirmDelete} />
        </View>

        {/* Price tracking */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 10 }}>
          <SectionHeader
            title="Ceny w sklepach"
            action={deal ? <DealBadge label="Poniżej celu" /> : undefined}
          />
          <View
            className="flex-row items-center rounded-2xl border"
            style={{
              gap: 12,
              padding: 14,
              backgroundColor: deal ? withAlpha(kj.success, 0.1) : kj.card,
              borderColor: deal ? withAlpha(kj.success, 0.4) : kj.border,
            }}
          >
            <View className="flex-1" style={{ gap: 2 }}>
              <Text className="text-muted-foreground" style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                Najniższa cena
              </Text>
              <Text className="text-foreground" style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.8 }}>
                {best ? formatPLN(best.price) : '—'}
              </Text>
              {best && <Text className="text-muted-foreground" style={{ fontSize: 12 }}>w {STORE_META[best.store].name}</Text>}
            </View>
            <View className="items-end" style={{ gap: 2 }}>
              <Text className="text-muted-foreground" style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                Cena docelowa
              </Text>
              <Text className="text-foreground" style={{ fontSize: 18, fontWeight: '600' }}>
                {game.targetPrice !== undefined ? formatPLN(game.targetPrice) : '—'}
              </Text>
              {game.targetPrice === undefined && (
                <Pressable onPress={() => router.push({ pathname: '/form', params: { id: game.id } })}>
                  <Text className="text-primary" style={{ fontSize: 12, fontWeight: '600' }}>Ustaw</Text>
                </Pressable>
              )}
            </View>
          </View>
          {TRACKED_STORES.map((s) => (
            <StoreCard key={s} game={game} store={s} />
          ))}
        </View>

        {game.notes ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <SectionHeader title="Notatki" />
            <View className="rounded-xl border border-border bg-card" style={{ padding: 14 }}>
              <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 21 }}>{game.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Find offers */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <SectionHeader
            title="Szukaj ofert"
            action={
              <Text
                className="rounded bg-card text-muted-foreground"
                numberOfLines={1}
                style={{ fontFamily: 'monospace', fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, maxWidth: 160 }}
              >
                „{query}”
              </Text>
            }
          />
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {SEARCH_PROVIDERS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => openUrl(p.search(encodeURIComponent(query)))}
                className="flex-row items-center rounded-xl border border-border bg-card active:opacity-80"
                style={{ gap: 10, paddingHorizontal: 12, paddingVertical: 11, width: '48.5%' }}
              >
                <StoreMark colors={p.colors} mark={p.mark} />
                <View className="flex-1">
                  <Text className="text-foreground" style={{ fontSize: 12.5, fontWeight: '600' }} numberOfLines={1}>{p.name}</Text>
                  <Text className="text-muted-foreground" style={{ fontSize: 10.5 }} numberOfLines={1}>{p.domain}</Text>
                </View>
                <Icon name="external" size={13} stroke={2} color={kj.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row" style={{ paddingHorizontal: 20, paddingTop: 24, gap: 14 }}>
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Icon name="clock" size={11} stroke={2} color={kj.mutedForeground} />
            <Text className="text-muted-foreground" style={{ fontSize: 11.5 }}>Dodano {new Date(game.createdAt).toLocaleDateString('pl-PL')}</Text>
          </View>
          <Text className="text-muted-foreground" style={{ fontSize: 11.5 }}>Zmieniono {new Date(game.updatedAt).toLocaleDateString('pl-PL')}</Text>
        </View>
      </Screen>

      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Wróć"
        className="absolute items-center justify-center rounded-full active:opacity-70"
        style={{ top: insets.top + 6, left: 12, width: 38, height: 38, backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <Icon name="back" size={20} stroke={2} color="#fff" />
      </Pressable>
    </View>
  );
}
