import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#0FB89B', '#7C4DFF', '#FFC107', '#FF5A8A', '#4B9FE1', '#3DFF88'];
const COUNT = 34;
const FALL_MS = 2200;

interface PieceProps {
  index: number;
  width: number;
  height: number;
}

function Piece({ index, width, height }: PieceProps) {
  const progress = useSharedValue(0);

  // Deterministic per-index scatter, so pieces differ without re-randomising
  // on every render.
  const startX = ((index * 37) % 100) / 100;
  const drift = (((index * 53) % 100) / 100 - 0.5) * width * 0.5;
  const size = 6 + ((index * 7) % 6);
  const spin = ((index * 41) % 4 + 2) * 360;
  const delay = (index % 8) * 90;
  const color = COLORS[index % COLORS.length];

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: FALL_MS, easing: Easing.out(Easing.quad) }),
    );
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * height * 1.1 },
      { translateX: progress.value * drift },
      { rotate: `${progress.value * spin}deg` },
    ],
    // Hold full opacity most of the way, then fade out at the end.
    opacity: progress.value > 0.75 ? (1 - progress.value) * 4 : 1,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: startX * width,
          width: size,
          height: size * 1.6,
          backgroundColor: color,
          borderRadius: index % 3 === 0 ? size : 1,
        },
        style,
      ]}
    />
  );
}

/**
 * One-shot confetti burst, played when a player sees they have won.
 *
 * Purely decorative and non-interactive, so it never blocks a tap on
 * whatever is underneath it.
 */
export default function Confetti({ show }: { show: boolean }) {
  const { width, height } = useWindowDimensions();
  if (!show) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: COUNT }).map((_, i) => (
        <Piece key={i} index={i} width={width} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: -30 },
});
