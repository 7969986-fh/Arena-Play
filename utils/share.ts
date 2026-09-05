import { Share } from 'react-native';
import { Contest } from '@/models/types';
import { APP } from '@/constants/app';
import { formatSchedule } from '@/utils/format';

/** Wraps Share.share so a user cancelling the sheet is never treated as an error. */
async function open(message: string) {
  try {
    await Share.share({ message });
  } catch {
    // Dismissing the share sheet rejects on some Android builds; not an error.
  }
}

export function shareContest(contest: Contest) {
  const fee = contest.matchType === 'free' ? 'FREE ENTRY' : `Entry ₹${contest.entryFee}`;
  const spots = Math.max(0, contest.totalSlots - contest.filledSlots);
  return open(
    `🎮 ${contest.title}\n\n` +
      `🏆 Prize Pool: ₹${contest.prizePool}\n` +
      `🎟️ ${fee}\n` +
      (contest.perKill ? `🔫 ₹${contest.perKill} per kill\n` : '') +
      `⏰ ${formatSchedule(contest.schedule)}\n` +
      `👥 ${spots} spot${spots === 1 ? '' : 's'} left of ${contest.totalSlots}\n\n` +
      `Join me on ${APP.name}!\n${APP.downloadUrl}`,
  );
}

export function shareReferral(code: string) {
  return open(
    `🎮 Join me on ${APP.name} — play Free Fire tournaments and win prizes!\n\n` +
      `Use my referral code: ${code}\n\n` +
      `Download: ${APP.downloadUrl}`,
  );
}

export function shareWin(contestTitle: string, amount: number, placement: number) {
  const rank =
    placement === 1 ? '🥇 1st place' : placement === 2 ? '🥈 2nd place' : placement === 3 ? '🥉 3rd place' : `#${placement}`;
  return open(
    `🏆 I just won ₹${amount} on ${APP.name}!\n\n` +
      `${rank} in "${contestTitle}"\n\n` +
      `Think you can beat me? ${APP.downloadUrl}`,
  );
}

export function shareApp() {
  return open(
    `🎮 ${APP.name} — Free Fire tournaments with real prizes.\n\n` +
      `Join contests, climb the leaderboard, win coins.\n\n` +
      `Download: ${APP.downloadUrl}`,
  );
}
