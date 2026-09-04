import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { walletTotal } from '@/models/types';
import { colors, spacing } from '@/constants/theme';

export default function JoinContest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { contest } = useContest(id!);
  const regs = useContestRegistrations(id!);
  const [slot, setSlot] = useState<number | null>(null);
  const [ign, setIgn] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!slot) { Alert.alert('Select a slot', 'Please choose an open match position.'); return; }
    if (!ign.trim()) { Alert.alert('In-game name', 'Please enter your in-game username.'); return; }
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
      Alert.alert('Joined!', 'You have successfully joined the match.', [
        { text: 'OK', onPress: () => router.replace(`/contest/${contest!.id}`) },
      ]);
    } catch (e: any) {
      Alert.alert('Could not join', e?.message ?? 'Something went wrong.');
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

        <View style={styles.actions}>
          <Button label="Cancel" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} fullWidth={false} />
          <Button label="Join" onPress={onJoin} loading={loading} style={{ flex: 1 }} fullWidth={false} />
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
  actions: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
});
