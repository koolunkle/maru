import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, MaxContentWidth } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BackgroundAudioProvider } from '@/providers/background-audio';
import { SessionProvider, useSession } from '@/providers/session-provider';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { isReady, session, profile } = useSession();
  // 아이콘 글꼴도 함께 불러와야 웹에서 아이콘이 잠시 네모로 보이지 않는다(#19)
  const [fontsLoaded, fontError] = useFonts({
    ...Feather.font,
    ...MaterialCommunityIcons.font,
    'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.otf'),
  });
  // 글꼴을 불러오지 못해도 기본 글꼴로 계속 진행한다(빈 화면에서 멈추지 않게)
  const ready = isReady && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = Boolean(session);
  const onboarded = Boolean(profile?.onboarded_at);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/[field]" />
        <Stack.Screen name="letter/[week]" />
        <Stack.Screen name="capsule" />
        <Stack.Screen name="mission/[id]/index" />
        <Stack.Screen name="mission/[id]/verify" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{ ...navTheme, colors: { ...navTheme.colors, background: colors.canvas, card: colors.surface } }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* 웹에서는 480px 컬럼 중앙 정렬, 바깥은 canvas (DESIGN.md §5.1) */}
      <View style={[styles.outer, { backgroundColor: colors.canvas }]}>
        <View style={styles.column}>
          <SessionProvider>
            <BackgroundAudioProvider>
              <RootStack />
            </BackgroundAudioProvider>
          </SessionProvider>
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
