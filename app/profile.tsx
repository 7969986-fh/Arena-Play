import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import StatTile from '@/components/ui/StatTile';
import { useAuth } from '@/hooks/useAuth';
import { walletTotal } from '@/models/types';
import { colors, shadow, spacing } from '@/constants/theme';
import { formatDateTime } from '@/utils/format';

function Field({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function Profile() {
  const { user } = useAuth();
  return (
    <View style={styles.bg}>
      <Header title="My Profile" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.top}>
          <View style={styles.avatar}><Ionicons name="person" size={40} color="#fff" /></View>
          <Text style={styles.name}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Card style={styles.statsCard} elevation="sm">
          <StatTile value={user?.stats.matchesPlayed ?? 0} label="Matches" />
          <View style={styles.div} />
          <StatTile value={user?.stats.kills ?? 0} label="Kills" accent={colors.danger} />
          <View style={styles.div} />
          <StatTile value={`₹${walletTotal(user?.wallet)}`} label="Balance" accent={colors.coin} />
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Field icon="at-outline" label="Referral Code" value={user?.referralCode ?? '—'} />
          <Field icon="shield-outline" label="Role" value={(user?.role ?? 'player').toUpperCase()} />
          <Field icon="calendar-outline" label="Joined" value={user ? formatDateTime(user.createdAt) : '—'} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  top: { alignItems: 'center', marginVertical: spacing.md },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.coin, ...shadow.md,
  },
  name: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 10 },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  statsCard: { flexDirection: 'row', marginTop: spacing.md },
  div: { width: 1, backgroundColor: colors.border },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  fieldIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  fieldValue: { fontSize: 15, color: colors.text, fontWeight: '800', marginTop: 1 },
});
