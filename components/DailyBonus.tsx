import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { backend } from '@/services/backend';
import { useToast } from '@/components/ui/Toast';
import { colors, radius, shadow } from '@/constants/theme';

/** Reward for each day of the streak, mirroring streak_reward() in SQL. */
const REWARDS = [2, 3, 5, 8, 12, 18, 25];

/**
 * Daily login reward with a visible 7-day streak.
 *
 * The claim itself is a server call: the reward, the streak and the
 * once-a-day limit are all decided in the database, so this is only ever a
 * view of that state. Once claimed it collapses to a quiet confirmation
 * rather than continuing to occupy the top of the screen.
 */
export default function DailyBonus() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [claimed, setClaimed] = useState<{ reward: number; streak: number } | null>(null);
  // Hidden after the server says it is already claimed today.
  const [done, setDone] = useState(false);

  async function claim() {
    setBusy(true);
    try {
      const res = await backend.claimDailyBonus();
      setClaimed(res);
      toast.success(`+${res.reward} bonus coins`, `Day ${res.streak} of your streak`);
    } catch (e: any) {
      const msg = e?.message ?? 'Could not claim right now.';
      if (/already claimed/i.test(msg)) {
        setDone(true);
      } else {
        toast.error('Daily bonus', msg);
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) return null;

  if (claimed) {
    return (
      <Animated.View entering={FadeIn} style={[styles.done, shadow.sm]}>
        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
        <Text style={styles.doneTxt}>
          Day {claimed.streak} claimed · +{claimed.reward} coins
        </Text>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.card, shadow.sm]}>
      <View style={styles.top}>
        <View style={styles.gift}>
          <Ionicons name="gift" size={19} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Daily Reward</Text>
          <Text style={styles.sub}>Claim every day for a bigger bonus</Text>
        </View>
      </View>

      <View style={styles.days}>
        {REWARDS.map((r, i) => (
          <View key={i} style={styles.day}>
            <Text style={styles.dayNum}>D{i + 1}</Text>
            <Text style={styles.dayCoins}>{r}</Text>
          </View>
        ))}
      </View>

      <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={claim} disabled={busy}>
        <Text style={styles.btnTxt}>{busy ? 'Claiming…' : 'Claim today'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  gift: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '900', color: colors.text },
  sub: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13, gap: 5 },
  day: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: 9,
    paddingVertical: 7,
  },
  dayNum: { fontSize: 9, fontWeight: '800', color: colors.textMuted },
  dayCoins: { fontSize: 12.5, fontWeight: '900', color: colors.primaryDark, marginTop: 1 },
  btn: {
    marginTop: 13,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontSize: 14.5, fontWeight: '800' },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 18,
  },
  doneTxt: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },
});
