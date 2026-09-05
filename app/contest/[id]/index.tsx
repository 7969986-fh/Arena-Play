import React, { useEffect, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Coin from '@/components/ui/Coin';
import { useContest, useUserRegistrations } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { gameArt } from '@/constants/gameArt';
import { shareContest } from '@/utils/share';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { countdown, formatSchedule } from '@/utils/format';

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

export default function ContestDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { contest, loading } = useContest(id!);
  const regs = useUserRegistrations(user?.uid ?? null);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!contest) {
    return (
      <View style={styles.bg}>
        <Header title="Contest" />
        <Text style={styles.loading}>{loading ? 'Loading…' : 'Contest not found.'}</Text>
      </View>
    );
  }

  const joined = regs.find((r) => r.contestId === contest.id);
  const full = contest.filledSlots >= contest.totalSlots;

  return (
    <View style={styles.bg}>
      <Header
        title={`Contest #${contest.id.slice(-5)}`}
        right={
          <Pressable onPress={() => shareContest(contest)} hitSlop={12}>
            <Ionicons name="share-social" size={22} color={colors.onPrimary} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={gameArt(contest.gameId)}
          style={[styles.banner, shadow.md]}
          imageStyle={styles.bannerImg}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.bannerTitle}>{contest.title}</Text>
        </ImageBackground>

        <Card style={styles.countdownCard} elevation="sm">
          <Text style={styles.countdownLabel}>
            {contest.status === 'resulted' ? 'Match Completed' : 'Time Left'}
          </Text>
          <Text style={styles.countdown}>
            {contest.status === 'resulted' ? '—' : countdown(contest.schedule)}
          </Text>
        </Card>

        <View style={styles.chips}>
          <Chip label="Team" value={contest.mode.toUpperCase()} />
          <Chip label="Map" value={contest.map} />
          <Chip label="Type" value={contest.matchType === 'free' ? 'Free' : 'Paid'} />
        </View>

        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Entry Fee</Text>
            {contest.matchType === 'free'
              ? <Text style={styles.freeTag}>FREE</Text>
              : <Coin amount={contest.entryFee} />}
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prize Pool</Text>
            <Coin amount={contest.prizePool} />
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Per Kill</Text>
            <Coin amount={contest.perKill} />
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Schedule</Text>
            <Text style={styles.infoValue}>{formatSchedule(contest.schedule)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Slots</Text>
            <Text style={styles.infoValue}>{contest.filledSlots}/{contest.totalSlots}</Text>
          </View>
        </Card>

        {joined && contest.status === 'ongoing' && !!contest.roomId && (
          <Card style={[styles.roomCard, { marginTop: spacing.md }]}>
            <Text style={styles.roomTitle}>🎮 Room Credentials</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Room ID</Text>
              <Text style={styles.roomValue}>{contest.roomId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Password</Text>
              <Text style={styles.roomValue}>{contest.roomPassword}</Text>
            </View>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Prize Details</Text>
        <Card>
          {contest.prizeBreakdown.map((p, i) => (
            <View key={p.rank}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.infoRow}>
                <Text style={styles.rankLabel}>#{p.rank}</Text>
                <Coin amount={p.amount} size={14} />
              </View>
            </View>
          ))}
        </Card>

        {contest.rules ? (
          <>
            <Text style={styles.sectionTitle}>Rules</Text>
            <Card><Text style={styles.rules}>{contest.rules}</Text></Card>
          </>
        ) : null}

        <View style={{ height: spacing.lg }} />
        {contest.status === 'resulted' ? (
          <Button label="Match Completed" disabled variant="outline" />
        ) : joined ? (
          <Button label="Already Joined ✓" disabled variant="outline" />
        ) : (
          <Button
            label={full ? 'Contest Full' : 'Join Match'}
            disabled={full}
            onPress={() => router.push(`/contest/${contest.id}/join`)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  loading: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
  bannerImg: { borderRadius: radius.lg, resizeMode: 'cover' },
  banner: { borderRadius: radius.lg, padding: 18, minHeight: 110, justifyContent: 'flex-end' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  countdownCard: { marginTop: spacing.md, alignItems: 'center', backgroundColor: colors.mint },
  countdownLabel: { fontSize: 12, color: colors.primaryDark, fontWeight: '700' },
  countdown: { fontSize: 22, fontWeight: '900', color: colors.primaryDark, marginTop: 2 },
  chips: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  chip: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },
  chipLabel: { fontSize: 11, color: colors.textFaint, fontWeight: '700' },
  chipValue: { fontSize: 14, color: colors.text, fontWeight: '900', marginTop: 3 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '800' },
  freeTag: { color: colors.success, fontWeight: '900', fontSize: 15 },
  divider: { height: 1, backgroundColor: colors.border },
  roomCard: { backgroundColor: '#FFF8E1', borderColor: '#F5D580' },
  roomTitle: { fontSize: 15, fontWeight: '900', color: '#7A5200', marginBottom: 6 },
  roomValue: { fontSize: 16, fontWeight: '900', color: '#7A5200', letterSpacing: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: spacing.lg, marginBottom: 10 },
  rankLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  rules: { fontSize: 14, color: colors.textMuted, lineHeight: 20, fontWeight: '500' },
});
