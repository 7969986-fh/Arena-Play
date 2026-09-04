import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

interface Props {
  value: string | number;
  label: string;
  accent?: string;
}

export default function StatTile({ value, label, accent = colors.primary }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  value: { fontSize: 22, fontWeight: '900' },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
});
