import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Segmented from '@/components/ui/Segmented';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useAllContests } from '@/hooks/useData';
import { Contest, ContestStatus } from '@/models/types';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { formatSchedule } from '@/utils/format';

const TABS: { key: ContestStatus; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'resulted', label: 'Resulted' },
];
const STATUS_COLOR: Record<Contest['status'], string> = {
  upcoming: colors.info, ongoing: colors.success, resulted: colors.textMuted,
};

export default function StaffPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const { contests, loading } = useAllContests();
  const [tab, setTab] = useState<ContestStatus>('upcoming');

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return (
      <View style={styles.bg}>
        <Header title="Staff Panel" />
        <EmptyState icon="lock-closed-outline" title="Staff only" subtitle="You do not have permission to view this panel." />
      </View>
    );
  }

  const list = contests.filter((c) => c.status === tab);

  return (
    <View style={styles.bg}>
      <Header title="Staff Panel" />
      <View style={styles.intro}>
        <Text style={styles.introTxt}>Share room codes, enter results and moderate players for each match.</Text>
      </View>
      <View style={styles.segment}><Segmented options={TABS} value={tab} onChange={setTab} /></View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md }}>
        {list.length === 0 ? (
          <EmptyState icon="game-controller-outline" title={`No ${tab} matches`} />
        ) : (
          list.map((c) => (
            <Pressable key={c.id} style={[styles.card, shadow.sm]} onPress={() => router.push(`/manage/${c.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{c.title}</Text>
                <Text style={styles.meta}>{formatSchedule(c.schedule)} • {c.filledSlots}/{c.totalSlots}</Text>
                <View style={styles.tagsRow}>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLOR[c.status] }]}>
                    <Text style={styles.badgeTxt}>{c.status.toUpperCase()}</Text>
                  </View>
                  {!!c.roomId && (
                    <View style={styles.roomTag}>
                      <Ionicons name="key" size={11} color={colors.primaryDark} />
                      <Text style={styles.roomTxt}>Room set</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  intro: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  introTxt: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  segment: { padding: spacing.lg, paddingBottom: 0 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 3, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeTxt: { fontSize: 10, fontWeight: '900', color: '#fff' },
  roomTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.mint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  roomTxt: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
});
