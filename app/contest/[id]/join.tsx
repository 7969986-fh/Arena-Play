import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Coin from '@/components/ui/Coin';
import SlotGrid from '@/components/SlotGrid';
import { useContest, useContestRegistrations } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { backend } from '@/services/backend';
import { scheduleMatchReminders } from '@/utils/notify';
import { DEFAULT_RULES } from '@/constants/rules';
import { walletTotal } from '@/models/types';
import { colors, spacing } from '@/constants/theme';
import { useToast } from '@/components/ui/Toast';

export default function JoinContest() {
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { contest } = useContest(id!);
  const regs = useContestRegistrations(id!);
  const [slot, setSlot] = useState<number | null>(null);
  const [ign, setIgn] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const taken = useMemo(() => regs.map((r) => r.slotNumber), [regs]);
  const balance = walletTotal(user?.wallet);

  if (!contest || !user) {
    return (
      <View style={styles.bg}>
        <Header title="Joining Match" />
        <Text style={styles.msg}>Loading…</Text>
      </View>
    );
  }

  async function onJoin() {
    if (!slot) { toast.error('Select a slot', 'Please choose an open match position.'); return; }
    if (!ign.trim()) { toast.error('In-game name', 'Please enter your in-game username.'); return; }
    if (!accepted) { toast.error('Accept the rules', 'Please read and accept the match rules before joining.'); return; }
    if (contest!.entryFee > 0 && balance < contest!.entryFee) {
      Alert.alert('Low balance', 'Please recharge your wallet to join this paid match.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recharge', onPress: () => router.replace('/wallet/recharge') },
      ]);
      return;
    }
    setLoading(true);
    try {
      await backend.joinContest({
        contest: contest!,
        user: user!,
        slotNumber: slot,
        inGameName: ign.trim(),
      });
      // Reminders are best-effort and must not delay the confirmation.
      scheduleMatchReminders(contest!);
      toast.success('Joined!', 'You have successfully joined the match.');
      router.replace(`/contest/${contest!.id}`);
    } catch (e: any) {
      toast.error('Could not join', e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.bg}>
      <Header title="Joining Match" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card style={styles.summary}>
          <Row label="Your Balance" value={<Coin amount={balance} />} />
          <View style={styles.divider} />
          <Row label="Entry Fee" value={
            contest.matchType === 'free'
              ? <Text style={styles.free}>FREE</Text>
              : <Coin amount={contest.entryFee} />} />
          <View style={styles.divider} />
          <Row label="Total Payable" value={<Coin amount={contest.entryFee} />} bold />
        </Card>

        <Text style={styles.section}>Select Match Position</Text>
        <SlotGrid total={contest.totalSlots} taken={taken} selected={slot} onSelect={setSlot} />

        <Text style={styles.section}>In-Game Name</Text>
        <Input
          placeholder="Enter your Free Fire username"
          value={ign}
          onChangeText={setIgn}
          autoCapitalize="none"
        />
        <Text style={styles.note}>Note: Enter your exact in-game username. Wrong names may be disqualified.</Text>

        <Text style={styles.section}>Match Rules</Text>
        <Card>
          <Text style={styles.rules} numberOfLines={rulesOpen ? undefined : 6}>
            {contest.rules || DEFAULT_RULES}
          </Text>
          <Pressable onPress={() => setRulesOpen((v) => !v)} hitSlop={8}>
            <Text style={styles.rulesToggle}>
              {rulesOpen ? 'Show less' : 'Read all rules'}
            </Text>
          </Pressable>
        </Card>

        <Pressable style={styles.acceptRow} onPress={() => setAccepted((v) => !v)}>
          <View style={[styles.box, accepted && styles.boxOn]}>
            {accepted && <Ionicons name="checkmark" size={15} color="#fff" />}
          </View>
          <Text style={styles.acceptTxt}>
            I have read and agree to the match rules, and understand that breaking
            them can forfeit my prize.
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Button label="Cancel" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} fullWidth={false} />
          <Button
            label="Join"
            onPress={onJoin}
            loading={loading}
            disabled={!accepted}
            style={{ flex: 1 }}
            fullWidth={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && { color: colors.text, fontWeight: '800' }]}>{label}</Text>
      {value}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  msg: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
  summary: { marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
  free: { color: colors.success, fontWeight: '900', fontSize: 15 },
  section: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: spacing.lg, marginBottom: 12 },
  note: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontWeight: '500' },
  rules: { fontSize: 12.5, lineHeight: 19, color: colors.textMuted, fontWeight: '500' },
  rulesToggle: { marginTop: 8, fontSize: 12.5, fontWeight: '800', color: colors.primary },
  acceptRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginTop: spacing.md, paddingHorizontal: 2,
  },
  box: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  boxOn: { backgroundColor: colors.primary },
  acceptTxt: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.text, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
});
