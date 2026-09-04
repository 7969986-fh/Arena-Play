import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Segmented from '@/components/ui/Segmented';
import Coin from '@/components/ui/Coin';
import EmptyState from '@/components/ui/EmptyState';
import { MoneyRequest, RequestStatus } from '@/models/types';
import { colors, radius, spacing } from '@/constants/theme';
import { relativeTime } from '@/utils/format';

const TABS: { key: RequestStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

interface Props {
  title: string;
  requests: MoneyRequest[];
  onApprove: (r: MoneyRequest) => Promise<void>;
  onReject: (r: MoneyRequest) => Promise<void>;
  approveLabel?: string;
}

export default function MoneyRequestList({ title, requests, onApprove, onReject, approveLabel = 'Approve' }: Props) {
  const [tab, setTab] = useState<RequestStatus>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const list = requests.filter((r) => r.status === tab);

  async function run(fn: () => Promise<void>, id: string) {
    setBusy(id);
    try { await fn(); } catch (e: any) { Alert.alert('Error', e?.message ?? 'Failed'); }
    finally { setBusy(null); }
  }

  return (
    <View style={styles.bg}>
      <Header title={title} />
      <View style={styles.segment}><Segmented options={TABS} value={tab} onChange={setTab} /></View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {list.length === 0 ? (
          <EmptyState icon="cash-outline" title={`No ${tab} requests`} />
        ) : (
          list.map((r) => (
            <Card key={r.id} style={styles.card} elevation="sm">
              <View style={styles.rowTop}>
                <View>
                  <Text style={styles.user}>{r.username}</Text>
                  <Text style={styles.meta}>#{r.id.slice(-6)} • {relativeTime(r.createdAt)}</Text>
                </View>
                <Coin amount={r.amount} size={17} />
              </View>
              {tab === 'pending' && (
                <View style={styles.actions}>
                  <Button label="Reject" variant="outline" size="sm" fullWidth={false}
                    style={{ flex: 1 }} loading={busy === r.id}
                    onPress={() => run(() => onReject(r), r.id)} />
                  <Button label={approveLabel} size="sm" fullWidth={false}
                    style={{ flex: 1 }} loading={busy === r.id}
                    onPress={() => run(() => onApprove(r), r.id)} />
                </View>
              )}
              {tab !== 'pending' && (
                <View style={[styles.badge, { backgroundColor: tab === 'approved' ? colors.mint : '#FFE3E3' }]}>
                  <Text style={[styles.badgeTxt, { color: tab === 'approved' ? colors.primaryDark : colors.danger }]}>
                    {tab.toUpperCase()}
                  </Text>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  segment: { padding: spacing.lg, paddingBottom: 0 },
  card: { marginBottom: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  user: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  badge: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeTxt: { fontSize: 11, fontWeight: '900' },
});
