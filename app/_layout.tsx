import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { uid, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    SplashScreen.hideAsync().catch(() => {});
    const inAuth = segments[0] === '(auth)';
    if (!uid && !inAuth) router.replace('/(auth)/login');
    else if (uid && inAuth) router.replace('/(tabs)');
  }, [uid, initializing, segments]);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
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
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
