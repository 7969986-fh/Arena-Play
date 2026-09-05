import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useDeposits, useWithdrawals, useUsers, useAllContests } from '@/hooks/useData';
import { colors, radius, shadow, spacing } from '@/constants/theme';

export default function AdminPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const { items: deposits } = useDeposits();
  const { items: withdrawals } = useWithdrawals();
  const { users } = useUsers();
  const { contests } = useAllContests();

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

  const stats = [
    { label: 'Pending Deposits', value: pendingDep, icon: 'arrow-down-circle-outline', color: colors.success },
    { label: 'Pending Withdrawals', value: pendingWd, icon: 'arrow-up-circle-outline', color: colors.danger },
    { label: 'Users', value: users.length, icon: 'people-outline', color: colors.info },
    { label: 'Contests', value: contests.length, icon: 'game-controller-outline', color: colors.primary },
  ];

  const actions = [
    { label: 'Manage Contests', desc: 'Create, edit, declare results', icon: 'game-controller-outline', route: '/admin/contests' },
    { label: 'Deposits', desc: 'Approve or reject recharges', icon: 'arrow-down-circle-outline', route: '/admin/deposits', badge: pendingDep },
    { label: 'Withdrawals', desc: 'Process payout requests', icon: 'cash-outline', route: '/admin/withdrawals', badge: pendingWd },
    { label: 'Manage Users', desc: 'Roles, staff & bans', icon: 'people-outline', route: '/admin/users' },
    { label: 'Send Notification', desc: 'Broadcast to all players', icon: 'megaphone-outline', route: '/admin/notifications' },
  ];

  return (
    <View style={styles.bg}>
      <Header title="Admin Panel" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.grid}>
          {stats.map((c) => (
            <Card key={c.label} style={styles.statCard} elevation="sm">
              <View style={[styles.statIcon, { backgroundColor: c.color }]}>
                <Ionicons name={c.icon as any} size={20} color="#fff" />
              </View>
              <Text style={styles.statValue}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </Card>
          ))}
        </View>

        <Text style={styles.section}>Controls</Text>
        {actions.map((a) => (
          <Pressable key={a.label} style={[styles.action, shadow.sm]} onPress={() => router.push(a.route as any)}>
            <View style={styles.actionIcon}><Ionicons name={a.icon as any} size={20} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionDesc}>{a.desc}</Text>
            </View>
            {a.badge ? (
              <View style={styles.countBadge}><Text style={styles.countTxt}>{a.badge}</Text></View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            )}
          </Pressable>
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
  section: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: spacing.lg, marginBottom: 10 },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  actionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  countBadge: { backgroundColor: colors.danger, minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countTxt: { color: '#fff', fontWeight: '900', fontSize: 12 },
});
