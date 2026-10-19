import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKj } from '@/lib/theme';

/** Scrollable page on the canvas background, padded for the status bar (tab screens) and optional pull-to-refresh. */
export function Screen({
  children,
  topInset = true,
  bottomPadding = 28,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  topInset?: boolean;
  bottomPadding?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const kj = useKj();
  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ paddingTop: topInset ? insets.top + 8 : 0, paddingBottom: bottomPadding }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={kj.primary}
              colors={[kj.primary]}
              progressBackgroundColor={kj.card}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}
