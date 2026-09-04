import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Segmented from '@/components/ui/Segmented';
import ContestCard from '@/components/ContestCard';
import EmptyState from '@/components/ui/EmptyState';
import { useUserRegistrations } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { backend } from '@/services/backend';
import { Contest, ContestStatus } from '@/models/types';
import { colors, spacing } from '@/constants/theme';

const TABS: { key: ContestStatus; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'resulted', label: 'Completed' },
];

export default function MyMatches() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const regs = useUserRegistrations(user?.uid ?? null);
  const [contests, setContests] = useState<Record<string, Contest>>({});
  const [tab, setTab] = useState<ContestStatus>(
    (filter === 'completed' ? 'resulted' : (filter as ContestStatus)) || 'ongoing'
  );

  useEffect(() => {
    let live = true;
    (async () => {
      const map: Record<string, Contest> = {};
      for (const r of regs) {
        const c = await backend.getContest(r.contestId);
        if (c) map[c.id] = c;
      }
      if (live) setContests(map);
    })();
    return () => { live = false; };
  }, [regs]);

  const list = useMemo(
    () => Object.values(contests).filter((c) => c.status === tab),
    [contests, tab]
  );

  return (
    <View style={styles.bg}>
      <Header title="My Matches" />
      <View style={styles.segment}>
        <Segmented options={TABS} value={tab} onChange={setTab} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {list.length === 0 ? (
          <EmptyState
            icon="game-controller-outline"
            title="No matches here"
            subtitle="Join a contest from the home screen to see it here."
          />
        ) : (
          list.map((c) => (
            <ContestCard key={c.id} contest={c} onPress={() => router.push(`/contest/${c.id}`)} />
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
