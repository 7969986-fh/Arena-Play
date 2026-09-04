import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Game } from '@/models/types';
import { gameGradient } from '@/constants/games';
import { colors, radius, shadow } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GameCard({ game, onPress }: { game: Game; onPress: () => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const grad = gameGradient(game.id);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.96))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={[styles.wrap, shadow.md, anim]}
    >
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <Ionicons name="flame" size={30} color="rgba(255,255,255,0.35)" style={styles.flame} />
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>{game.activeContests ?? 0}</Text>
        </View>
      </LinearGradient>
      <View style={styles.footer}>
        <Text style={styles.name} numberOfLines={1}>{game.name}</Text>
        <Text style={styles.mode} numberOfLines={1}>{game.mode}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  banner: { height: 92, padding: 10, justifyContent: 'space-between' },
  flame: { position: 'absolute', right: 8, bottom: 6 },
  badge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3DFF88' },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  footer: { padding: 10 },
  name: { fontSize: 13.5, fontWeight: '800', color: colors.text },
  mode: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
});
