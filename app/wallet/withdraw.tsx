import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { backend } from '@/services/backend';
import { colors, spacing } from '@/constants/theme';

const MIN = 50;

export default function Withdraw() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [upi, setUpi] = useState('');
  const [loading, setLoading] = useState(false);
  const winnings = user?.wallet.winnings ?? 0;

  async function onWithdraw() {
    const n = parseInt(amount, 10);
    if (!n || n < MIN) { Alert.alert('Invalid amount', `Minimum withdrawal is ₹${MIN}.`); return; }
    if (n > winnings) { Alert.alert('Low balance', 'You can only withdraw from your winnings balance.'); return; }
    if (!upi.trim()) { Alert.alert('UPI required', 'Enter your UPI ID to receive the payout.'); return; }
    setLoading(true);
    try {
      await backend.createWithdrawal(user!, n);
      Alert.alert('Withdrawal requested', 'Your request is pending admin approval.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not request withdrawal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.bg}>
      <Header title="Withdraw" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card style={styles.balCard}>
          <Text style={styles.balLabel}>Withdrawable (Winnings)</Text>
          <Text style={styles.bal}>₹ {winnings}</Text>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Input label="Amount" placeholder={`Minimum ₹${MIN}`} keyboardType="number-pad" value={amount} onChangeText={setAmount} />
          <Input label="UPI ID" placeholder="yourname@upi" autoCapitalize="none" value={upi} onChangeText={setUpi} />
          <Text style={styles.note}>Only winnings can be withdrawn. Deposits and bonus are for playing contests.</Text>
          <Button label="Request Withdrawal" variant="danger" onPress={onWithdraw} loading={loading} style={{ marginTop: spacing.sm }} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  balCard: { alignItems: 'center', backgroundColor: '#FFF1F1', borderColor: '#F5C2C2' },
  balLabel: { fontSize: 13, color: colors.danger, fontWeight: '700' },
  bal: { fontSize: 30, fontWeight: '900', color: colors.danger, marginTop: 2 },
  note: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md, fontWeight: '500', lineHeight: 18 },
});
