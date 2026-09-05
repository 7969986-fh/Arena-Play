import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useGames } from '@/hooks/useData';
import { backend } from '@/services/backend';
import ScreenshotPicker from '@/components/ScreenshotPicker';
import { DEFAULT_RULES } from '@/constants/rules';
import { ContestMode, MatchType, PrizeRow } from '@/models/types';
import { colors, radius, spacing } from '@/constants/theme';

const MODES: ContestMode[] = ['solo', 'duo', 'squad'];
const SCHEDULES = [
  { label: 'In 1h', h: 1 }, { label: 'In 3h', h: 3 },
  { label: 'In 6h', h: 6 }, { label: 'Tomorrow', h: 24 },
];

function autoPrize(pool: number): PrizeRow[] {
  const pct = [0.4, 0.25, 0.15, 0.12, 0.08];
  return pct.map((p, i) => ({ rank: i + 1, amount: Math.round(pool * p) })).filter((r) => r.amount > 0);
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{label}</Text>
    </Pressable>
  );
}

export default function CreateContest() {
  const router = useRouter();
  const { games } = useGames();
  const [gameId, setGameId] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<ContestMode>('solo');
  const [map, setMap] = useState('Bermuda');
  const [type, setType] = useState<MatchType>('paid');
  const [entryFee, setEntryFee] = useState('10');
  const [prizePool, setPrizePool] = useState('200');
  const [perKill, setPerKill] = useState('0');
  const [slots, setSlots] = useState('20');
  const [schedH, setSchedH] = useState(6);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [banner, setBanner] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!gameId) { Alert.alert('Select a game'); return; }
    if (!title.trim()) { Alert.alert('Enter a title'); return; }
    const pool = parseInt(prizePool, 10) || 0;
    setLoading(true);
    try {
      await backend.createContest({
        gameId,
        title: title.trim(),
        mode,
        map: map.trim() || 'Bermuda',
        matchType: type,
        entryFee: type === 'free' ? 0 : parseInt(entryFee, 10) || 0,
        prizePool: pool,
        perKill: parseInt(perKill, 10) || 0,
        totalSlots: parseInt(slots, 10) || 2,
        schedule: Date.now() + schedH * 3600_000,
        prizeBreakdown: autoPrize(pool),
        rules: rules.trim(),
        bannerUrl: banner ? await backend.uploadImage(banner, 'contests') : '',
        videoUrl: videoUrl.trim(),
      });
      Alert.alert('Created', 'Contest published.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert('Error', e?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <View style={styles.bg}>
      <Header title="Create Contest" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.label}>Game</Text>
          <View style={styles.chips}>
            {games.map((g) => <Chip key={g.id} label={g.name} active={gameId === g.id} onPress={() => setGameId(g.id)} />)}
          </View>

          <Input label="Title" placeholder="e.g. BR SURVIVAL PRO LOBBY" value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Mode</Text>
          <View style={styles.chips}>
            {MODES.map((m) => <Chip key={m} label={m.toUpperCase()} active={mode === m} onPress={() => setMode(m)} />)}
          </View>

          <Input label="Map" placeholder="Bermuda" value={map} onChangeText={setMap} />

          <Text style={styles.label}>Match Type</Text>
          <View style={styles.chips}>
            <Chip label="PAID" active={type === 'paid'} onPress={() => setType('paid')} />
            <Chip label="FREE" active={type === 'free'} onPress={() => setType('free')} />
          </View>

          <View style={styles.grid2}>
            {type === 'paid' && (
              <Input label="Entry Fee" keyboardType="number-pad" value={entryFee} onChangeText={setEntryFee} containerStyle={styles.half} />
            )}
            <Input label="Prize Pool" keyboardType="number-pad" value={prizePool} onChangeText={setPrizePool} containerStyle={styles.half} />
            <Input label="Per Kill" keyboardType="number-pad" value={perKill} onChangeText={setPerKill} containerStyle={styles.half} />
            <Input label="Total Slots" keyboardType="number-pad" value={slots} onChangeText={setSlots} containerStyle={styles.half} />
          </View>

          <Text style={styles.label}>Schedule</Text>
          <View style={styles.chips}>
            {SCHEDULES.map((s) => <Chip key={s.h} label={s.label} active={schedH === s.h} onPress={() => setSchedH(s.h)} />)}
          </View>

          <Text style={styles.label}>Banner image (optional)</Text>
          <ScreenshotPicker
            value={banner}
            onChange={setBanner}
            label=""
            hint="Replaces the default artwork on this contest's cards"
          />

          <Input
            label="Video link (optional)"
            placeholder="YouTube or any video URL"
            autoCapitalize="none"
            value={videoUrl}
            onChangeText={setVideoUrl}
            containerStyle={{ marginTop: spacing.md }}
          />

          <Text style={styles.label}>Rules</Text>
          <TextInput
            style={styles.rulesInput}
            multiline
            textAlignVertical="top"
            value={rules}
            onChangeText={setRules}
            placeholder="Match rules shown to players before joining"
            placeholderTextColor={colors.textFaint}
          />

          <Text style={styles.hint}>Prize split (top places) is auto-generated from the prize pool.</Text>
          <Button label="Publish Contest" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  label: { fontSize: 13, fontWeight: '800', color: colors.textMuted, marginBottom: 8, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  chipTxt: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  chipTxtActive: { color: '#fff' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '48%' },
  rulesInput: {
    minHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: 12, fontSize: 12.5, lineHeight: 19, color: colors.text,
    backgroundColor: colors.surfaceMuted, marginBottom: spacing.md,
  },
  hint: { fontSize: 12, color: colors.textFaint, marginBottom: 8 },
});
