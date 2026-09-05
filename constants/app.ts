/**
 * Brand and operator settings. These are the values you change when you run
 * your own Arena Play — no code changes needed anywhere else.
 */
export const APP = {
  name: 'Arena Play',

  /** Where people download the APK. Included in every share message. */
  downloadUrl: 'https://github.com/7969986-fh/Arena-Play/releases/latest',

  /** UPI ID players send deposits to. Shown on the recharge screen. */
  upiId: 'yashofflcial@fam',
  /** Name shown next to the UPI ID so players know the payment is right. */
  upiName: 'Arena Play',

  /** Support contacts. Blank entries are hidden rather than shown broken. */
  supportTelegram: 'Y4SH_ERA',
  supportWhatsApp: '919266983035', // country code, no +
  supportEmail: '',
  supportHours: '10 AM to 10 PM • Daily',
} as const;

/** Deep links for the support channels, built from the values above. */
export const SUPPORT_LINKS = {
  telegram: APP.supportTelegram ? `https://t.me/${APP.supportTelegram}` : '',
  whatsapp: APP.supportWhatsApp
    ? `https://wa.me/${APP.supportWhatsApp}?text=${encodeURIComponent(
        `Hi, I need help with ${APP.name}.`,
      )}`
    : '',
  email: APP.supportEmail ? `mailto:${APP.supportEmail}` : '',
};

/**
 * Deposit bonus tiers. The highest tier at or below the deposit amount
 * applies, and the bonus lands in the non-withdrawable bonus wallet — it can
 * be spent on entry fees but never cashed out.
 */
export const DEPOSIT_BONUS_TIERS = [
  { min: 50, bonus: 5 },
  { min: 100, bonus: 15 },
  { min: 200, bonus: 35 },
  { min: 300, bonus: 60 },
  { min: 500, bonus: 100 },
] as const;

/** Bonus coins earned by depositing `amount`. */
export function depositBonus(amount: number): number {
  let earned = 0;
  for (const t of DEPOSIT_BONUS_TIERS) if (amount >= t.min) earned = t.bonus;
  return earned;
}
