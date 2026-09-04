import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, gradients, radius, shadow, spacing } from '@/constants/theme';

type Variant = 'primary' | 'gold' | 'danger' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const gradientFor: Record<Variant, readonly [string, string] | null> = {
  primary: gradients.primary,
  gold: gradients.gold,
  danger: gradients.danger,
  outline: null,
  ghost: null,
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  fullWidth = true,
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isFlat = variant === 'outline' || variant === 'ghost';
  const grad = gradientFor[variant];
  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const textColor =
    variant === 'outline' ? colors.primary : variant === 'ghost' ? colors.text : colors.onPrimary;

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor, fontSize: size === 'sm' ? 14 : 16 }]}>
          {label}
        </Text>
      )}
    </>
  );

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={() => (scale.value = withSpring(0.96, { damping: 15 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
      style={[
        animStyle,
        fullWidth && { alignSelf: 'stretch' },
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}
    >
      {grad ? (
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, shadow.md, { height }]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <Animated.View
          style={[
            styles.base,
            { height },
            isFlat && styles.flat,
            variant === 'outline' && styles.outline,
          ]}
        >
          {inner}
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  flat: { backgroundColor: 'transparent' },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  label: { fontWeight: '800', letterSpacing: 0.3 },
});
