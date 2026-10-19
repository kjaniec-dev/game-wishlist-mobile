import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useKj } from '@/lib/theme';
import { useWishlist } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

const STALE_AFTER = 6 * 60 * 60 * 1000;

/** Refresh prices when the app opens or returns to the foreground and the last full refresh is stale. */
function useAutoRefresh() {
  useEffect(() => {
    const refreshIfStale = () => {
      const { lastRefreshAll, refreshAll } = useWishlist.getState();
      if (!lastRefreshAll || Date.now() - lastRefreshAll > STALE_AFTER) void refreshAll();
    };
    const start = () => {
      refreshIfStale();
      SplashScreen.hideAsync();
    };
    if (useWishlist.persist.hasHydrated()) start();
    const off = useWishlist.persist.onFinishHydration(start);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refreshIfStale());
    return () => {
      off();
      sub.remove();
    };
  }, []);
}

export default function RootLayout() {
  const kj = useKj();
  const scheme = useColorScheme();
  useAutoRefresh();

  const base = scheme === 'light' ? DefaultTheme : DarkTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: kj.primary,
      background: kj.bgCanvas,
      card: kj.card,
      text: kj.foreground,
      border: kj.border,
      notification: kj.primary,
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: kj.bgCanvas } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="game/[id]" />
          <Stack.Screen name="form" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
