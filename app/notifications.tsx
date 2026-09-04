import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useNotifications } from '@/hooks/useData';
import { colors, spacing } from '@/constants/theme';
import { relativeTime } from '@/utils/format';

export default function Notifications() {
  const items = useNotifications();
  return (
    <View style={styles.bg}>
      <Header title="Notifications" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {items.length === 0 ? (
          <EmptyState icon="notifications-outline" title="No notifications" subtitle="Updates and announcements will appear here." />
        ) : (
          items.map((n) => (
            <Card key={n.id} style={styles.row} elevation="sm">
              <View style={styles.icon}><Ionicons name="megaphone" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>{relativeTime(n.createdAt)}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  icon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  body: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 19 },
  time: { fontSize: 11, color: colors.textFaint, marginTop: 6, fontWeight: '600' },
});
