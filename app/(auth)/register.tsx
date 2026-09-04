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
import { colors, spacing } from '@/constants/theme';

export default function Register() {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    if (!username || !email || !password) { setError('Fill in all required fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signUp(username, email, password, referral.trim() || undefined);
    } catch (e: any) {
      setError(e?.message ?? 'Could not create account.');
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
          <Card elevation="lg">
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join the arena in seconds</Text>

            <Input label="Username" placeholder="yourname" autoCapitalize="none" value={username} onChangeText={setUsername} />
            <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Input label="Password" placeholder="At least 6 characters" secureTextEntry value={password} onChangeText={setPassword} />
            <Input label="Referral code (optional)" placeholder="friend's code" autoCapitalize="none" value={referral} onChangeText={setReferral} />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button label="Create Account" onPress={onSubmit} loading={loading} style={{ marginTop: 8 }} />

            <View style={styles.footer}>
              <Text style={styles.muted}>Already have an account? </Text>
              <Link href="/(auth)/login" style={styles.link}>Sign in</Link>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  muted: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '800' },
});
