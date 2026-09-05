import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Segmented from '@/components/ui/Segmented';
import Coin from '@/components/ui/Coin';
import EmptyState from '@/components/ui/EmptyState';
import { useLeaderboard } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { colors, gradients, radius, shadow, spacing } from '@/constants/theme';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { rankOf } from '@/constants/progression';

const PERIODS = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'fulltime', label: 'Fulltime' },
];

const MEDAL = ['#F5B301', '#B8C4CE', '#CD7F32'];

export default function Leaderboard() {
  const insets = useSafeAreaInsets();
  const { users, loading } = useLeaderboard();
  const { uid } = useAuth();
  const [period, setPeriod] = useState('weekly');

  return (
    <View style={styles.bg}>
      <LinearGradient colors={gradients.header} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Leaderboard</Text>
      </LinearGradient>

      <View style={styles.segment}>
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ListSkeleton count={7} />
        ) : users.length === 0 ? (
          <EmptyState icon="trophy-outline" title="No rankings yet" subtitle="Win contests to climb the board." />
        ) : (
          users.map((u, i) => {
            const mine = u.uid === uid;
            return (
              <Animated.View key={u.uid} entering={FadeInDown.delay(40 * i).duration(350)}>
                <View style={[styles.row, shadow.sm, mine && styles.mine]}>
                  <View style={[styles.rank, i < 3 && { backgroundColor: MEDAL[i] }]}>
                    <Text style={[styles.rankTxt, i < 3 && { color: '#fff' }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {u.username}{mine ? ' (You)' : ''}
                    </Text>
                    <View style={styles.rankRow}>
                      <View style={[styles.tier, { backgroundColor: rankOf(u.stats).colour }]}>
                        <Text style={styles.tierTxt}>Lv {rankOf(u.stats).level}</Text>
                      </View>
                      <Text style={styles.tierName}>{rankOf(u.stats).title}</Text>
                    </View>
                  </View>
                  <Coin amount={u.stats.earnings} size={15} />
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  tier: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  tierTxt: { fontSize: 9.5, fontWeight: '900', color: '#fff' },
  tierName: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted },
  bg: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingBottom: 18, paddingHorizontal: 16,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, ...shadow.md,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  segment: { padding: spacing.lg, paddingBottom: 0 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  mine: { borderColor: colors.primary, borderWidth: 2 },
  rank: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  rankTxt: { fontSize: 15, fontWeight: '900', color: colors.text },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
});
