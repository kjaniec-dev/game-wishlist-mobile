import { Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { PageTitle, SectionHeader, Toggle } from '@/components/ui';
import { PLATFORM_GROUPS } from '@/lib/catalog';
import { useWishlist } from '@/lib/store';
import { withAlpha } from '@/lib/theme';

export default function Platforms() {
  const { platforms, games, togglePlatform } = useWishlist();

  return (
    <Screen>
      <PageTitle title="Platformy" />
      <Text className="text-muted-foreground" style={{ fontSize: 13, paddingHorizontal: 18, marginTop: -8 }}>
        Włącz platformy, które posiadasz. Tylko one pojawią się przy dodawaniu gier.
      </Text>

      <View style={{ paddingHorizontal: 18, paddingTop: 18, gap: 22 }}>
        {PLATFORM_GROUPS.map((group) => {
          const items = platforms.filter((p) => p.type === group.type);
          if (!items.length) return null;
          return (
            <View key={group.type}>
              <SectionHeader title={group.label} />
              <View style={{ gap: 6 }}>
                {items.map((p) => {
                  const count = games.filter((g) => g.platformId === p.id).length;
                  return (
                    <View key={p.id} className="flex-row items-center rounded-xl border border-border bg-card" style={{ gap: 12, paddingHorizontal: 14, paddingVertical: 11 }}>
                      <View
                        className="items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          backgroundColor: withAlpha(p.color, 0.2),
                          borderWidth: 1,
                          borderColor: withAlpha(p.color, 0.3),
                        }}
                      >
                        <Text style={{ color: p.color, fontSize: 12, fontWeight: '700' }}>{p.short.slice(0, 3)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground" style={{ fontSize: 14, fontWeight: '600' }}>
                          {p.name}
                        </Text>
                        {count > 0 && (
                          <Text className="text-muted-foreground" style={{ fontSize: 11.5, marginTop: 1 }}>
                            {count} {count === 1 ? 'gra' : 'gier'}
                          </Text>
                        )}
                      </View>
                      <Toggle checked={p.enabled} onChange={() => togglePlatform(p.id)} />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
