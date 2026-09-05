import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, shadow } from '@/constants/theme';

/**
 * Renders nothing when the active backend has no Google support, so the
 * offline demo never shows a button that cannot work.
 */
export default function GoogleButton({ label = 'Continue with Google' }: { label?: string }) {
  const { signInWithGoogle, supportsGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!supportsGoogle) return null;

  async function press() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      // Closing the browser tab is a normal action, not a failure to report.
      if (e?.message !== 'CANCELLED') {
        Alert.alert('Google sign-in failed', e?.message ?? 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>or</Text>
        <View style={styles.line} />
      </View>

      <Pressable style={[styles.btn, shadow.sm]} onPress={press} disabled={busy}>
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Ionicons name="logo-google" size={19} color="#EA4335" />
            <Text style={styles.txt}>{label}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  txt: { fontSize: 15, fontWeight: '800', color: colors.text },
});
