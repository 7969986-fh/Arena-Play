import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, gradients, shadow } from '@/constants/theme';

interface Props {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}

export default function Header({ title, back = true, right }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <LinearGradient
      colors={gradients.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, shadow.md, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.row}>
        <View style={styles.side}>
          {back ? (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={colors.onPrimary} />
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  side: { width: 44, justifyContent: 'center' },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.onPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
});
