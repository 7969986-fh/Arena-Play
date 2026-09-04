import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/constants/theme';

interface Props extends ViewProps {
  style?: StyleProp<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg';
  padded?: boolean;
}

/** Glassy white 3D card with soft layered shadow. */
export default function Card({
  style,
  elevation = 'md',
  padded = true,
  children,
  ...rest
}: Props) {
  return (
    <View
      style={[styles.card, shadow[elevation], padded && styles.padded, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: 16 },
});
