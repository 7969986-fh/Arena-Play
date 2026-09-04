import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Contest } from '@/models/types';
import { gameGradient } from '@/constants/games';
import Coin from '@/components/ui/Coin';
import { colors, radius, shadow } from '@/constants/theme';
import { formatSchedule } from '@/utils/format';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={{ marginTop: 3 }}>{value}</View>
    </View>
  );
}

export default function ContestCard({
  contest,
  onPress,
  onJoin,
}: {
  contest: Contest;
  onPress: () => void;
  onJoin?: () => void;
}) {
  const grad = gameGradient(contest.gameId);
  const pct = Math.min(1, contest.filledSlots / contest.totalSlots);
  const spotsLeft = Math.max(0, contest.totalSlots - contest.filledSlots);
  const full = spotsLeft === 0;

  return (
    <Pressable style={[styles.card, shadow.md]} onPress={onPress}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <View style={styles.typePill}>
          <Text style={styles.typePillTxt}>
            {contest.matchType === 'free' ? 'FREE' : `₹${contest.entryFee}`}
          </Text>
        </View>
        <Text style={styles.bannerTitle} numberOfLines={2}>{contest.title}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.time}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} /> {formatSchedule(contest.schedule)}
        </Text>

        <View style={styles.stats}>
          <Stat label="PRIZE POOL" value={<Coin amount={contest.prizePool} size={14} />} />
          <Stat label="PER KILL" value={<Coin amount={contest.perKill} size={14} />} />
          <Stat label="ENTRY" value={
            contest.matchType === 'free'
              ? <Text style={styles.free}>FREE</Text>
              : <Coin amount={contest.entryFee} size={14} />
          } />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{contest.mode.toUpperCase()}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.meta}>{contest.map}</Text>
        </View>

        {/* Slots progress */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
        </View>
        <View style={styles.slotRow}>
          <Text style={[styles.spots, full && { color: colors.danger }]}>
            {full ? 'Contest Full' : `Only ${spotsLeft} spots left`}
          </Text>
          <Text style={styles.slotCount}>{contest.filledSlots}/{contest.totalSlots}</Text>
        </View>

        {onJoin && contest.status !== 'resulted' && (
          <Pressable
            style={[styles.joinBtn, full && styles.joinDisabled]}
            onPress={full ? undefined : onJoin}
          >
            <Text style={styles.joinTxt}>{full ? 'Full' : 'Join'}</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  banner: { padding: 14, minHeight: 78, justifyContent: 'space-between' },
  typePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
  },
  typePillTxt: { color: '#fff', fontWeight: '900', fontSize: 12 },
  bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 14, marginTop: 8 },
  body: { padding: 14 },
  time: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: colors.textFaint, fontWeight: '800', letterSpacing: 0.4 },
  free: { color: colors.success, fontWeight: '900', fontSize: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  meta: { fontSize: 12, color: colors.text, fontWeight: '700' },
  metaDot: { color: colors.textFaint },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.coin, borderRadius: 4 },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  spots: { fontSize: 12, color: colors.warning, fontWeight: '700' },
  slotCount: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  joinBtn: {
    marginTop: 12, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 11, alignItems: 'center',
  },
  joinDisabled: { backgroundColor: colors.textFaint },
  joinTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
