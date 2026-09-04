import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/constants/theme';

interface Props {
  total: number;
  taken: number[];
  selected: number | null;
  onSelect: (slot: number) => void;
}

export default function SlotGrid({ total, taken, selected, onSelect }: Props) {
  const slots = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <View style={styles.grid}>
      {slots.map((s) => {
        const isTaken = taken.includes(s);
        const isSel = selected === s;
        return (
          <Pressable
            key={s}
            disabled={isTaken}
            onPress={() => onSelect(s)}
            style={[
              styles.slot,
              isTaken && styles.taken,
              isSel && styles.selected,
            ]}
          >
            <Text style={[styles.num, isSel && styles.numSel, isTaken && styles.numTaken]}>
              {s}
            </Text>
            <Text style={[styles.status, isSel && styles.numSel, isTaken && styles.numTaken]}>
              {isTaken ? 'Taken' : isSel ? 'You' : 'Open'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    width: '18%',
    aspectRatio: 0.9,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taken: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, opacity: 0.6 },
  selected: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  num: { fontSize: 16, fontWeight: '900', color: colors.text },
  numSel: { color: '#fff' },
  numTaken: { color: colors.textFaint },
  status: { fontSize: 9, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
});
