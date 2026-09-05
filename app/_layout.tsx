import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ONBOARDED_KEY } from '@/app/onboarding';
import { ToastProvider } from '@/components/ui/Toast';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { uid, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  // undefined until the flag has been read, so routing waits rather than
  // flashing the login screen at a first-time player.
  const [onboarded, setOnboarded] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setOnboarded(v === '1'))
      .catch(() => setOnboarded(true));
  }, []);

  useEffect(() => {
    if (initializing || onboarded === undefined) return;
    SplashScreen.hideAsync().catch(() => {});

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!uid && !onboarded && !inOnboarding) router.replace('/onboarding');
    else if (!uid && onboarded && !inAuth) router.replace('/(auth)/login');
    else if (uid && (inAuth || inOnboarding)) router.replace('/(tabs)');
  }, [uid, initializing, segments, onboarded]);

  if (initializing || onboarded === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="game/[id]" />
      <Stack.Screen name="contest/[id]/index" />
      <Stack.Screen name="contest/[id]/join" options={{ presentation: 'modal' }} />
      <Stack.Screen name="contest/[id]/joinings" />
    </Stack>
  );
}

/**
 * Expo Router renders this instead of crashing to the home screen when a
 * startup error escapes. Showing the message on-device is the only way to
 * diagnose a release build, which has no console attached.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#EAF4F0' }}
      contentContainerStyle={{ padding: 24, paddingTop: 72 }}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#0B3B33', marginBottom: 12 }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 14, color: '#0B3B33', marginBottom: 8 }}>{error.message}</Text>
      <Text style={{ fontSize: 11, color: '#4A6B65', marginBottom: 24 }}>{error.stack}</Text>
      <Text onPress={retry} style={{ fontSize: 16, fontWeight: '700', color: '#0FB89B' }}>
        Tap to retry
      </Text>
    </ScrollView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
