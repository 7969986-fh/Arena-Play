import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import { APP, SUPPORT_LINKS } from '@/constants/app';
import { colors, radius, shadow, spacing } from '@/constants/theme';

interface Channel {
  key: string;
  label: string;
  value: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

/** Only channels the operator actually filled in are offered. */
const CHANNELS: Channel[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    value: APP.supportWhatsApp ? `+${APP.supportWhatsApp}` : '',
    url: SUPPORT_LINKS.whatsapp,
    icon: 'logo-whatsapp',
    color: '#25D366',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    value: APP.supportTelegram ? `@${APP.supportTelegram}` : '',
    url: SUPPORT_LINKS.telegram,
    icon: 'paper-plane',
    color: '#37AEE2',
  },
  {
    key: 'email',
    label: 'Email',
    value: APP.supportEmail,
    url: SUPPORT_LINKS.email,
    icon: 'mail',
    color: '#EA4335',
  },
].filter((c) => !!c.url) as Channel[];

export default function Contact() {
  return (
    <View style={styles.bg}>
      <Header title="Contact Us" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={styles.hero}>
          <Ionicons name="headset" size={38} color={colors.primary} />
          <Text style={styles.heroTitle}>We're here to help</Text>
          <Text style={styles.heroSub}>{APP.supportHours}</Text>
        </Card>

        {CHANNELS.map((c) => (
          <Pressable key={c.key} style={[styles.row, shadow.sm]} onPress={() => Linking.openURL(c.url)}>
            <View style={[styles.icon, { backgroundColor: c.color }]}>
              <Ionicons name={c.icon} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{c.label}</Text>
              <Text style={styles.value}>{c.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.h}>Before you contact us</Text>
          <Text style={styles.p}>
            For any match dispute, keep your screen recording ready — POV recordings are
            the only accepted evidence. Raise match issues within 2 hours of the match
            ending, otherwise the result stands.
          </Text>
          <Text style={[styles.h, { marginTop: spacing.md }]}>Response time</Text>
          <Text style={styles.p}>
            Most messages are answered within a few hours during support hours.
            Deposits are usually reviewed within 30 minutes.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', backgroundColor: colors.mint, gap: 4 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: colors.primaryDark, marginTop: 6 },
  heroSub: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  value: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
  h: { fontSize: 14.5, fontWeight: '900', color: colors.text, marginBottom: 6 },
  p: { fontSize: 13, lineHeight: 20, color: colors.textMuted, fontWeight: '500' },
});
