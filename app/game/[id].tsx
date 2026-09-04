import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Header from '@/components/ui/Header';
import Segmented from '@/components/ui/Segmented';
import ContestCard from '@/components/ContestCard';
import EmptyState from '@/components/ui/EmptyState';
import { useContests, useGames } from '@/hooks/useData';
import { ContestStatus } from '@/models/types';
import { colors, spacing } from '@/constants/theme';

const TABS: { key: ContestStatus; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'resulted', label: 'Resulted' },
];

export default function GameContests() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { games } = useGames();
  const { contests, loading } = useContests(id!);
  const [tab, setTab] = useState<ContestStatus>('upcoming');

  const game = games.find((g) => g.id === id);
  const filtered = useMemo(() => contests.filter((c) => c.status === tab), [contests, tab]);

  return (
    <View style={styles.bg}>
      <Header title={game?.name ?? 'Contests'} />
      <View style={styles.segment}>
        <Segmented options={TABS} value={tab} onChange={setTab} />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && !loading ? (
          <EmptyState
            icon="trophy-outline"
            title={`No ${tab} contests`}
            subtitle="Check back soon or try another tab."
          />
        ) : (
          filtered.map((c, i) => (
            <Animated.View key={c.id} entering={FadeInDown.delay(60 * i).duration(400)}>
              <ContestCard
                contest={c}
                onPress={() => router.push(`/contest/${c.id}`)}
                onJoin={() => router.push(`/contest/${c.id}/join`)}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  segment: { padding: spacing.lg, paddingBottom: 0 },
});
