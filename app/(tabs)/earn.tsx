import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { shareReferral } from '@/utils/share';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useToast } from '@/components/ui/Toast';

const SOCIALS = [
  { key: 'telegram', label: 'Telegram', icon: 'paper-plane', color: '#37AEE2' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
] as const;

export default function Earn() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const code = user?.referralCode ?? '';

  async function copy() {
    await Clipboard.setStringAsync(code);
    toast.success('Copied', 'Referral code copied to clipboard.');
  }

  const share = () => shareReferral(code);

  return (
    <View style={styles.bg}>
      <LinearGradient colors={['#7C4DFF', '#4A1E9E']} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Refer & Earn</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.giftCircle}>
            <Ionicons name="gift" size={44} color="#7C4DFF" />
          </View>
          <Text style={styles.heroTitle}>Refer your friends & earn</Text>
          <Text style={styles.heroSub}>
            Invite friends using your referral code. When they join their first paid match,
            you both earn bonus coins in your wallet!
          </Text>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          <Pressable style={styles.codeBox} onPress={copy}>
            <Text style={styles.code}>{code}</Text>
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.shareLabel}>Share your referral code via</Text>
        <View style={styles.socials}>
          {SOCIALS.map((s) => (
            <Pressable key={s.key} style={[styles.social, { backgroundColor: s.color }]} onPress={share}>
              <Ionicons name={s.icon as any} size={18} color="#fff" />
              <Text style={styles.socialTxt}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingBottom: 18, paddingHorizontal: 16,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, ...shadow.md,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  hero: { alignItems: 'center', marginTop: spacing.md },
  giftCircle: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: '#EDE4FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: colors.text, textAlign: 'center' },
  heroSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 21, paddingHorizontal: 8 },
  codeCard: {
    backgroundColor: '#EDE4FF', borderRadius: radius.lg, padding: 16, marginTop: spacing.xl,
    borderWidth: 2, borderColor: '#C9B6FF', borderStyle: 'dashed',
  },
  codeLabel: { fontSize: 13, color: '#7C4DFF', fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
  },
  code: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: 1 },
  shareLabel: { textAlign: 'center', fontSize: 15, fontWeight: '800', color: colors.text, marginTop: spacing.xl },
  socials: { flexDirection: 'row', gap: 10, marginTop: spacing.md, justifyContent: 'center' },
  social: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, ...shadow.sm,
  },
  socialTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
