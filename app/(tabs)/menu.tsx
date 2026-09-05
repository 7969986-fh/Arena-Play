import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '@/components/ui/Card';
import StatTile from '@/components/ui/StatTile';
import { useAuth } from '@/hooks/useAuth';
import { colors, gradients, radius, shadow, spacing } from '@/constants/theme';
import { shareApp } from '@/utils/share';

interface Item {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: () => void;
}

export default function Menu() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [notice, setNotice] = React.useState(true);

  const items: Item[] = [
    { label: 'My Profile', icon: 'person-outline', route: '/profile' },
    { label: 'My Wallet', icon: 'wallet-outline', route: '/wallet' },
    { label: 'My Statistics', icon: 'stats-chart-outline', route: '/statistics' },
    { label: 'Top Players', icon: 'trophy-outline', route: '/(tabs)/leaderboard' },
    { label: 'Invite Friends', icon: 'share-social-outline', action: shareApp },
    { label: 'Notifications', icon: 'notifications-outline', route: '/notifications' },
    { label: 'Contact Us', icon: 'headset-outline', route: '/info/contact' },
    { label: 'FAQ', icon: 'help-circle-outline', route: '/info/faq' },
    { label: 'About Us', icon: 'information-circle-outline', route: '/info/about' },
    { label: 'Privacy Policy', icon: 'lock-closed-outline', route: '/info/privacy' },
  ];

  const admin: Item[] = [];
  if (user?.role === 'admin') admin.push({ label: 'Admin Panel', icon: 'shield-checkmark-outline', route: '/admin' });
  if (user?.role === 'admin' || user?.role === 'staff') admin.push({ label: 'Staff Panel', icon: 'construct-outline', route: '/staff' });

  function onLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <View style={styles.bg}>
      <LinearGradient colors={gradients.header} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Menu</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={34} color="#fff" />
          </View>
          <Text style={styles.username}>{user?.username ?? 'Player'}</Text>
          {user?.role !== 'player' && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleTxt}>{user?.role?.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <Card style={styles.statsCard} elevation="sm">
          <StatTile value={user?.stats.matchesPlayed ?? 0} label="Matches" />
          <View style={styles.statDivider} />
          <StatTile value={user?.stats.kills ?? 0} label="Total Kills" accent={colors.danger} />
          <View style={styles.statDivider} />
          <StatTile value={`₹${user?.stats.earnings ?? 0}`} label="Earnings" accent={colors.coin} />
        </Card>

        {admin.length > 0 && (
          <>
            <Text style={styles.groupLabel}>Management</Text>
            {admin.map((it) => (
              <MenuRow key={it.label} item={it} onPress={() => (it.action ? it.action() : it.route && router.push(it.route as any))} highlight />
            ))}
          </>
        )}

        <Text style={styles.groupLabel}>Account</Text>
        {items.map((it) => (
          <MenuRow key={it.label} item={it} onPress={() => (it.action ? it.action() : it.route && router.push(it.route as any))} />
        ))}

        <Card style={styles.noticeRow} elevation="sm" padded>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}><Ionicons name="megaphone-outline" size={20} color={colors.primary} /></View>
            <Text style={styles.rowLabel}>Important Notices</Text>
          </View>
          <Switch value={notice} onValueChange={setNotice} trackColor={{ true: colors.primaryLight }} thumbColor={notice ? colors.primary : '#f4f3f4'} />
        </Card>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutTxt}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MenuRow({ item, onPress, highlight }: { item: Item; onPress: () => void; highlight?: boolean }) {
  return (
    <Pressable style={[styles.row, shadow.sm, highlight && styles.rowHighlight]} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, highlight && { backgroundColor: colors.primary }]}>
          <Ionicons name={item.icon} size={20} color={highlight ? '#fff' : colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{item.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingBottom: 18, paddingHorizontal: 16,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, ...shadow.md,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  profile: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 78, height: 78, borderRadius: 39, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.coin, ...shadow.md,
  },
  username: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 10 },
  roleBadge: { marginTop: 4, backgroundColor: colors.mint, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  roleTxt: { fontSize: 11, fontWeight: '900', color: colors.primaryDark },
  statsCard: { flexDirection: 'row', marginBottom: spacing.lg },
  statDivider: { width: 1, backgroundColor: colors.border },
  groupLabel: { fontSize: 13, fontWeight: '800', color: colors.textMuted, marginBottom: 8, marginTop: 6, marginLeft: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  rowHighlight: { borderColor: colors.primaryLight, backgroundColor: '#F0FBF8' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  noticeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFF1F1', borderRadius: radius.md, paddingVertical: 15,
    borderWidth: 1, borderColor: '#F5C2C2',
  },
  logoutTxt: { color: colors.danger, fontWeight: '900', fontSize: 15 },
});
