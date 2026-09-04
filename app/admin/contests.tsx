import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Coin from '@/components/ui/Coin';
import { useAllContests } from '@/hooks/useData';
import { backend } from '@/services/backend';
import { Contest } from '@/models/types';
import { colors, radius, spacing } from '@/constants/theme';
import { formatSchedule } from '@/utils/format';

const STATUS_COLOR: Record<Contest['status'], string> = {
  upcoming: colors.info, ongoing: colors.success, resulted: colors.textMuted,
};

export default function AdminContests() {
  const router = useRouter();
  const contests = useAllContests();

  function confirmDelete(c: Contest) {
    Alert.alert('Delete contest', `Delete "${c.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => backend.deleteContest(c.id) },
    ]);
  }

  return (
    <View style={styles.bg}>
      <Header title="Manage Contests" />
      <View style={styles.top}>
        <Button label="+ Create Contest" onPress={() => router.push('/admin/create-contest')} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}>
        {contests.length === 0 ? (
          <EmptyState icon="game-controller-outline" title="No contests" subtitle="Create one to get started." />
        ) : (
          contests.map((c) => (
            <Card key={c.id} style={styles.card} elevation="sm">
              <View style={styles.rowTop}>
                <Text style={styles.title} numberOfLines={2}>{c.title}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[c.status] }]}>
                  <Text style={styles.badgeTxt}>{c.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.meta}>{formatSchedule(c.schedule)} • {c.filledSlots}/{c.totalSlots} slots</Text>
              <View style={styles.statsRow}>
                <Coin amount={c.prizePool} size={13} />
                <Text style={styles.dot}>•</Text>
                <Text style={styles.metaSmall}>{c.matchType === 'free' ? 'Free' : `Entry ₹${c.entryFee}`}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.manage} onPress={() => router.push(`/manage/${c.id}`)}>
                  <Ionicons name="settings-outline" size={16} color={colors.primary} />
                  <Text style={styles.manageTxt}>Manage / Results</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(c)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  top: { padding: spacing.lg },
  card: { marginBottom: 12 },
  rowTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeTxt: { fontSize: 10, fontWeight: '900', color: '#fff' },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  dot: { color: colors.textFaint },
  metaSmall: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  manage: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  manageTxt: { fontSize: 14, fontWeight: '800', color: colors.primary },
});
