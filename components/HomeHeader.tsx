import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { gradients, shadow } from '@/constants/theme';
import { walletTotal, Wallet } from '@/models/types';

export default function HomeHeader({ username, wallet }: { username: string; wallet?: Wallet }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <LinearGradient
      colors={gradients.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, shadow.md, { paddingTop: insets.top + 10 }]}
    >
      <View style={styles.row}>
        <Pressable style={styles.left} onPress={() => router.push('/profile')}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.hi}>Welcome back</Text>
            <Text style={styles.name} numberOfLines={1}>{username}</Text>
          </View>
        </Pressable>

        <View style={styles.right}>
          <Pressable style={styles.coinPill} onPress={() => router.push('/wallet')}>
            <View style={styles.coinIcon}><Text style={styles.coinSym}>₹</Text></View>
            <Text style={styles.coinTxt}>{walletTotal(wallet)}</Text>
          </Pressable>
          <Pressable style={styles.bell} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications" size={20} color="#0A9A82" />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  hi: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  name: { color: '#fff', fontSize: 17, fontWeight: '900' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  coinIcon: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#F5B301',
    alignItems: 'center', justifyContent: 'center',
  },
  coinSym: { color: '#7A5200', fontWeight: '900', fontSize: 11 },
  coinTxt: { color: '#0A9A82', fontWeight: '900', fontSize: 14 },
  bell: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});
