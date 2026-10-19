import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform as RNPlatform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/screen';
import { Button, Cover, Field, IconButton, Segmented, TextField } from '@/components/ui';
import { PRIORITY_META, STATUS_META, STATUSES } from '@/lib/catalog';
import { formatPLN, parsePLN } from '@/lib/prices';
import { newId, useWishlist } from '@/lib/store';
import { useKj, withAlpha } from '@/lib/theme';
import type { Game, Priority } from '@/lib/types';

export default function GameForm() {
  const kj = useKj();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { games, platforms, saveGame, deleteGame } = useWishlist();
  const existing = games.find((g) => g.id === id);
  const enabled = platforms.filter((p) => p.enabled || p.id === existing?.platformId);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [platformId, setPlatformId] = useState(existing?.platformId ?? enabled[0]?.id ?? '');
  const [status, setStatus] = useState(existing?.status ?? 'want');
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium');
  const [target, setTarget] = useState(existing?.targetPrice !== undefined ? String(existing.targetPrice).replace('.', ',') : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [query, setQuery] = useState(existing?.customSearchQuery ?? '');

  const targetValue = parsePLN(target);
  const targetInvalid = target.trim() !== '' && targetValue === undefined;
  const canSave = title.trim().length > 0 && !!platformId && !targetInvalid;

  const save = () => {
    if (!canSave) return;
    const now = Date.now();
    const game: Game = {
      offers: {},
      createdAt: now,
      ...existing,
      id: existing?.id ?? newId(),
      title: title.trim(),
      platformId,
      status,
      priority,
      targetPrice: targetValue,
      notes: notes.trim() || undefined,
      customSearchQuery: query.trim() || undefined,
      updatedAt: now,
    };
    saveGame(game);
    if (existing) router.back();
    else router.replace({ pathname: '/game/[id]', params: { id: game.id } });
  };

  const remove = () =>
    Alert.alert('Usunąć tę grę?', `„${existing?.title}” zostanie trwale usunięta.`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          router.dismissAll();
          deleteGame(existing!.id);
        },
      },
    ]);

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-row items-center border-b border-border" style={{ paddingTop: RNPlatform.OS === 'ios' ? 12 : insets.top + 6, paddingBottom: 8, paddingHorizontal: 10 }}>
        <IconButton icon="close" label="Anuluj" onPress={() => router.back()} />
        <Text className="flex-1 text-center text-foreground" style={{ fontSize: 15, fontWeight: '600' }}>
          {existing ? 'Edytuj grę' : 'Nowa gra'}
        </Text>
        <Pressable onPress={save} disabled={!canSave} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: canSave ? kj.primary : kj.mutedForeground }}>Zapisz</Text>
        </Pressable>
      </View>

      <Screen topInset={false}>
        <View style={{ padding: 18, gap: 18 }}>
          <View className="flex-row items-center" style={{ gap: 14 }}>
            <Cover title={title || '??'} size={72} radius={14} />
            <View className="flex-1">
              <Text className="text-muted-foreground" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' }}>
                Podgląd
              </Text>
              <Text className="text-foreground" numberOfLines={2} style={{ fontSize: 15, fontWeight: '600', marginTop: 4, lineHeight: 20 }}>
                {title || 'Gra bez tytułu'}
              </Text>
            </View>
          </View>

          <Field label="Tytuł" required>
            <TextField value={title} onChangeText={setTitle} placeholder="np. Hollow Knight: Silksong" autoFocus={!existing} />
          </Field>

          <Field label="Platforma" required>
            <View className="flex-row flex-wrap rounded-xl border border-border bg-card" style={{ padding: 6, gap: 6 }}>
              {enabled.map((p) => {
                const active = p.id === platformId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPlatformId(p.id)}
                    className="flex-row items-center rounded-lg"
                    style={{
                      gap: 5,
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderWidth: 1,
                      borderColor: active ? p.color : 'transparent',
                      backgroundColor: active ? withAlpha(p.color, 0.18) : 'transparent',
                    }}
                  >
                    <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: p.color }} />
                    <Text style={{ color: active ? p.color : kj.mutedForeground, fontSize: 12.5, fontWeight: '600' }}>{p.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Cena docelowa" hint={targetInvalid ? undefined : 'Dostaniesz oznaczenie „Okazja”, gdy najtańsza oferta spadnie do tej kwoty.'}>
            <TextField value={target} onChangeText={setTarget} placeholder={formatPLN(149.99)} keyboardType="decimal-pad" />
            {targetInvalid && <Text className="text-danger" style={{ fontSize: 12 }}>Podaj kwotę, np. 149,99</Text>}
          </Field>

          <Field label="Status" required>
            <Segmented
              value={status}
              onChange={setStatus}
              options={STATUSES.map((s) => ({ value: s, label: STATUS_META[s].short, color: STATUS_META[s].dim }))}
            />
          </Field>

          <Field label="Priorytet" required>
            <Segmented
              value={priority}
              onChange={setPriority}
              options={(Object.keys(PRIORITY_META) as Priority[]).reverse().map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
            />
          </Field>

          <Field label="Notatki">
            <TextField value={notes} onChangeText={setNotes} multiline placeholder="Uwagi, edycja kolekcjonerska, kiedy kupić…" />
          </Field>

          <Field label="Własne zapytanie" hint="Zastępuje automatyczne zapytanie (tytuł + platforma) w „Szukaj ofert”.">
            <TextField value={query} onChangeText={setQuery} placeholder={`${title || 'Tytuł gry'} ${enabled.find((p) => p.id === platformId)?.short ?? ''}`.trim()} />
          </Field>

          {!existing && (
            <Text className="text-muted-foreground" style={{ fontSize: 12 }}>
              Linki do Ceneo, Allegro i GG.deals podepniesz na ekranie gry po zapisaniu.
            </Text>
          )}

          {existing && <Button danger variant="secondary" icon="trash" onPress={remove}>Usuń grę</Button>}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
