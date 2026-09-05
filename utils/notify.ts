import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Contest } from '@/models/types';

/**
 * Local match reminders.
 *
 * These are scheduled on the device, so they need no push server, no FCM
 * credentials and no account — they fire even with the app closed, as long
 * as the reminder was scheduled while the player was in the app.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Minutes before start that we remind a player. */
const LEAD_MINUTES = [30, 5];

let configured = false;

async function ensureSetup(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  let granted = status === 'granted';
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.status === 'granted';
  }
  if (!granted) return false;

  if (!configured && Platform.OS === 'android') {
    // Android needs an explicit channel or notifications stay silent.
    await Notifications.setNotificationChannelAsync('matches', {
      name: 'Match reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0FB89B',
    });
    configured = true;
  }
  return true;
}

/**
 * Schedules the reminders for a contest the player just joined.
 * Lead times already in the past are skipped.
 */
export async function scheduleMatchReminders(contest: Contest) {
  try {
    if (!(await ensureSetup())) return;

    for (const mins of LEAD_MINUTES) {
      const fireAt = contest.schedule - mins * 60_000;
      if (fireAt <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Match starts in ${mins} minutes`,
          body: contest.title,
          data: { contestId: contest.id },
        },
        // Tagging by contest lets cancelMatchReminders find these again.
        identifier: `match-${contest.id}-${mins}`,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireAt),
          channelId: 'matches',
        },
      });
    }
  } catch (e) {
    // A reminder failing must never block the join itself.
    console.warn('[notify] could not schedule reminders', e);
  }
}

/** Drops reminders for a contest the player left or that was cancelled. */
export async function cancelMatchReminders(contestId: string) {
  try {
    await Promise.all(
      LEAD_MINUTES.map((m) =>
        Notifications.cancelScheduledNotificationAsync(`match-${contestId}-${m}`),
      ),
    );
  } catch {
    // Nothing scheduled for this contest; nothing to clean up.
  }
}
