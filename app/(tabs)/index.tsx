import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import HomeHeader from '@/components/HomeHeader';
import GameCard from '@/components/GameCard';
import { useAuth } from '@/hooks/useAuth';
import { useGames } from '@/hooks/useData';
import { colors, radius, shadow, spacing } from '@/constants/theme';

const MATCH_TILES = [
  { key: 'ongoing', label: 'Ongoing', icon: 'sync-outline', color: '#22C55E' },
  { key: 'upcoming', label: 'Upcoming', icon: 'calendar-outline', color: '#4B9FE1' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-done-outline', color: '#0FB89B' },
] as const;

export default function Home() {
  const { user } = useAuth();
  const { games } = useGames();
  const router = useRouter();

  return (
    <View style={styles.bg}>
      <HomeHeader username={user?.username ?? 'Player'} wallet={user?.wallet} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 90 }}
      >
        {/* Promo banner */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={['#7C4DFF', '#4A1E9E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.promo, shadow.md]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>Customer Support</Text>
              <Text style={styles.promoSub}>10 AM to 10 PM • Daily</Text>
              <View style={styles.promoBtn}>
                <Text style={styles.promoBtnTxt}>More details</Text>
              </View>
            </View>
            <Ionicons name="headset" size={60} color="rgba(255,255,255,0.35)" />
          </LinearGradient>
        </Animated.View>

        {/* My Matches */}
        <Text style={styles.section}>My Matches</Text>
        <View style={styles.tiles}>
          {MATCH_TILES.map((t, i) => (
            <Animated.View key={t.key} entering={FadeInDown.delay(80 * i).duration(400)} style={{ flex: 1 }}>
              <Pressable
                style={[styles.tile, shadow.sm]}
                onPress={() => router.push(`/my-matches?filter=${t.key}`)}
              >
                <View style={[styles.tileIcon, { backgroundColor: t.color }]}>
                  <Ionicons name={t.icon as any} size={22} color="#fff" />
                </View>
                <Text style={styles.tileLabel}>{t.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Esports Games */}
        <Text style={styles.section}>Esports Games</Text>
        <View style={styles.grid}>
          {games.map((g, i) => (
            <Animated.View
              key={g.id}
              entering={FadeInDown.delay(60 * i).duration(400)}
              style={{ width: '48%' }}
            >
              <GameCard game={g} onPress={() => router.push(`/game/${g.id}`)} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: spacing.lg,
  },
  promoTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  promoSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, fontWeight: '600' },
  promoBtn: {
    alignSelf: 'flex-start', marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
  },
  promoBtnTxt: { color: '#4A1E9E', fontWeight: '800', fontSize: 12 },
  section: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 12, marginTop: 4 },
  tiles: { flexDirection: 'row', gap: 10, marginBottom: spacing.xl },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  tileLabel: { fontSize: 13, fontWeight: '800', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
