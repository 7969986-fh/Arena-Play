import Parse from '@/lib/parse';
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
  RecentWin,
  ResultRow,
  Unsub,
} from '@/services/backendTypes';

/* ------------------------------------------------------------------ rows
 * Parse objects carry their fields behind get(), so these mappers are the
 * single place that shape is turned into the app's plain types.
 */

type PO = Parse.Object;

const toUser = (o: PO): AppUser => ({
  uid: o.id!,
  username: o.get('username'),
  email: o.get('email') ?? '',
  role: o.get('role') ?? 'player',
  wallet: o.get('wallet') ?? { deposit: 0, winnings: 0, bonus: 0 },
  stats: o.get('stats') ?? { matchesPlayed: 0, kills: 0, earnings: 0 },
  referralCode: o.get('referralCode') ?? '',
  referredBy: o.get('referredBy') ?? null,
  banned: o.get('banned') ?? false,
  createdAt: o.createdAt?.getTime() ?? 0,
});

const toGame = (o: PO): Game => ({
  id: o.get('gameId'),
  name: o.get('name'),
  image: o.get('image') ?? '',
  mode: o.get('mode'),
  order: o.get('order') ?? 0,
  active: o.get('active') ?? true,
  activeContests: o.get('activeContests') ?? 0,
});

const toContest = (o: PO): Contest => ({
  id: o.id!,
  gameId: o.get('gameId'),
  title: o.get('title'),
  mode: o.get('mode'),
  map: o.get('map'),
  matchType: o.get('matchType'),
  entryFee: o.get('entryFee') ?? 0,
  prizePool: o.get('prizePool') ?? 0,
  perKill: o.get('perKill') ?? 0,
  totalSlots: o.get('totalSlots') ?? 0,
  filledSlots: o.get('filledSlots') ?? 0,
  schedule: o.get('schedule') ?? 0,
  status: o.get('status') ?? 'upcoming',
  roomId: o.get('roomId') ?? '',
  roomPassword: o.get('roomPassword') ?? '',
  prizeBreakdown: o.get('prizeBreakdown') ?? [],
  rules: o.get('rules') ?? '',
  bannerUrl: o.get('bannerUrl') ?? '',
  videoUrl: o.get('videoUrl') ?? '',
  createdAt: o.createdAt?.getTime() ?? 0,
});

const toReg = (o: PO): Registration => ({
  id: o.id!,
  contestId: o.get('contestId'),
  gameId: o.get('gameId'),
  userId: o.get('userId'),
  username: o.get('username'),
  slotNumber: o.get('slotNumber'),
  inGameName: o.get('inGameName'),
  teamName: o.get('teamName') ?? '',
  paidAmount: o.get('paidAmount') ?? 0,
  kills: o.get('kills') ?? 0,
  placement: o.get('placement') ?? 0,
  wonAmount: o.get('wonAmount') ?? 0,
  proofUrl: o.get('proofUrl') ?? '',
  joinedAt: o.createdAt?.getTime() ?? 0,
});

const toTxn = (o: PO): Transaction => ({
  id: o.id!,
  userId: o.get('userId'),
  type: o.get('type'),
  amount: o.get('amount'),
  walletType: o.get('walletType'),
  description: o.get('description'),
  balanceAfter: o.get('balanceAfter') ?? 0,
  createdAt: o.createdAt?.getTime() ?? 0,
});

const toMoney = (o: PO): MoneyRequest => ({
  id: o.id!,
  userId: o.get('userId'),
  username: o.get('username'),
  amount: o.get('amount'),
  status: o.get('status') ?? 'pending',
  note: o.get('note') ?? '',
  proofUrl: o.get('proofUrl') ?? '',
  utr: o.get('utr') ?? '',
  payoutUpi: o.get('payoutUpi') ?? '',
  createdAt: o.createdAt?.getTime() ?? 0,
});

const toNotif = (o: PO): AppNotification => ({
  id: o.id!,
  title: o.get('title'),
  body: o.get('body'),
  createdAt: o.createdAt?.getTime() ?? 0,
});

/* ------------------------------------------------------------- realtime */

/**
 * Runs the query now, then again whenever LiveQuery reports a change to
 * that class.
 *
 * Re-running rather than patching a local copy keeps every screen agreeing
 * with the server, and means one code path handles creates, updates and
 * deletes alike. LiveQuery needs the class enabled in the Back4App
 * dashboard; where it is not, the initial fetch still works and the screen
 * simply is not live, so a missing subscription degrades rather than breaks.
 */
function live<T>(
  build: () => Parse.Query,
  map: (o: PO) => T,
  cb: (v: T[]) => void,
): Unsub {
  let closed = false;
  let sub: Parse.LiveQuerySubscription | undefined;

  const run = () => {
    build()
      .find()
      .then((rows) => !closed && cb(rows.map(map)))
      .catch((e) => console.warn('[parse] query failed', e?.message));
  };
  run();

  build()
    .subscribe()
    .then((s) => {
      if (closed) return void s.unsubscribe();
      sub = s;
      s.on('create', run);
      s.on('update', run);
      s.on('delete', run);
      s.on('enter', run);
      s.on('leave', run);
    })
    .catch((e) => console.warn('[parse] live query unavailable', e?.message));

  return () => {
    closed = true;
    sub?.unsubscribe();
  };
}

/** Same as `live`, for a query expected to yield a single row. */
function liveOne<T>(
  build: () => Parse.Query,
  map: (o: PO) => T,
  cb: (v: T | null) => void,
): Unsub {
  return live(build, map, (rows) => cb(rows[0] ?? null));
}

/* ---------------------------------------------------------------- backend */

const Q = (cls: string) => new Parse.Query(cls);

class ParseBackend implements Backend {
  readonly kind = 'parse' as const;

  /* ---- auth ---- */

  onAuthChange(cb: (uid: string | null) => void): Unsub {
    let closed = false;
    // Parse has no auth listener, so the restored session is reported once
    // and later changes come from signIn/signUp/signOut calling this back.
    Parse.User.currentAsync()
      .then((u) => !closed && cb(u?.id ?? null))
      .catch(() => !closed && cb(null));

    this.authListeners.add(cb);
    return () => {
      closed = true;
      this.authListeners.delete(cb);
    };
  }

  private authListeners = new Set<(uid: string | null) => void>();

  private announce(uid: string | null) {
    this.authListeners.forEach((cb) => cb(uid));
  }

  async signUp(username: string, email: string, password: string, referredBy?: string) {
    const user = new Parse.User();
    // Parse requires a username; the email doubles as it so players only
    // ever type one identifier.
    user.set('username', email.trim().toLowerCase());
    user.set('email', email.trim().toLowerCase());
    user.set('password', password);
    user.set('displayName', username.trim());
    user.set('referredBy', referredBy ?? '');

    await user.signUp();
    // The profile row, wallet and role are set by Cloud Code so none of it
    // can be chosen by the client.
    await Parse.Cloud.run('setupProfile', { displayName: username.trim() });
    this.announce(user.id ?? null);
  }

  async signIn(email: string, password: string) {
    const user = await Parse.User.logIn(email.trim().toLowerCase(), password);
    this.announce(user.id ?? null);
  }

  async signOut() {
    await Parse.User.logOut();
    this.announce(null);
  }

  /* ---- user ---- */

  watchUser(uid: string, cb: (u: AppUser | null) => void): Unsub {
    return liveOne(() => Q('Player').equalTo('userId', uid), toUser, cb);
  }

  /* ---- catalog ---- */

  watchGames(cb: (g: Game[]) => void): Unsub {
    return live(() => Q('Game').equalTo('active', true).ascending('order'), toGame, cb);
  }

  watchContests(gameId: string, cb: (c: Contest[]) => void): Unsub {
    return live(() => Q('Contest').equalTo('gameId', gameId).ascending('schedule'), toContest, cb);
  }

  watchAllContests(cb: (c: Contest[]) => void): Unsub {
    return live(() => Q('Contest').descending('schedule'), toContest, cb);
  }

  async getContest(id: string) {
    const o = await Q('Contest').get(id).catch(() => null);
    return o ? toContest(o) : null;
  }

  watchContest(id: string, cb: (c: Contest | null) => void): Unsub {
    return liveOne(() => Q('Contest').equalTo('objectId', id), toContest, cb);
  }

  /* ---- registrations ---- */

  watchUserRegistrations(uid: string, cb: (r: Registration[]) => void): Unsub {
    return live(() => Q('Registration').equalTo('userId', uid).descending('createdAt'), toReg, cb);
  }

  watchContestRegistrations(contestId: string, cb: (r: Registration[]) => void): Unsub {
    return live(
      () => Q('Registration').equalTo('contestId', contestId).ascending('slotNumber'),
      toReg,
      cb,
    );
  }

  async joinContest(input: JoinInput) {
    // Slot claim, balance check and debit all happen server-side so two
    // players cannot take one slot or overdraw the same balance.
    await Parse.Cloud.run('joinContest', {
      contestId: input.contest.id,
      slotNumber: input.slotNumber,
      inGameName: input.inGameName,
      teamName: input.teamName ?? '',
    });
  }

  /* ---- wallet ---- */

  watchTransactions(uid: string, cb: (t: Transaction[]) => void): Unsub {
    return live(
      () => Q('Transaction').equalTo('userId', uid).descending('createdAt').limit(100),
      toTxn,
      cb,
    );
  }

  async createDeposit(_user: AppUser, amount: number, proof?: DepositProof) {
    await Parse.Cloud.run('createDeposit', {
      amount,
      proofUrl: proof?.proofUrl ?? '',
      utr: proof?.utr ?? '',
    });
  }

  async createWithdrawal(_user: AppUser, amount: number, payoutUpi?: string) {
    // The balance is held server-side at request time, so the same winnings
    // cannot be requested twice.
    await Parse.Cloud.run('requestWithdrawal', { amount, payoutUpi: payoutUpi ?? '' });
  }

  async claimDailyBonus() {
    return (await Parse.Cloud.run('claimDailyBonus')) as { reward: number; streak: number };
  }

  /* ---- leaderboard / feeds ---- */

  watchLeaderboard(cb: (u: AppUser[]) => void): Unsub {
    return live(
      () => Q('Player').descending('earnings').limit(50),
      toUser,
      cb,
    );
  }

  watchRecentWins(cb: (w: RecentWin[]) => void): Unsub {
    return live(
      () => Q('Registration').greaterThan('wonAmount', 0).descending('updatedAt').limit(20),
      (o): RecentWin => ({
        id: o.id!,
        username: o.get('username'),
        amount: o.get('wonAmount'),
        // Denormalised when results are declared, so the feed needs no join.
        contestTitle: o.get('contestTitle') ?? 'a match',
        placement: o.get('placement') ?? 0,
        at: o.updatedAt?.getTime() ?? 0,
      }),
      cb,
    );
  }

  watchNotifications(cb: (n: AppNotification[]) => void): Unsub {
    return live(() => Q('Notification').descending('createdAt').limit(50), toNotif, cb);
  }

  /* ---- admin: money requests ---- */

  watchDeposits(cb: (d: MoneyRequest[]) => void): Unsub {
    return live(() => Q('Deposit').descending('createdAt'), toMoney, cb);
  }

  watchWithdrawals(cb: (d: MoneyRequest[]) => void): Unsub {
    return live(() => Q('Withdrawal').descending('createdAt'), toMoney, cb);
  }

  approveDeposit(r: MoneyRequest) { return Parse.Cloud.run('approveDeposit', { id: r.id }); }
  rejectDeposit(r: MoneyRequest) { return Parse.Cloud.run('rejectDeposit', { id: r.id }); }
  approveWithdrawal(r: MoneyRequest) { return Parse.Cloud.run('approveWithdrawal', { id: r.id }); }
  rejectWithdrawal(r: MoneyRequest) { return Parse.Cloud.run('rejectWithdrawal', { id: r.id }); }

  /* ---- admin: contests ---- */

  async createContest(input: ContestInput) {
    await Parse.Cloud.run('saveContest', { contest: input });
  }

  async updateContest(id: string, patch: Partial<Contest>) {
    await Parse.Cloud.run('saveContest', { id, contest: patch });
  }

  async deleteContest(id: string) {
    await Parse.Cloud.run('deleteContest', { id });
  }

  /* ---- admin: users ---- */

  watchUsers(cb: (u: AppUser[]) => void): Unsub {
    return live(() => Q('Player').descending('createdAt'), toUser, cb);
  }

  async setUserRole(uid: string, role: AppUser['role']) {
    await Parse.Cloud.run('setUserRole', { userId: uid, role });
  }

  async setUserBanned(uid: string, banned: boolean) {
    await Parse.Cloud.run('setUserBanned', { userId: uid, banned });
  }

  async sendNotification(title: string, body: string) {
    await Parse.Cloud.run('sendNotification', { title, body });
  }

  /* ---- staff: match management ---- */

  async setRoomCredentials(
    contestId: string, roomId: string, roomPassword: string, status?: Contest['status'],
  ) {
    await Parse.Cloud.run('setRoomCredentials', { contestId, roomId, roomPassword, status });
  }

  async declareResults(contestId: string, results: ResultRow[]) {
    // One call so prizes, stats and the contest status all move together.
    await Parse.Cloud.run('declareResults', { contestId, results });
  }

  async removeRegistration(reg: Registration) {
    await Parse.Cloud.run('removeRegistration', { registrationId: reg.id });
  }

  async setResultProof(registrationId: string, proofUrl: string) {
    await Parse.Cloud.run('setResultProof', { registrationId, proofUrl });
  }

  /* ---- storage ---- */

  async uploadImage(localUri: string, folder: 'deposits' | 'results' | 'contests') {
    const ext = (localUri.split('.').pop() ?? 'jpg').split('?')[0].toLowerCase();
    const blob = await (await fetch(localUri)).blob();
    // Parse.File takes the raw bytes; base64 would inflate the upload by a
    // third for no benefit.
    const file = new Parse.File(`${folder}-${Date.now()}.${ext}`, blob as any);
    await file.save();
    const url = file.url();
    if (!url) throw new Error('Upload succeeded but returned no URL.');
    return url;
  }

  async seed() {
    // Cloud Code fills the catalog the first time it is called.
    await Parse.Cloud.run('seedCatalog').catch(() => {});
  }
}

export const parseBackend = new ParseBackend();
