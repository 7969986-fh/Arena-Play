import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useData';
import { walletTotal } from '@/models/types';
import { colors, gradients, radius, shadow, spacing } from '@/constants/theme';
import { relativeTime } from '@/utils/format';

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const txns = useTransactions(user?.uid ?? null);

  return (
    <View style={styles.bg}>
      <Header title="Wallet" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.balanceCard, shadow.lg]}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balance}>₹ {walletTotal(user?.wallet)}</Text>
          <View style={styles.subBalances}>
            <View style={styles.subItem}>
              <Text style={styles.subLabel}>Deposit</Text>
              <Text style={styles.subValue}>₹{user?.wallet.deposit ?? 0}</Text>
            </View>
            <View style={styles.subDivider} />
            <View style={styles.subItem}>
              <Text style={styles.subLabel}>Winnings</Text>
              <Text style={styles.subValue}>₹{user?.wallet.winnings ?? 0}</Text>
            </View>
            <View style={styles.subDivider} />
            <View style={styles.subItem}>
              <Text style={styles.subLabel}>Bonus</Text>
              <Text style={styles.subValue}>₹{user?.wallet.bonus ?? 0}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.actions}>
          <Button label="Buy More" variant="primary" onPress={() => router.push('/wallet/recharge')} style={{ flex: 1 }} fullWidth={false} />
          <Button label="Withdraw" variant="danger" onPress={() => router.push('/wallet/withdraw')} style={{ flex: 1 }} fullWidth={false} />
        </View>

        <Text style={styles.section}>Wallet History</Text>
        {txns.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No transactions yet" subtitle="Your coin activity will show up here." />
        ) : (
          txns.map((t) => (
            <Card key={t.id} style={styles.txn} elevation="sm">
              <View style={[styles.txnIcon, { backgroundColor: t.type === 'credit' ? colors.success : colors.danger }]}>
                <Ionicons name={t.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnDesc} numberOfLines={1}>{t.description}</Text>
                <Text style={styles.txnMeta}>{relativeTime(t.createdAt)} • Bal: ₹{t.balanceAfter}</Text>
              </View>
              <Text style={[styles.txnAmt, { color: t.type === 'credit' ? colors.success : colors.danger }]}>
                {t.type === 'credit' ? '+' : '-'}₹{t.amount}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  balanceCard: { borderRadius: radius.lg, padding: 22, alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  balance: { color: '#fff', fontSize: 38, fontWeight: '900', marginTop: 4 },
  subBalances: {
    flexDirection: 'row', marginTop: 18, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md, paddingVertical: 12, alignSelf: 'stretch',
  },
  subItem: { flex: 1, alignItems: 'center' },
  subDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  subLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  subValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  section: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: spacing.xl, marginBottom: 12 },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  txnIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  txnDesc: { fontSize: 14, fontWeight: '700', color: colors.text },
  txnMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '500' },
  txnAmt: { fontSize: 15, fontWeight: '900' },
});
