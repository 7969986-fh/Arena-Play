import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { backend } from '@/services/backend';
import { colors, radius, spacing } from '@/constants/theme';

const QUICK = [20, 50, 100, 200, 500, 1000];
const MIN = 1;
const MAX = 1000;

export default function Recharge() {
  const router = useRouter();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  async function onRecharge() {
    const n = parseInt(amount, 10);
    if (!n || n < MIN || n > MAX) {
      Alert.alert('Invalid amount', `Enter an amount between ₹${MIN} and ₹${MAX}.`);
      return;
    }
    setLoading(true);
    try {
      await backend.createDeposit(user!, n);
      Alert.alert(
        'Recharge submitted',
        'Your deposit request is pending admin approval. Coins are added once approved.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not process recharge.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.bg}>
      <Header title="Recharge" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card style={styles.balCard}>
          <Text style={styles.balLabel}>Total Balance</Text>
          <Text style={styles.bal}>₹ {(user?.wallet.deposit ?? 0) + (user?.wallet.winnings ?? 0) + (user?.wallet.bonus ?? 0)}</Text>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.label}>Amount</Text>
          <Input
            placeholder={`₹ ${MIN} ~ ${MAX}`}
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            containerStyle={{ marginBottom: 4 }}
          />
          <View style={styles.minmax}>
            <Text style={styles.minmaxTxt}>Minimum: ₹{MIN}</Text>
            <Text style={styles.minmaxTxt}>Maximum: ₹{MAX}</Text>
          </View>

          <View style={styles.quickGrid}>
            {QUICK.map((q) => (
              <Pressable key={q} style={styles.quick} onPress={() => setAmount(String(q))}>
                <Text style={styles.quickTxt}>₹{q}</Text>
              </Pressable>
            ))}
          </View>

          <Button label="Recharge" onPress={onRecharge} loading={loading} style={{ marginTop: spacing.md }} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  balCard: { alignItems: 'center', backgroundColor: colors.mint },
  balLabel: { fontSize: 13, color: colors.primaryDark, fontWeight: '700' },
  bal: { fontSize: 30, fontWeight: '900', color: colors.primaryDark, marginTop: 2 },
  label: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 8 },
  minmax: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  minmaxTxt: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  quick: {
    width: '31%', backgroundColor: colors.mint, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  quickTxt: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
});
