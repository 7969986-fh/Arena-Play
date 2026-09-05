import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useContest, useContestRegistrations } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, spacing } from '@/constants/theme';

/**
 * Everyone registered for a contest. Public so players can size up the
 * lobby before joining; the viewer's own row is highlighted.
 */
export default function Joinings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { contest } = useContest(id!);
  const regs = useContestRegistrations(id!);

  const sorted = [...regs].sort((a, b) => a.slotNumber - b.slotNumber);

  return (
    <View style={styles.bg}>
      <Header title="All Joinings" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {contest && (
          <Text style={styles.count}>
            {contest.filledSlots} of {contest.totalSlots} slots filled
          </Text>
        )}

        {sorted.length === 0 ? (
          <EmptyState icon="people-outline" title="No players yet" subtitle="Be the first to join this match." />
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={styles.head}>
              <Text style={[styles.hCell, styles.slotCol]}>Slot</Text>
              <Text style={[styles.hCell, { flex: 1 }]}>In-Game Name</Text>
              <Text style={[styles.hCell, styles.teamCol]}>Team</Text>
            </View>

            {sorted.map((r, i) => {
              const mine = r.userId === user?.uid;
              return (
                <View
                  key={r.id}
                  style={[styles.row, i % 2 === 1 && styles.rowAlt, mine && styles.rowMine]}
                >
                  <Text style={[styles.cell, styles.slotCol, styles.slotTxt]}>{r.slotNumber}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cell, styles.name]} numberOfLines={1}>
                      {r.inGameName}
                    </Text>
                    {mine && <Text style={styles.you}>You</Text>}
                  </View>
                  <Text style={[styles.cell, styles.teamCol]} numberOfLines={1}>
                    {r.teamName || '—'}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  count: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.md },
  head: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  hCell: { fontSize: 11.5, fontWeight: '800', color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  rowAlt: { backgroundColor: colors.surfaceMuted },
  rowMine: { backgroundColor: colors.mint },
  cell: { fontSize: 13, color: colors.text, fontWeight: '600' },
  slotCol: { width: 46 },
  teamCol: { width: 74, textAlign: 'right' },
  slotTxt: { fontWeight: '900', color: colors.primaryDark },
  name: { fontWeight: '700' },
  you: { fontSize: 10, fontWeight: '800', color: colors.primary, marginTop: 1 },
});
