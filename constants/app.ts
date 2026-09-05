/**
 * Brand and operator settings. These are the values you change when you run
 * your own Arena Play — no code changes needed anywhere else.
 */
export const APP = {
  name: 'Arena Play',

  /** Where people download the APK. Included in every share message. */
  downloadUrl: 'https://github.com/7969986-fh/Arena-Play/releases/latest',

  /** UPI ID players send deposits to. Shown on the recharge screen. */
  upiId: 'yashofficial@fam',
  /** Name shown next to the UPI ID so players know the payment is right. */
  upiName: 'Arena Play',

  /** Support contacts shown in the menu and on the contact screen. */
  supportWhatsApp: '', // e.g. '919000000000' (country code, no +)
  supportEmail: 'support@example.com',
  supportHours: '10 AM to 10 PM • Daily',
} as const;
