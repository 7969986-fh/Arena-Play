import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useUsers } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { backend } from '@/services/backend';
import { AppUser, Role } from '@/models/types';
import { colors, radius, spacing } from '@/constants/theme';
import { useToast } from '@/components/ui/Toast';
import { ListSkeleton } from '@/components/ui/Skeleton';

const ROLES: Role[] = ['player', 'staff', 'admin'];
const ROLE_COLOR: Record<Role, string> = {
  player: colors.info, staff: colors.warning, admin: colors.primary,
};

export default function AdminUsers() {
  const toast = useToast();
  const { users, loading } = useUsers();
  const { uid } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  async function cycleRole(u: AppUser) {
    const next = ROLES[(ROLES.indexOf(u.role) + 1) % ROLES.length];
    setBusy(u.uid);
    try { await backend.setUserRole(u.uid, next); }
    catch (e: any) { toast.error('Error', e?.message ?? 'Failed'); }
    finally { setBusy(null); }
  }

  function toggleBan(u: AppUser) {
    Alert.alert(
      u.banned ? 'Unban user' : 'Ban user',
      `${u.banned ? 'Unban' : 'Ban'} ${u.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: u.banned ? 'default' : 'destructive',
          onPress: async () => {
            setBusy(u.uid);
            try { await backend.setUserBanned(u.uid, !u.banned); }
            catch (e: any) { toast.error('Error', e?.message ?? 'Failed'); }
            finally { setBusy(null); }
          } },
      ]
    );
  }

  return (
    <View style={styles.bg}>
      <Header title="Manage Users" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {loading ? (
          <ListSkeleton count={5} />
        ) : users.length === 0 ? (
          <EmptyState icon="people-outline" title="No users yet" />
        ) : (
          users.map((u) => (
            <Card key={u.uid} style={[styles.card, u.banned && styles.banned]} elevation="sm">
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: ROLE_COLOR[u.role] }]}>
                  <Ionicons name="person" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {u.username}{u.uid === uid ? ' (You)' : ''}
                  </Text>
                  <Text style={styles.email}>{u.email}</Text>
                </View>
                <Pressable
                  style={[styles.rolePill, { backgroundColor: ROLE_COLOR[u.role] }]}
                  onPress={() => cycleRole(u)}
                  disabled={busy === u.uid}
                >
                  <Text style={styles.rolePillTxt}>{u.role.toUpperCase()}</Text>
                </Pressable>
              </View>
              <View style={styles.footer}>
                <Text style={styles.stat}>₹{u.stats.earnings} earned • {u.stats.matchesPlayed} matches</Text>
                <Pressable onPress={() => toggleBan(u)} hitSlop={8}>
                  <Text style={[styles.ban, u.banned && { color: colors.success }]}>
                    {u.banned ? 'Unban' : 'Ban'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
        <Text style={styles.hint}>Tap a role chip to cycle player → staff → admin.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  card: { marginBottom: 12 },
  banned: { opacity: 0.6, borderColor: colors.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  rolePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  rolePillTxt: { color: '#fff', fontWeight: '900', fontSize: 11 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  stat: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  ban: { fontSize: 13, color: colors.danger, fontWeight: '800' },
  hint: { textAlign: 'center', fontSize: 12, color: colors.textFaint, marginTop: 8 },
});
