import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Brand from '@/components/Brand';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { backendKind } from '@/services/backend';
import { colors, spacing } from '@/constants/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e?.message ?? 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Brand />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Card elevation="lg" style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to enter the arena</Text>

            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button label="Sign In" onPress={onSubmit} loading={loading} style={{ marginTop: 8 }} />

            <View style={styles.footer}>
              <Text style={styles.muted}>New here? </Text>
              <Link href="/(auth)/register" style={styles.link}>Create account</Link>
            </View>
          </Card>
        </Animated.View>

        {backendKind === 'local' && (
          <Text style={styles.note}>
            Running in offline demo mode. Add Firebase keys in lib/firebaseConfig.ts to go live.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  card: { gap: 2 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  muted: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '800' },
  note: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: spacing.xl, paddingHorizontal: 24 },
});
