import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import HomeHeader from '@/components/HomeHeader';
import GameCard from '@/components/GameCard';
import PromoCarousel from '@/components/PromoCarousel';
import WinnersFeed from '@/components/WinnersFeed';
import DailyBonus from '@/components/DailyBonus';
import { GameGridSkeleton } from '@/components/ui/Skeleton';
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
  const { games, loading: gamesLoading } = useGames();
  const router = useRouter();

  return (
    <View style={styles.bg}>
      <HomeHeader username={user?.username ?? 'Player'} wallet={user?.wallet} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 90 }}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <PromoCarousel />
        </Animated.View>

        <DailyBonus />

        <WinnersFeed />

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
        {gamesLoading ? (
          <GameGridSkeleton />
        ) : (
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
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
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
