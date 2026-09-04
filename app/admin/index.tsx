import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useDeposits, useWithdrawals } from '@/hooks/useData';
import { colors, radius, shadow, spacing } from '@/constants/theme';

export default function AdminPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const deposits = useDeposits();
  const withdrawals = useWithdrawals();

  if (user?.role !== 'admin') {
    return (
      <View style={styles.bg}>
        <Header title="Admin Panel" />
        <EmptyState icon="lock-closed-outline" title="Admins only" subtitle="You do not have permission to view this panel." />
      </View>
    );
  }

  const pendingDep = deposits.filter((d) => d.status === 'pending').length;
  const pendingWd = withdrawals.filter((d) => d.status === 'pending').length;

  const cards = [
    { label: 'Pending Deposits', value: pendingDep, icon: 'arrow-down-circle-outline', color: colors.success },
    { label: 'Pending Withdrawals', value: pendingWd, icon: 'arrow-up-circle-outline', color: colors.danger },
    { label: 'Total Deposits', value: deposits.length, icon: 'wallet-outline', color: colors.primary },
    { label: 'Total Withdrawals', value: withdrawals.length, icon: 'cash-outline', color: colors.warning },
  ];

  const actions = [
    { label: 'Manage Games & Contests', icon: 'game-controller-outline' },
    { label: 'Approve Deposits', icon: 'checkmark-circle-outline' },
    { label: 'Approve Withdrawals', icon: 'card-outline' },
    { label: 'Declare Results', icon: 'trophy-outline' },
    { label: 'Manage Users & Staff', icon: 'people-outline' },
    { label: 'Send Notifications', icon: 'megaphone-outline' },
  ];

  return (
    <View style={styles.bg}>
      <Header title="Admin Panel" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.grid}>
          {cards.map((c) => (
            <Card key={c.label} style={styles.statCard} elevation="sm">
              <View style={[styles.statIcon, { backgroundColor: c.color }]}>
                <Ionicons name={c.icon as any} size={20} color="#fff" />
              </View>
              <Text style={styles.statValue}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.phaseBanner}>
          <Ionicons name="construct" size={18} color={colors.primaryDark} />
          <Text style={styles.phaseTxt}>
            Full admin controls arrive in Phase 2. The overview below is live.
          </Text>
        </View>

        <Text style={styles.section}>Controls</Text>
        {actions.map((a) => (
          <View key={a.label} style={[styles.action, shadow.sm]}>
            <View style={styles.actionIcon}><Ionicons name={a.icon as any} size={20} color={colors.primary} /></View>
            <Text style={styles.actionLabel}>{a.label}</Text>
            <View style={styles.soon}><Text style={styles.soonTxt}>Phase 2</Text></View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statCard: { width: '47%', alignItems: 'flex-start' },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  phaseBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.mint,
    borderRadius: radius.md, padding: 12, marginTop: spacing.lg,
  },
  phaseTxt: { flex: 1, fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  section: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: spacing.lg, marginBottom: 10 },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  soon: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  soonTxt: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
});
