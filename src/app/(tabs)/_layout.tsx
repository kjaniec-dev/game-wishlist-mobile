import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { useKj } from '@/lib/theme';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Start', icon: 'home' },
  { name: 'games', title: 'Gry', icon: 'list' },
  { name: 'platforms', title: 'Platformy', icon: 'controller' },
  { name: 'settings', title: 'Ustawienia', icon: 'cog' },
];

export default function TabsLayout() {
  const kj = useKj();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: kj.primary,
        tabBarInactiveTintColor: kj.mutedForeground,
        // react-native-web gives the bar a fixed height that clips label descenders; native sizes it from the safe area.
        tabBarStyle: { backgroundColor: kj.bgCanvas, borderTopColor: kj.border, ...(Platform.OS === 'web' && { height: 64, paddingBottom: 6 }) },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color }) => <Icon name={t.icon} size={22} color={String(color)} />,
          }}
        />
      ))}
    </Tabs>
  );
}
