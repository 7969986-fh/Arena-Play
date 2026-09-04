import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '@/constants/theme';

interface Props<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            style={[styles.item, active && [styles.active, shadow.sm]]}
            onPress={() => onChange(o.key)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  item: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.pill },
  active: { backgroundColor: colors.surface },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  labelActive: { color: colors.primary, fontWeight: '900' },
});
