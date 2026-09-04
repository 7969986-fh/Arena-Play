import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { colors, radius, shadow, spacing } from '@/constants/theme';

export default function StaffPanel() {
  const { user } = useAuth();

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return (
      <View style={styles.bg}>
        <Header title="Staff Panel" />
        <EmptyState icon="lock-closed-outline" title="Staff only" subtitle="You do not have permission to view this panel." />
      </View>
    );
  }

  const actions = [
    { label: 'Enter Match Results', icon: 'create-outline', desc: 'Record kills & placement per team' },
    { label: 'Share Room Codes', icon: 'key-outline', desc: 'Set room ID & password for a contest' },
    { label: 'Moderate Registrations', icon: 'shield-checkmark-outline', desc: 'Approve or reject team entries' },
  ];

  return (
    <View style={styles.bg}>
      <Header title="Staff Panel" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.phaseBanner}>
          <Ionicons name="construct" size={18} color={colors.primaryDark} />
          <Text style={styles.phaseTxt}>Staff tools arrive in Phase 2.</Text>
        </View>
        {actions.map((a) => (
          <View key={a.label} style={[styles.action, shadow.sm]}>
            <View style={styles.actionIcon}><Ionicons name={a.icon as any} size={20} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionDesc}>{a.desc}</Text>
            </View>
            <View style={styles.soon}><Text style={styles.soonTxt}>Phase 2</Text></View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  phaseBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.mint,
    borderRadius: radius.md, padding: 12, marginBottom: spacing.lg,
  },
  phaseTxt: { flex: 1, fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  actionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  soon: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  soonTxt: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
});
