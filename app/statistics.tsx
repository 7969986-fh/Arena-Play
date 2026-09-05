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
import { badgesOf, levelProgress, rankOf } from '@/constants/progression';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function Statistics() {
  const { user } = useAuth();
  const { regs } = useUserRegistrations(user?.uid ?? null);
  const rank = rankOf(user?.stats);
  const progress = levelProgress(user?.stats);
  const badges = badgesOf(user?.stats);

  return (
    <View style={styles.bg}>
      <Header title="My Statistics" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={styles.rankCard} elevation="sm">
          <View style={styles.rankTop}>
            <View style={[styles.levelBadge, { backgroundColor: rank.colour }]}>
              <Text style={styles.levelNum}>{rank.level}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rankTitle, { color: rank.colour }]}>{rank.title}</Text>
              <Text style={styles.rankXp}>{progress.xp.toLocaleString('en-IN')} XP</Text>
            </View>
          </View>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.round(progress.fraction * 100)}%`, backgroundColor: rank.colour },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>
            {progress.into} / {progress.needed} XP to level {rank.level + 1}
          </Text>

          <View style={styles.statRow}>
            <Stat label="Matches" value={String(user?.stats.matchesPlayed ?? 0)} />
            <Stat label="Kills" value={String(user?.stats.kills ?? 0)} />
            <Stat label="Earned" value={`₹${user?.stats.earnings ?? 0}`} />
          </View>
        </Card>

        <Text style={styles.section}>Achievements</Text>
        <View style={styles.badgeGrid}>
          {badges.map((b) => (
            <View key={b.id} style={[styles.badge, !b.earned && styles.badgeLocked]}>
              <Text style={[styles.badgeIcon, !b.earned && styles.badgeIconLocked]}>{b.icon}</Text>
              <Text style={styles.badgeLabel} numberOfLines={1}>{b.label}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>{b.description}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Match History</Text>
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
  rankCard: { marginBottom: spacing.lg },
  rankTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  levelNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  rankTitle: { fontSize: 19, fontWeight: '900' },
  rankXp: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, marginTop: 14, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 6, textAlign: 'right' },
  statRow: { flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  statValue: { fontSize: 17, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  section: { fontSize: 17, fontWeight: '900', color: colors.text, marginBottom: 12, marginTop: 4 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
  badge: {
    width: '31%', backgroundColor: colors.surface, borderRadius: 14, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  badgeLocked: { opacity: 0.42 },
  badgeIcon: { fontSize: 26 },
  badgeIconLocked: { opacity: 0.5 },
  badgeLabel: { fontSize: 11, fontWeight: '900', color: colors.text, marginTop: 5 },
  badgeDesc: { fontSize: 9, fontWeight: '600', color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  bg: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 10 },
  h: { fontSize: 13, fontWeight: '900', color: colors.text },
  col: { width: 70, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  matchName: { fontSize: 14, fontWeight: '800', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
