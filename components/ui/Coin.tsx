import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

interface Props {
  amount: number | string;
  size?: number;
  color?: string;
  bold?: boolean;
}

/** Gold coin glyph + amount. */
export default function Coin({ amount, size = 15, color = colors.text, bold = true }: Props) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.coin,
          { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
        ]}
      >
        <Text style={[styles.symbol, { fontSize: size * 0.62 }]}>₹</Text>
      </View>
      <Text style={{ fontSize: size, color, fontWeight: bold ? '800' : '600' }}>
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coin: {
    backgroundColor: colors.coin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { color: '#7A5200', fontWeight: '900' },
});
