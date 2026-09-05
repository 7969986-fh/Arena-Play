import React, { useEffect, useRef, useState } from 'react';
import {
  ImageBackground,
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
import { PROMOS } from '@/constants/gameArt';
import { radius, shadow, spacing } from '@/constants/theme';

const AUTOPLAY_MS = 4500;

/** Auto-advancing promo banners with swipe and page dots. */
export default function PromoCarousel() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardW = width - spacing.lg * 2;
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  // Pause autoplay briefly after a manual swipe so it doesn't fight the user.
  const pausedUntil = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setIndex((prev) => {
        const next = (prev + 1) % PROMOS.length;
        scroller.current?.scrollTo({ x: next * cardW, animated: true });
        return next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [cardW]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    pausedUntil.current = Date.now() + AUTOPLAY_MS * 2;
    setIndex(Math.round(e.nativeEvent.contentOffset.x / cardW));
  };

  return (
    <View>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        decelerationRate="fast"
        snapToInterval={cardW}
      >
        {PROMOS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(p.href as never)}
            style={{ width: cardW }}
          >
            <ImageBackground
              source={p.image}
              style={[styles.card, shadow.md]}
              imageStyle={styles.cardImg}
            >
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.sub}>{p.subtitle}</Text>
              <View style={styles.btn}>
                <Text style={styles.btnTxt}>View</Text>
              </View>
            </ImageBackground>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {PROMOS.map((p, i) => (
          <View key={p.id} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 132,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 16,
    justifyContent: 'center',
  },
  cardImg: { borderRadius: radius.lg, resizeMode: 'cover' },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  sub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: '600',
    maxWidth: '62%',
  },
  btn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  btnTxt: { color: '#0B3B33', fontWeight: '800', fontSize: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(11,59,51,0.22)',
  },
  dotOn: { width: 18, backgroundColor: '#0FB89B' },
});
