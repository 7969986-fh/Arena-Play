import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { useContest, useContestRegistrations } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { backend } from '@/services/backend';
import { Registration } from '@/models/types';
import { colors, radius, spacing } from '@/constants/theme';

export default function ManageMatch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { contest } = useContest(id!);
  const regs = useContestRegistrations(id!);
  const [roomId, setRoomId] = useState('');
  const [roomPw, setRoomPw] = useState('');
  // Result screenshot opened fullscreen while verifying a player's row.
  const [zoom, setZoom] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { kills: string; placement: string }>>({});
  const [savingRoom, setSavingRoom] = useState(false);
  const [declaring, setDeclaring] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'staff';

  React.useEffect(() => {
    if (contest && !seeded) {
      setRoomId(contest.roomId ?? '');
      setRoomPw(contest.roomPassword ?? '');
      setSeeded(true);
    }
  }, [contest, seeded]);

  if (!canManage) {
    return (
      <View style={styles.bg}>
        <Header title="Manage Match" />
        <EmptyState icon="lock-closed-outline" title="Staff only" subtitle="You do not have permission." />
      </View>
    );
  }
  if (!contest) {
    return <View style={styles.bg}><Header title="Manage Match" /><Text style={styles.msg}>Loading…</Text></View>;
  }

  function setField(regId: string, field: 'kills' | 'placement', value: string) {
    setResults((prev) => {
      const current = prev[regId] ?? { kills: '', placement: '' };
      return { ...prev, [regId]: { ...current, [field]: value.replace(/[^0-9]/g, '') } };
    });
  }

  async function saveRoom(goLive: boolean) {
    setSavingRoom(true);
    try {
      await backend.setRoomCredentials(contest!.id, roomId.trim(), roomPw.trim(), goLive ? 'ongoing' : undefined);
      Alert.alert('Saved', goLive ? 'Room shared and match is now live.' : 'Room credentials saved.');
    } catch (e: any) { Alert.alert('Error', e?.message ?? 'Failed'); }
    finally { setSavingRoom(false); }
  }

  function declare() {
    const rows = regs.map((r) => ({
      registrationId: r.id,
      kills: parseInt(results[r.id]?.kills ?? '', 10) || 0,
      placement: parseInt(results[r.id]?.placement ?? '', 10) || 0,
    }));
    Alert.alert('Declare results', 'This credits winnings to players and closes the contest. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Declare', onPress: async () => {
        setDeclaring(true);
        try {
          await backend.declareResults(contest!.id, rows);
          Alert.alert('Done', 'Results declared and prizes distributed.');
        } catch (e: any) { Alert.alert('Error', e?.message ?? 'Failed'); }
        finally { setDeclaring(false); }
      } },
    ]);
  }

  function removePlayer(r: Registration) {
    Alert.alert('Remove player', `Remove ${r.username} (${r.inGameName})? Entry fee is refunded.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => backend.removeRegistration(r) },
    ]);
  }

  const resulted = contest.status === 'resulted';

  return (
    <View style={styles.bg}>
      <Header title="Manage Match" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.title}>{contest.title}</Text>
          <Text style={styles.meta}>{contest.mode.toUpperCase()} • {contest.map} • {contest.filledSlots}/{contest.totalSlots} joined • {contest.status}</Text>
        </Card>

        {/* Room credentials */}
        <Text style={styles.section}>Room Credentials</Text>
        <Card>
          <View style={styles.grid2}>
            <Input label="Room ID" value={roomId} onChangeText={setRoomId} keyboardType="number-pad" containerStyle={styles.half} />
            <Input label="Password" value={roomPw} onChangeText={setRoomPw} containerStyle={styles.half} />
          </View>
          <View style={styles.actions}>
            <Button label="Save" variant="outline" size="sm" fullWidth={false} style={{ flex: 1 }} loading={savingRoom} onPress={() => saveRoom(false)} />
            <Button label="Save & Go Live" size="sm" fullWidth={false} style={{ flex: 1 }} loading={savingRoom} onPress={() => saveRoom(true)} />
          </View>
        </Card>

        {/* Results entry */}
        <Text style={styles.section}>Results & Players ({regs.length})</Text>
        {regs.length === 0 ? (
          <EmptyState icon="people-outline" title="No players joined yet" />
        ) : (
          <>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 1 }]}>Player</Text>
              <Text style={[styles.th, styles.numCol]}>Kills</Text>
              <Text style={[styles.th, styles.numCol]}>Rank</Text>
            </View>
            {regs.map((r) => (
              <Card key={r.id} style={styles.regCard} elevation="sm">
                <View style={styles.regRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ign}>{r.inGameName}</Text>
                    <Text style={styles.sub}>Slot {r.slotNumber} • {r.username}</Text>
                    {resulted && <Text style={styles.won}>Won ₹{r.wonAmount} • {r.kills}k / #{r.placement}</Text>}
                    {r.proofUrl ? (
                      <Pressable onPress={() => setZoom(r.proofUrl!)} style={styles.proofChip}>
                        <Ionicons name="image-outline" size={12} color={colors.primaryDark} />
                        <Text style={styles.proofChipTxt}>View result proof</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.noProof}>No proof uploaded</Text>
                    )}
                  </View>
                  {!resulted && (
                    <>
                      <TextInput
                        style={[styles.cell, styles.numCol]}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.textFaint}
                        value={results[r.id]?.kills ?? ''}
                        onChangeText={(v) => setField(r.id, 'kills', v)}
                      />
                      <TextInput
                        style={[styles.cell, styles.numCol]}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.textFaint}
                        value={results[r.id]?.placement ?? ''}
                        onChangeText={(v) => setField(r.id, 'placement', v)}
                      />
                    </>
                  )}
                </View>
                {!resulted && (
                  <Pressable style={styles.remove} onPress={() => removePlayer(r)} hitSlop={6}>
                    <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                    <Text style={styles.removeTxt}>Remove player</Text>
                  </Pressable>
                )}
              </Card>
            ))}
            {!resulted && (
              <Button label="Declare Results & Pay Winners" onPress={declare} loading={declaring} style={{ marginTop: spacing.md }} />
            )}
            {resulted && (
              <View style={styles.doneBanner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.doneTxt}>Results declared. Winnings paid out.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!zoom} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <Pressable style={styles.zoomBg} onPress={() => setZoom(null)}>
          {zoom ? <Image source={{ uri: zoom }} style={styles.zoomImg} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  msg: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
  title: { fontSize: 16, fontWeight: '900', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: spacing.md, marginBottom: 10 },
  grid2: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  tableHead: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 8 },
  th: { fontSize: 12, fontWeight: '900', color: colors.textMuted },
  numCol: { width: 56, textAlign: 'center' },
  proofChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    alignSelf: 'flex-start', backgroundColor: colors.mint,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  proofChipTxt: { fontSize: 10.5, fontWeight: '800', color: colors.primaryDark },
  noProof: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, marginTop: 6 },
  zoomBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  zoomImg: { width: '100%', height: '85%' },
  regCard: { marginBottom: 10 },
  regRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ign: { fontSize: 15, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  won: { fontSize: 12, color: colors.success, fontWeight: '800', marginTop: 3 },
  cell: {
    height: 42, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface, textAlign: 'center', fontWeight: '800', color: colors.text,
  },
  remove: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start' },
  removeTxt: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  doneBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.mint, borderRadius: radius.md, padding: 12, marginTop: spacing.md },
  doneTxt: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
});
