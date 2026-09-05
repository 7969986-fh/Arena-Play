import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecentWin } from '@/services/backendTypes';
import { backend } from '@/services/backend';
import { colors, radius } from '@/constants/theme';

const SCROLL_MS = 2600;
const CARD_W = 214;

/** Shortens a name so one long handle cannot dominate the strip. */
function shorten(name: string) {
  return name.length > 12 ? `${name.slice(0, 11)}…` : name;
}

function medal(placement: number) {
  return placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '🎯';
}

/**
 * Auto-scrolling strip of genuine recent payouts.
 *
 * New players' main worry is whether an app like this actually pays out, so
 * this shows real wins from the database — never placeholders. It renders
 * nothing at all until there is something true to show.
 */
export default function WinnersFeed() {
  const [wins, setWins] = useState<RecentWin[]>([]);
  const scroller = useRef<ScrollView>(null);
  const index = useRef(0);

  useEffect(() => backend.watchRecentWins(setWins), []);

  useEffect(() => {
    if (wins.length < 2) return;
    const t = setInterval(() => {
      index.current = (index.current + 1) % wins.length;
      scroller.current?.scrollTo({ x: index.current * CARD_W, animated: true });
    }, SCROLL_MS);
    return () => clearInterval(t);
  }, [wins.length]);

  // An empty feed is better than a fabricated one.
  if (wins.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.live}>
          <View style={styles.dot} />
          <Text style={styles.liveTxt}>LIVE WINS</Text>
        </View>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 10 }}
      >
        {wins.map((w) => (
          <View key={w.id} style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={14} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {medal(w.placement)} {shorten(w.username)}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {w.contestTitle}
              </Text>
            </View>
            <Text style={styles.amount}>₹{w.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  liveTxt: { fontSize: 11.5, fontWeight: '900', color: colors.textMuted, letterSpacing: 0.6 },
  card: {
    width: CARD_W - 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 12.5, fontWeight: '800', color: colors.text },
  sub: { fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  amount: { fontSize: 14, fontWeight: '900', color: colors.primary },
});
