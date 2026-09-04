import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Coin from '@/components/ui/Coin';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useUserRegistrations } from '@/hooks/useData';
import { colors, spacing } from '@/constants/theme';
import { formatDateTime } from '@/utils/format';

export default function Statistics() {
  const { user } = useAuth();
  const regs = useUserRegistrations(user?.uid ?? null);

  return (
    <View style={styles.bg}>
      <Header title="My Statistics" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.headerRow}>
          <Text style={[styles.h, { flex: 1 }]}>Match</Text>
          <Text style={[styles.h, styles.col]}>Paid</Text>
          <Text style={[styles.h, styles.col]}>Won</Text>
        </View>

        {regs.length === 0 ? (
          <EmptyState icon="stats-chart-outline" title="No matches played" subtitle="Your match history and earnings appear here." />
        ) : (
          regs.map((r) => (
            <Card key={r.id} style={styles.row} elevation="sm">
              <View style={{ flex: 1 }}>
                <Text style={styles.matchName} numberOfLines={1}>{r.teamName ?? 'Match'} • {r.inGameName}</Text>
                <Text style={styles.date}>{formatDateTime(r.joinedAt)}</Text>
              </View>
              <View style={styles.col}><Coin amount={r.paidAmount} size={13} /></View>
              <View style={styles.col}>
                <Coin amount={r.wonAmount} size={13} color={r.wonAmount > 0 ? colors.success : colors.text} />
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
  headerRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 10 },
  h: { fontSize: 13, fontWeight: '900', color: colors.text },
  col: { width: 70, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  matchName: { fontSize: 14, fontWeight: '800', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
