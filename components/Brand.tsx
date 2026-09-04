import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, shadow } from '@/constants/theme';

export default function Brand({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 84 : 40;
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={gradients.primary}
        style={[
          styles.badge,
          shadow.lg,
          { width: dim, height: dim, borderRadius: dim / 3 },
        ]}
      >
        <Ionicons name="game-controller" size={dim * 0.5} color="#fff" />
      </LinearGradient>
      {size === 'lg' && (
        <>
          <Text style={styles.name}>Arena Play</Text>
          <Text style={styles.tag}>Compete • Win • Repeat</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  badge: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 28, fontWeight: '900', color: colors.text, marginTop: 14, letterSpacing: 0.5 },
  tag: { fontSize: 14, color: colors.primary, fontWeight: '700', marginTop: 2 },
});
