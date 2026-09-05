import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ScreenshotPicker from '@/components/ScreenshotPicker';
import { useAuth } from '@/hooks/useAuth';
import { backend } from '@/services/backend';
import { APP, DEPOSIT_BONUS_TIERS, depositBonus } from '@/constants/app';
import { colors, radius, spacing } from '@/constants/theme';
import { walletTotal } from '@/models/types';
import { useToast } from '@/components/ui/Toast';

const QUICK = [20, 50, 100, 200, 500, 1000];
const MIN = 1;
const MAX = 1000;

export default function Recharge() {
  const toast = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const value = parseInt(amount, 10);

  function next() {
    if (!value || value < MIN || value > MAX) {
      toast.error('Invalid amount', `Enter an amount between ₹${MIN} and ₹${MAX}.`);
      return;
    }
    setStep(2);
  }

  async function copyUpi() {
    await Clipboard.setStringAsync(APP.upiId);
    toast.success('Copied', 'UPI ID copied. Paste it in your payment app.');
  }

  /** Hands the payment off to any installed UPI app, pre-filled. */
  async function payNow() {
    const url =
      `upi://pay?pa=${encodeURIComponent(APP.upiId)}` +
      `&pn=${encodeURIComponent(APP.upiName)}` +
      `&am=${value}&cu=INR` +
      `&tn=${encodeURIComponent(`${APP.name} recharge`)}`;
    const ok = await Linking.canOpenURL(url).catch(() => false);
    if (!ok) {
      toast.error('No UPI app found', `Copy the UPI ID and pay ₹${value} manually, then attach the screenshot.`);
      return;
    }
    Linking.openURL(url);
  }

  async function submit() {
    if (!proof) {
      toast.error('Screenshot required', 'Attach the payment screenshot so we can verify it.');
      return;
    }
    if (utr.trim().length < 6) {
      toast.error('Reference required', 'Enter the UPI reference / UTR number from your payment app.');
      return;
    }
    setLoading(true);
    try {
      const proofUrl = await backend.uploadImage(proof, 'deposits');
      await backend.createDeposit(user!, value, { proofUrl, utr: utr.trim() });
      toast.success('Request submitted', 'Your deposit is pending review. Coins are credited once an admin verifies the payment.');
      router.back();
    } catch (e: any) {
      toast.error('Error', e?.message ?? 'Could not submit the request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.bg}>
      <Header title="Recharge" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.balCard}>
          <Text style={styles.balLabel}>Total Balance</Text>
          <Text style={styles.bal}>₹ {walletTotal(user?.wallet)}</Text>
        </Card>

        {step === 1 ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.h}>How much?</Text>
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
              {QUICK.map((q) => {
                const b = depositBonus(q);
                return (
                  <Pressable key={q} style={styles.quick} onPress={() => setAmount(String(q))}>
                    <Text style={styles.quickTxt}>₹{q}</Text>
                    {b > 0 && <Text style={styles.quickBonus}>+{b} bonus</Text>}
                  </Pressable>
                );
              })}
            </View>

            {value > 0 && depositBonus(value) > 0 && (
              <View style={styles.earnRow}>
                <Ionicons name="gift" size={16} color={colors.primaryDark} />
                <Text style={styles.earnTxt}>
                  You get {value + depositBonus(value)} coins — ₹{value} + {depositBonus(value)} bonus
                </Text>
              </View>
            )}

            <Button label="Continue" onPress={next} style={{ marginTop: spacing.md }} />

            <Text style={styles.tierHead}>Bonus on every deposit</Text>
            {DEPOSIT_BONUS_TIERS.map((t) => (
              <View key={t.min} style={styles.tierRow}>
                <Text style={styles.tierLeft}>Add ₹{t.min} or more</Text>
                <Text style={styles.tierRight}>+{t.bonus} bonus coins</Text>
              </View>
            ))}
            <Text style={styles.tierNote}>
              Bonus coins can be spent on entry fees but cannot be withdrawn.
              Only winnings are withdrawable.
            </Text>
          </Card>
        ) : (
          <>
            <Card style={{ marginTop: spacing.md }}>
              <View style={styles.amtRow}>
                <Text style={styles.h}>Pay ₹{value}</Text>
                <Pressable onPress={() => setStep(1)} hitSlop={10}>
                  <Text style={styles.edit}>Change</Text>
                </Pressable>
              </View>

              <Text style={styles.upiLabel}>Send to this UPI ID</Text>
              <Pressable style={styles.upiBox} onPress={copyUpi}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiId}>{APP.upiId}</Text>
                  <Text style={styles.upiName}>{APP.upiName}</Text>
                </View>
                <Ionicons name="copy-outline" size={20} color={colors.primary} />
              </Pressable>

              <Button label={`Open UPI app · ₹${value}`} onPress={payNow} style={{ marginTop: spacing.md }} />
              <Text style={styles.note}>
                Already paid from another app? Just attach the screenshot below.
              </Text>
            </Card>

            <Card style={{ marginTop: spacing.md }}>
              <Text style={styles.h}>Proof of payment</Text>
              <ScreenshotPicker
                value={proof}
                onChange={setProof}
                label="Payment screenshot"
                hint="The success screen from your UPI app"
              />
              <Text style={[styles.upiLabel, { marginTop: spacing.md }]}>
                UPI reference / UTR number
              </Text>
              <Input
                placeholder="e.g. 402912345678"
                keyboardType="number-pad"
                value={utr}
                onChangeText={setUtr}
              />
              <Button
                label="Submit for approval"
                onPress={submit}
                loading={loading}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  balCard: { alignItems: 'center', backgroundColor: colors.mint },
  balLabel: { fontSize: 13, color: colors.primaryDark, fontWeight: '700' },
  bal: { fontSize: 30, fontWeight: '900', color: colors.primaryDark, marginTop: 2 },
  h: { fontSize: 19, fontWeight: '900', color: colors.text, marginBottom: 10 },
  amtRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  edit: { fontSize: 13, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  minmax: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  minmaxTxt: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  quick: {
    width: '31%',
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quickTxt: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  quickBonus: { fontSize: 9.5, fontWeight: '800', color: colors.primary, marginTop: 1 },
  earnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.md,
    backgroundColor: colors.mint, borderRadius: radius.md, padding: 12,
  },
  earnTxt: { flex: 1, fontSize: 12.5, fontWeight: '800', color: colors.primaryDark },
  tierHead: { fontSize: 13, fontWeight: '900', color: colors.text, marginTop: spacing.lg, marginBottom: 8 },
  tierRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tierLeft: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  tierRight: { fontSize: 12.5, fontWeight: '800', color: colors.primary },
  tierNote: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 10, lineHeight: 16 },
  upiLabel: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 8 },
  upiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 14,
  },
  upiId: { fontSize: 16, fontWeight: '900', color: colors.primaryDark, letterSpacing: 0.3 },
  upiName: { fontSize: 11.5, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  note: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
});
