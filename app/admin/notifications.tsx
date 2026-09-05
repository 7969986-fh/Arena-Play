import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useNotifications } from '@/hooks/useData';
import { backend } from '@/services/backend';
import { colors, spacing } from '@/constants/theme';
import { relativeTime } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

export default function AdminNotifications() {
  const toast = useToast();
  const { items, loading: listLoading } = useNotifications();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!title.trim() || !body.trim()) { toast.error('Missing', 'Enter a title and message.'); return; }
    setLoading(true);
    try {
      await backend.sendNotification(title.trim(), body.trim());
      setTitle(''); setBody('');
      toast.success('Sent', 'Notification broadcast to all players.');
    } catch (e: any) { toast.error('Error', e?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <View style={styles.bg}>
      <Header title="Send Notification" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card>
          <Input label="Title" placeholder="e.g. New tournament live!" value={title} onChangeText={setTitle} />
          <Input label="Message" placeholder="Write your announcement…" value={body} onChangeText={setBody}
            multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
          <Button label="Broadcast" onPress={send} loading={loading} />
        </Card>

        <Text style={styles.section}>Recent</Text>
        {items.slice(0, 10).map((n) => (
          <Card key={n.id} style={{ marginBottom: 10 }} elevation="sm">
            <Text style={styles.nTitle}>{n.title}</Text>
            <Text style={styles.nBody}>{n.body}</Text>
            <Text style={styles.nTime}>{relativeTime(n.createdAt)}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  section: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: spacing.lg, marginBottom: 10 },
  nTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  nBody: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 19 },
  nTime: { fontSize: 11, color: colors.textFaint, marginTop: 6, fontWeight: '600' },
});
