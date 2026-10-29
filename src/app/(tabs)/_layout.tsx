import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';

import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof Feather>['name'];

const TabIcons: Record<string, IconName> = {
  index: 'sun',
  feed: 'message-circle',
  record: 'calendar',
  room: 'home',
  rest: 'coffee',
};

/** 하단 탭 5개 (DESIGN.md tab-bar: 64px, 활성 ink / 비활성 muted, 전환 애니메이션 없음) */
export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: theme.ink,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: Typography.label,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.hairline,
          borderTopWidth: 1,
          minHeight: 64,
        },
        // 위 tint 값(string)이 그대로 전달된다
        tabBarIcon: ({ color }) => <Feather aria-hidden name={TabIcons[route.name]} size={24} color={color as string} />,
      })}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="feed" options={{ title: '피드' }} />
      <Tabs.Screen name="record" options={{ title: '기록' }} />
      <Tabs.Screen name="room" options={{ title: '내 방' }} />
      <Tabs.Screen name="rest" options={{ title: '휴게소' }} />
    </Tabs>
  );
}
