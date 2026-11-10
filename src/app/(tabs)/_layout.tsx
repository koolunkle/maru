import { Feather } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { type ComponentProps, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hasWaitingMailbox } from '@/lib/mailbox';

type IconName = ComponentProps<typeof Feather>['name'];

const TabIcons: Record<string, IconName> = {
  index: 'sun',
  vault: 'archive',
  feed: 'message-circle',
  record: 'calendar',
  room: 'home',
};

/** 하단 탭 5개(DESIGN.md tab-bar: 64px, 활성 ink / 비활성 muted, 전환 애니메이션 없음) */
export default function TabsLayout() {
  const theme = useTheme();
  const pathname = usePathname();
  const onVault = pathname === '/vault';
  const [waiting, setWaiting] = useState(false);

  // 마음 보관함 탭 점 (spec mailbox): 탭을 옮기거나 앱으로 돌아올 때 확인한다. 실패하면 점을 숨긴다
  useEffect(() => {
    if (onVault) return;
    let active = true;
    const check = () =>
      hasWaitingMailbox().then(
        (value) => active && setWaiting(value),
        () => active && setWaiting(false),
      );
    void check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [onVault, pathname]);
  const showDot = waiting && !onVault;

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
        tabBarIcon: ({ color }) => (
          <Feather aria-hidden name={TabIcons[route.name]} size={24} color={color as string} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen
        name="vault"
        options={{
          title: '마음 보관함',
          tabBarBadge: showDot ? '' : undefined,
          tabBarBadgeStyle: {
            minWidth: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.accent,
          },
          tabBarAccessibilityLabel: showDot ? '마음 보관함, 새 한 줄이 있어요' : undefined,
        }}
      />
      <Tabs.Screen name="feed" options={{ title: '피드' }} />
      <Tabs.Screen name="record" options={{ title: '기록' }} />
      <Tabs.Screen name="room" options={{ title: '내 방' }} />
    </Tabs>
  );
}
