import { supabase } from '@/lib/supabase';
import { supabaseConfig } from '@/lib/supabaseConfig';
import {
  AppNotification,
  AppUser,
  Contest,
  Game,
  MoneyRequest,
  Registration,
  Transaction,
} from '@/models/types';
import {
  Backend,
  ContestInput,
  DepositProof,
  JoinInput,
  ResultRow,
  Unsub,
} from '@/services/backendTypes';

/* ------------------------------------------------------------------ rows
 * Postgres uses snake_case, the app uses camelCase. These mappers are the
 * only place that difference exists.
 */

const toUser = (r: any): AppUser => ({
  uid: r.uid,
  username: r.username,
  email: r.email,
  role: r.role,
  wallet: r.wallet,
  stats: r.stats,
  referralCode: r.referral_code,
  referredBy: r.referred_by,
  banned: r.banned,
  createdAt: Number(r.created_at),
});

const toGame = (r: any): Game => ({
  id: r.id,
  name: r.name,
  image: r.image ?? '',
  mode: r.mode,
  order: r.order,
  active: r.active,
  activeContests: r.active_contests ?? 0,
});

const toContest = (r: any): Contest => ({
  id: r.id,
  gameId: r.game_id,
  title: r.title,
  mode: r.mode,
  map: r.map,
  matchType: r.match_type,
  entryFee: r.entry_fee,
  prizePool: r.prize_pool,
  perKill: r.per_kill,
  totalSlots: r.total_slots,
  filledSlots: r.filled_slots,
  schedule: Number(r.schedule),
  status: r.status,
  roomId: r.room_id ?? '',
  roomPassword: r.room_password ?? '',
  prizeBreakdown: r.prize_breakdown ?? [],
  rules: r.rules ?? '',
  bannerUrl: r.banner_url ?? '',
  videoUrl: r.video_url ?? '',
  createdAt: Number(r.created_at),
});

/** Contest fields the client may write, in DB column names. */
const contestToRow = (c: Partial<Contest> | ContestInput) => {
  const r: Record<string, unknown> = {};
  const put = (k: string, v: unknown) => v !== undefined && (r[k] = v);
  const a = c as Partial<Contest> & Partial<ContestInput>;
  put('game_id', a.gameId);
  put('title', a.title);
  put('mode', a.mode);
  put('map', a.map);
  put('match_type', a.matchType);
  put('entry_fee', a.entryFee);
  put('prize_pool', a.prizePool);
  put('per_kill', a.perKill);
  put('total_slots', a.totalSlots);
  put('filled_slots', a.filledSlots);
  put('schedule', a.schedule);
  put('status', a.status);
  put('room_id', a.roomId);
  put('room_password', a.roomPassword);
  put('prize_breakdown', a.prizeBreakdown);
  put('rules', a.rules);
  put('banner_url', a.bannerUrl);
  put('video_url', a.videoUrl);
  return r;
};

const toReg = (r: any): Registration => ({
  id: r.id,
  contestId: r.contest_id,
  gameId: r.game_id,
  userId: r.user_id,
  username: r.username,
  slotNumber: r.slot_number,
  inGameName: r.in_game_name,
  teamName: r.team_name ?? '',
  paidAmount: r.paid_amount,
  kills: r.kills,
  placement: r.placement,
  wonAmount: r.won_amount,
  proofUrl: r.proof_url ?? '',
  joinedAt: Number(r.joined_at),
});

const toTxn = (r: any): Transaction => ({
  id: r.id,
  userId: r.user_id,
  type: r.type,
  amount: r.amount,
  walletType: r.wallet_type,
  description: r.description,
  balanceAfter: r.balance_after,
  createdAt: Number(r.created_at),
});

const toMoney = (r: any): MoneyRequest => ({
  id: r.id,
  userId: r.user_id,
  username: r.username,
  amount: r.amount,
  status: r.status,
  note: r.note ?? '',
  proofUrl: r.proof_url ?? '',
  utr: r.utr ?? '',
  payoutUpi: r.payout_upi ?? '',
  createdAt: Number(r.created_at),
});

const toNotif = (r: any): AppNotification => ({
  id: r.id,
  title: r.title,
  body: r.body,
  createdAt: Number(r.created_at),
});

/* ------------------------------------------------------------- realtime */

let channelSeq = 0;

/**
 * Runs `load` now, then again whenever the table changes.
 *
 * Re-reading rather than patching a local copy keeps every screen
 * consistent with the server; these result sets are small enough that the
 * extra round trip costs less than the bugs the alternative invites.
 */
function live<T>(table: string, load: () => Promise<T>, cb: (v: T) => void): Unsub {
  let closed = false;

  const run = () => {
    load()
      .then((v) => !closed && cb(v))
      .catch((e) => console.warn(`[supabase] ${table} load failed`, e?.message));
  };
  run();

  const ch = supabase
    .channel(`live:${table}:${++channelSeq}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, run)
    .subscribe();

  return () => {
    closed = true;
    supabase.removeChannel(ch);
  };
}

const rows = <T>(map: (r: any) => T) => (res: { data: any[] | null; error: any }) => {
  if (res.error) throw res.error;
  return (res.data ?? []).map(map);
};

/* ---------------------------------------------------------------- backend */

class SupabaseBackend implements Backend {
  readonly kind = 'supabase' as const;

  // ---- auth ----
  onAuthChange(cb: (uid: string | null) => void): Unsub {
    // Report the restored session first; onAuthStateChange only fires on
    // changes, so a cold start would otherwise wait forever on the loading
    // screen. This must report *something* even when the call fails — an
    // unresolved promise here leaves the user staring at a spinner, so a
    // failure is reported as signed-out and the login screen is shown.
    supabase.auth
      .getSession()
      .then(({ data }) => cb(data.session?.user.id ?? null))
      .catch((e) => {
        console.warn('[supabase] could not restore session', e?.message);
        cb(null);
      });

    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      cb(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }

  async signUp(username: string, email: string, password: string, referredBy?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // The on_auth_user_created trigger reads these to build the profile.
      options: { data: { username, referredBy: referredBy ?? '' } },
    });
    if (error) throw new Error(error.message);

    // Supabase returns a user but no session when "Confirm email" is on.
    // Without this the screen would just stop, looking like nothing happened.
    if (!data.session) {
      throw new Error(
        'Account created. Check your email and confirm the link before signing in.',
      );
    }
  }

  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  /** Cached so every screen mount does not re-request the same settings. */
  private authSettings?: Promise<Record<string, any>>;

  /**
   * Asks the project which sign-in providers are switched on.
   *
   * Supabase reports an unconfigured provider only when the user has already
   * tapped the button and the request has failed, which is far too late.
   * Reading it up front lets the UI offer only what actually works.
   */
  private settings() {
    if (!this.authSettings) {
      this.authSettings = fetch(`${supabaseConfig.url}/auth/v1/settings`, {
        headers: { apikey: supabaseConfig.publishableKey },
      })
        .then((r) => r.json())
        .catch((e) => {
          console.warn('[supabase] could not read auth settings', e?.message);
          return {};
        });
    }
    return this.authSettings;
  }

  async isGoogleAvailable() {
    return !!(await this.settings())?.external?.google;
  }

  /** True when new sign-ups must click an emailed link before they can play. */
  async requiresEmailConfirmation() {
    const s = await this.settings();
    // mailer_autoconfirm true means Supabase confirms the address itself.
    return s?.mailer_autoconfirm === false;
  }

  /**
   * Opens Google in a system browser tab and exchanges the code it returns
   * for a session. `skipBrowserRedirect` keeps the SDK from navigating on
   * its own — on a device there is no page to navigate, so the app drives
   * the tab and catches the deep link back itself.
   */
  async signInWithGoogle() {
    // Required lazily: these pull in native modules that are only needed
    // once someone actually taps Google, and a problem loading them must
    // not take down app startup.
    const WebBrowser = require('expo-web-browser');
    const { makeRedirectUri } = require('expo-auth-session');

    const redirectTo = makeRedirectUri({ scheme: 'arenaplay', path: 'auth-callback' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      // The provider being switched off is by far the most common cause,
      // and Supabase reports it in a form that means nothing to a player.
      if (/provider.*not enabled|Unsupported provider/i.test(error.message)) {
        throw new Error(
          'Google sign-in is not switched on for this app yet. Use email and password for now.',
        );
      }
      throw new Error(error.message);
    }
    if (!data?.url) throw new Error('Could not start Google sign-in.');

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') {
      // The player closed the tab or hit cancel; not an error worth showing.
      throw new Error('CANCELLED');
    }

    const code = new URL(res.url).searchParams.get('code');
    if (!code) throw new Error('Google did not return a sign-in code.');

    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) throw new Error(exErr.message);
  }

  async signOut() {
    await supabase.auth.signOut();
  }

  // ---- user ----
  watchUser(uid: string, cb: (u: AppUser | null) => void): Unsub {
    return live('users', async () => {
      const { data, error } = await supabase.from('users').select('*').eq('uid', uid).maybeSingle();
      if (error) throw error;
      if (data) return toUser(data);

      // Signed in but no profile row: the on_auth_user_created trigger did
      // not run or failed. Build the row here rather than leaving an account
      // that can sign in but has no wallet, name or role.
      return this.createMissingProfile(uid);
    }, cb);
  }

  /** Backfills a profile for an authenticated user that has no row yet. */
  private async createMissingProfile(uid: string): Promise<AppUser | null> {
    const { data: auth } = await supabase.auth.getUser();
    const meta = (auth.user?.user_metadata ?? {}) as Record<string, string>;
    const email = auth.user?.email ?? '';
    if (!auth.user || auth.user.id !== uid) return null;

    const row = {
      uid,
      username: meta.username || meta.full_name || meta.name || email.split('@')[0] || 'Player',
      email,
      referral_code: uid.replace(/-/g, '').slice(0, 8).toUpperCase(),
      referred_by: meta.referredBy || null,
      wallet: { deposit: 0, winnings: 0, bonus: 25 },
      stats: { matchesPlayed: 0, kills: 0, earnings: 0 },
      created_at: Date.now(),
    };

    const { data, error } = await supabase
      .from('users').insert(row).select().maybeSingle();
    if (error) {
      console.warn('[supabase] could not create profile', error.message);
      return null;
    }
    return data ? toUser(data) : null;
  }

  // ---- catalog ----
  watchGames(cb: (g: Game[]) => void): Unsub {
    return live('games', async () =>
      supabase.from('games').select('*').eq('active', true).order('order')
        .then(rows(toGame)), cb);
  }

  watchContests(gameId: string, cb: (c: Contest[]) => void): Unsub {
    return live('contests', async () =>
      supabase.from('contests').select('*').eq('game_id', gameId).order('schedule')
        .then(rows(toContest)), cb);
  }

  watchAllContests(cb: (c: Contest[]) => void): Unsub {
    return live('contests', async () =>
      supabase.from('contests').select('*').order('schedule', { ascending: false })
        .then(rows(toContest)), cb);
  }

  async getContest(id: string) {
    const { data, error } = await supabase.from('contests').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toContest(data) : null;
  }

  watchContest(id: string, cb: (c: Contest | null) => void): Unsub {
    return live('contests', async () => this.getContest(id), cb);
  }

  // ---- registrations ----
  watchUserRegistrations(uid: string, cb: (r: Registration[]) => void): Unsub {
    return live('registrations', async () =>
      supabase.from('registrations').select('*').eq('user_id', uid)
        .order('joined_at', { ascending: false }).then(rows(toReg)), cb);
  }

  watchContestRegistrations(contestId: string, cb: (r: Registration[]) => void): Unsub {
    return live('registrations', async () =>
      supabase.from('registrations').select('*').eq('contest_id', contestId)
        .order('slot_number').then(rows(toReg)), cb);
  }

  async joinContest(input: JoinInput) {
    // Slot check, balance check, debit and insert all happen inside the
    // function so two players cannot claim one slot.
    const { error } = await supabase.rpc('join_contest', {
      p_contest: input.contest.id,
      p_slot: input.slotNumber,
      p_ign: input.inGameName,
      p_team: input.teamName ?? '',
    });
    if (error) throw new Error(error.message);
  }

  // ---- wallet ----
  watchTransactions(uid: string, cb: (t: Transaction[]) => void): Unsub {
    return live('transactions', async () =>
      supabase.from('transactions').select('*').eq('user_id', uid)
        .order('created_at', { ascending: false }).limit(100).then(rows(toTxn)), cb);
  }

  async createDeposit(user: AppUser, amount: number, proof?: DepositProof) {
    const { error } = await supabase.from('deposits').insert({
      user_id: user.uid,
      username: user.username,
      amount,
      status: 'pending',
      proof_url: proof?.proofUrl ?? '',
      utr: proof?.utr ?? '',
      created_at: Date.now(),
    });
    if (error) throw new Error(error.message);
  }

  async createWithdrawal(_user: AppUser, amount: number, payoutUpi?: string) {
    // The balance is held server-side at request time so the same winnings
    // cannot be requested twice.
    const { error } = await supabase.rpc('request_withdrawal', {
      p_amount: amount,
      p_upi: payoutUpi ?? '',
    });
    if (error) throw new Error(error.message);
  }

  // ---- leaderboard / notifications ----
  watchLeaderboard(cb: (u: AppUser[]) => void): Unsub {
    return live('users', async () =>
      supabase.from('users').select('*')
        .order('stats->earnings', { ascending: false }).limit(50).then(rows(toUser)), cb);
  }

  watchNotifications(cb: (n: AppNotification[]) => void): Unsub {
    return live('notifications', async () =>
      supabase.from('notifications').select('*')
        .order('created_at', { ascending: false }).then(rows(toNotif)), cb);
  }

  // ---- admin: money requests ----
  watchDeposits(cb: (d: MoneyRequest[]) => void): Unsub {
    return live('deposits', async () =>
      supabase.from('deposits').select('*')
        .order('created_at', { ascending: false }).then(rows(toMoney)), cb);
  }

  watchWithdrawals(cb: (d: MoneyRequest[]) => void): Unsub {
    return live('withdrawals', async () =>
      supabase.from('withdrawals').select('*')
        .order('created_at', { ascending: false }).then(rows(toMoney)), cb);
  }

  private async call(fn: string, args: Record<string, unknown>) {
    const { error } = await supabase.rpc(fn, args);
    if (error) throw new Error(error.message);
  }

  approveDeposit(r: MoneyRequest) { return this.call('approve_deposit', { p_id: r.id }); }
  rejectDeposit(r: MoneyRequest) { return this.call('reject_deposit', { p_id: r.id }); }
  approveWithdrawal(r: MoneyRequest) { return this.call('approve_withdrawal', { p_id: r.id }); }
  rejectWithdrawal(r: MoneyRequest) { return this.call('reject_withdrawal', { p_id: r.id }); }

  // ---- admin: contests ----
  async createContest(input: ContestInput) {
    const { error } = await supabase.from('contests')
      .insert({ ...contestToRow(input), created_at: Date.now() });
    if (error) throw new Error(error.message);
  }

  async updateContest(id: string, patch: Partial<Contest>) {
    const { error } = await supabase.from('contests').update(contestToRow(patch)).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteContest(id: string) {
    const { error } = await supabase.from('contests').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ---- admin: users ----
  watchUsers(cb: (u: AppUser[]) => void): Unsub {
    return live('users', async () =>
      supabase.from('users').select('*')
        .order('created_at', { ascending: false }).then(rows(toUser)), cb);
  }

  async setUserRole(uid: string, role: AppUser['role']) {
    const { error } = await supabase.from('users').update({ role }).eq('uid', uid);
    if (error) throw new Error(error.message);
  }

  async setUserBanned(uid: string, banned: boolean) {
    const { error } = await supabase.from('users').update({ banned }).eq('uid', uid);
    if (error) throw new Error(error.message);
  }

  async sendNotification(title: string, body: string) {
    const { error } = await supabase.from('notifications')
      .insert({ title, body, created_at: Date.now() });
    if (error) throw new Error(error.message);
  }

  // ---- staff: match management ----
  async setRoomCredentials(
    contestId: string, roomId: string, roomPassword: string, status?: Contest['status'],
  ) {
    const patch: Record<string, unknown> = { room_id: roomId, room_password: roomPassword };
    if (status) patch.status = status;
    const { error } = await supabase.from('contests').update(patch).eq('id', contestId);
    if (error) throw new Error(error.message);
  }

  async declareResults(contestId: string, results: ResultRow[]) {
    // One call so prizes, stats and the contest status all move together.
    await this.call('declare_results', { p_contest: contestId, p_rows: results });
  }

  async removeRegistration(reg: Registration) {
    await this.call('remove_registration', { p_reg: reg.id });
  }

  async setResultProof(registrationId: string, proofUrl: string) {
    const { error } = await supabase.from('registrations')
      .update({ proof_url: proofUrl }).eq('id', registrationId);
    if (error) throw new Error(error.message);
  }

  // ---- storage ----
  async uploadImage(localUri: string, folder: 'deposits' | 'results' | 'contests') {
    const ext = (localUri.split('.').pop() ?? 'jpg').split('?')[0].toLowerCase();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // React Native's fetch gives a Blob the storage client can send directly.
    const blob = await (await fetch(localUri)).blob();
    const { error } = await supabase.storage.from('proofs').upload(path, blob, {
      contentType: blob.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: false,
    });
    if (error) throw new Error(error.message);

    return supabase.storage.from('proofs').getPublicUrl(path).data.publicUrl;
  }

  async seed() {
    // The catalog ships with schema.sql, so there is nothing to seed here.
  }
}

export const supabaseBackend = new SupabaseBackend();
