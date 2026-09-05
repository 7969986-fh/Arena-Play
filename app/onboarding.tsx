import React, { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';

/** Set once the intro has been seen, so it never shows again. */
export const ONBOARDED_KEY = 'arenaplay.onboarded';

const SLIDES = [
  {
    id: 'join',
    image: require('@/assets/onboard/onboard-join.png'),
    title: 'Pick your match',
    body: 'Browse Free Fire contests by mode, check the prize pool and entry fee, and grab a slot before it fills.',
  },
  {
    id: 'play',
    image: require('@/assets/onboard/onboard-play.png'),
    title: 'Play the match',
    body: 'Your room ID and password appear in the app shortly before the match starts. Play, then upload your result screenshot.',
  },
  {
    id: 'win',
    image: require('@/assets/onboard/onboard-win.png'),
    title: 'Win and withdraw',
    body: 'Prizes are credited to your wallet once staff verify results. Winnings can be withdrawn straight to your UPI.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const last = index === SLIDES.length - 1;

  async function finish() {
    // Recorded before navigating so a slow write cannot show the intro twice.
    await AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
    router.replace('/(auth)/login');
  }

  function next() {
    if (last) return finish();
    scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
  }

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View style={[styles.bg, { paddingTop: insets.top }]}>
      <Pressable style={styles.skip} onPress={finish} hitSlop={12}>
        <Text style={styles.skipTxt}>{last ? '' : 'Skip'}</Text>
      </Pressable>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {SLIDES.map((s) => (
          <View key={s.id} style={[styles.slide, { width }]}>
            <Image source={s.image} style={styles.art} resizeMode="contain" />
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
        <Button label={last ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  skip: { alignSelf: 'flex-end', paddingHorizontal: spacing.lg, paddingVertical: 10, height: 40 },
  skipTxt: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  art: { width: 260, height: 260, marginBottom: spacing.lg },
  title: { fontSize: 25, fontWeight: '900', color: colors.text, textAlign: 'center' },
  body: {
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 320,
  },
  footer: { paddingHorizontal: spacing.lg, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(11,59,51,0.2)' },
  dotOn: { width: 22, backgroundColor: colors.primary },
});
