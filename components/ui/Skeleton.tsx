import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '@/constants/theme';

/**
 * Placeholder blocks shown while real content loads.
 *
 * A spinner tells the player only that something is happening; a skeleton
 * shaped like the incoming content tells them what is about to arrive and
 * keeps the layout from jumping when it does.
 */

const SHIMMER_MS = 1300;

export function Skeleton({
  width = '100%',
  height = 14,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SHIMMER_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-220, 220]) }],
  }));

  return (
    <View style={[styles.base, { width, height }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, sweep]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.75)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Placeholder matching the game grid on the home screen. */
export function GameGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <Skeleton height={92} style={{ borderRadius: 0 }} />
          <View style={{ padding: 10, gap: 6 }}>
            <Skeleton width="80%" height={12} />
            <Skeleton width="50%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Placeholder matching a list of contest cards. */
export function ContestListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <Skeleton height={78} style={{ borderRadius: 0 }} />
          <View style={{ padding: 14, gap: 9 }}>
            <Skeleton width="45%" height={11} />
            <View style={styles.row}>
              <Skeleton width="28%" height={13} />
              <Skeleton width="28%" height={13} />
              <Skeleton width="28%" height={13} />
            </View>
            <Skeleton height={8} style={{ borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Placeholder for stacked rows: leaderboard, transactions, joinings. */
export function ListSkeleton({ count = 6, avatar = true }: { count?: number; avatar?: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.listRow}>
          {avatar && <Skeleton width={38} height={38} style={{ borderRadius: 19 }} />}
          <View style={{ flex: 1, gap: 7 }}>
            <Skeleton width="55%" height={12} />
            <Skeleton width="32%" height={10} />
          </View>
          <Skeleton width={56} height={16} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#DDE7E4',
    borderRadius: 7,
    overflow: 'hidden',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
