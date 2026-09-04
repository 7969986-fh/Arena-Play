import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppNotification,
  AppUser,
  Contest,
  Game,
  MoneyRequest,
  Registration,
  Transaction,
} from '@/models/types';
import { SEED_GAMES } from '@/constants/games';
import { buildSampleContests } from '@/services/sampleData';
import { Backend, JoinInput, Unsub } from '@/services/backendTypes';

/**
 * Local, offline backend backed by AsyncStorage.
 * Used when Firebase keys are not configured so the app is fully usable and
 * testable. NOTE: local auth stores credentials on-device only (demo use);
 * production runs on the Firebase adapter.
 */

const PREFIX = '@arena/';
type Coll =
  | 'users'
  | 'games'
  | 'contests'
  | 'registrations'
  | 'transactions'
  | 'deposits'
  | 'withdrawals'
  | 'notifications'
  | 'creds'
  | 'session';

const now = () => Date.now();
const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 8);

type Listener = () => void;

class LocalBackend implements Backend {
  readonly kind = 'local' as const;
  private cache: Partial<Record<Coll, any>> = {};
  private listeners: Record<string, Set<Listener>> = {};
  private ready: Promise<void>;

  constructor() {
    this.ready = this.hydrate();
  }

  private async hydrate() {
    const colls: Coll[] = [
      'users', 'games', 'contests', 'registrations', 'transactions',
      'deposits', 'withdrawals', 'notifications', 'creds', 'session',
    ];
    const pairs = await AsyncStorage.multiGet(colls.map((c) => PREFIX + c));
    for (const [k, v] of pairs) {
      const name = k.replace(PREFIX, '') as Coll;
      this.cache[name] = v ? JSON.parse(v) : this.defaultFor(name);
    }
    await this.seed();
  }

  private defaultFor(c: Coll): any {
    return c === 'session' ? { uid: null } : c === 'creds' ? {} : [];
  }

  private async persist(c: Coll) {
    await AsyncStorage.setItem(PREFIX + c, JSON.stringify(this.cache[c]));
    this.emit(c);
  }

  private get<T = any>(c: Coll): T {
    if (this.cache[c] === undefined) this.cache[c] = this.defaultFor(c);
    return this.cache[c] as T;
  }

  // ---- pub/sub ----
  private emit(topic: string) {
    this.listeners[topic]?.forEach((l) => l());
  }
  private on(topic: string, l: Listener): Unsub {
    (this.listeners[topic] ??= new Set()).add(l);
    return () => this.listeners[topic]?.delete(l);
  }

  private subscribe<T>(coll: Coll, compute: () => T, cb: (v: T) => void): Unsub {
    let live = true;
    const push = () => live && cb(compute());
    this.ready.then(push);
    return this.on(coll, push);
  }

  // ---- auth ----
  onAuthChange(cb: (uid: string | null) => void): Unsub {
    let live = true;
    const push = () => live && cb(this.get<any>('session').uid ?? null);
    this.ready.then(push);
    const off = this.on('session', push);
    return () => { live = false; off(); };
  }

  async signUp(username: string, email: string, password: string, referredBy?: string) {
    await this.ready;
    const creds = this.get<Record<string, any>>('creds');
    const key = email.trim().toLowerCase();
    if (creds[key]) throw new Error('An account with this email already exists.');
    const id = uid();
    creds[key] = { uid: id, password };
    const user: AppUser = {
      uid: id,
      username: username.trim(),
      email: key,
      role: 'player',
      wallet: { deposit: 0, winnings: 0, bonus: 0 },
      stats: { matchesPlayed: 0, kills: 0, earnings: 0 },
      referralCode: username.trim().toLowerCase().replace(/\s+/g, '') || id.slice(0, 6),
      referredBy: referredBy || null,
      createdAt: now(),
    };
    this.get<AppUser[]>('users').push(user);
    await this.persist('creds');
    await this.persist('users');
    this.cache['session'] = { uid: id };
    await this.persist('session');
  }

  async signIn(email: string, password: string) {
    await this.ready;
    const creds = this.get<Record<string, any>>('creds');
    const rec = creds[email.trim().toLowerCase()];
    if (!rec || rec.password !== password) {
      throw new Error('Invalid email or password.');
    }
    this.cache['session'] = { uid: rec.uid };
    await this.persist('session');
  }

  async signOut() {
    await this.ready;
    this.cache['session'] = { uid: null };
    await this.persist('session');
  }

  // ---- user ----
  watchUser(id: string, cb: (u: AppUser | null) => void): Unsub {
    return this.subscribe('users', () =>
      this.get<AppUser[]>('users').find((u) => u.uid === id) ?? null, cb);
  }

  private async saveUser(u: AppUser) {
    const users = this.get<AppUser[]>('users');
    const i = users.findIndex((x) => x.uid === u.uid);
    if (i >= 0) users[i] = u; else users.push(u);
    await this.persist('users');
  }

  // ---- catalog ----
  watchGames(cb: (g: Game[]) => void): Unsub {
    return this.subscribe('games', () => {
      const contests = this.get<Contest[]>('contests');
      return [...this.get<Game[]>('games')]
        .sort((a, b) => a.order - b.order)
        .map((g) => ({
          ...g,
          activeContests: contests.filter(
            (c) => c.gameId === g.id && c.status !== 'resulted').length,
        }));
    }, cb);
  }

  watchContests(gameId: string, cb: (c: Contest[]) => void): Unsub {
    return this.subscribe('contests', () =>
      this.get<Contest[]>('contests')
        .filter((c) => c.gameId === gameId)
        .sort((a, b) => a.schedule - b.schedule), cb);
  }

  async getContest(id: string): Promise<Contest | null> {
    await this.ready;
    return this.get<Contest[]>('contests').find((c) => c.id === id) ?? null;
  }

  watchContest(id: string, cb: (c: Contest | null) => void): Unsub {
    return this.subscribe('contests', () =>
      this.get<Contest[]>('contests').find((c) => c.id === id) ?? null, cb);
  }

  // ---- registrations ----
  watchUserRegistrations(id: string, cb: (r: Registration[]) => void): Unsub {
    return this.subscribe('registrations', () =>
      this.get<Registration[]>('registrations')
        .filter((r) => r.userId === id)
        .sort((a, b) => b.joinedAt - a.joinedAt), cb);
  }

  watchContestRegistrations(contestId: string, cb: (r: Registration[]) => void): Unsub {
    return this.subscribe('registrations', () =>
      this.get<Registration[]>('registrations')
        .filter((r) => r.contestId === contestId)
        .sort((a, b) => a.slotNumber - b.slotNumber), cb);
  }

  async joinContest({ contest, user, slotNumber, inGameName, teamName }: JoinInput) {
    await this.ready;
    const contests = this.get<Contest[]>('contests');
    const c = contests.find((x) => x.id === contest.id);
    if (!c) throw new Error('Contest not found.');

    const regs = this.get<Registration[]>('registrations');
    if (regs.some((r) => r.contestId === c.id && r.userId === user.uid)) {
      throw new Error('You have already joined this contest.');
    }
    if (regs.some((r) => r.contestId === c.id && r.slotNumber === slotNumber)) {
      throw new Error('That slot was just taken. Pick another.');
    }
    if (c.filledSlots >= c.totalSlots) throw new Error('Contest is full.');

    const fee = c.entryFee;
    const u = this.get<AppUser[]>('users').find((x) => x.uid === user.uid)!;
    const balance = u.wallet.deposit + u.wallet.winnings + u.wallet.bonus;
    if (fee > 0 && balance < fee) throw new Error('Insufficient balance. Please recharge.');

    // Debit: bonus -> deposit -> winnings
    let remaining = fee;
    for (const wt of ['bonus', 'deposit', 'winnings'] as const) {
      const take = Math.min(u.wallet[wt], remaining);
      u.wallet[wt] -= take;
      remaining -= take;
    }
    u.stats.matchesPlayed += 1;
    await this.saveUser(u);

    if (fee > 0) {
      await this.addTransaction(u.uid, 'debit', fee, 'deposit',
        `Joined ${c.title}`, u.wallet.deposit + u.wallet.winnings + u.wallet.bonus);
    }

    regs.push({
      id: uid(),
      contestId: c.id,
      gameId: c.gameId,
      userId: u.uid,
      username: u.username,
      slotNumber,
      inGameName,
      teamName: teamName ?? `Team ${slotNumber}`,
      paidAmount: fee,
      kills: 0,
      placement: 0,
      wonAmount: 0,
      joinedAt: now(),
    });
    await this.persist('registrations');

    c.filledSlots += 1;
    await this.persist('contests');
  }

  // ---- wallet ----
  private async addTransaction(
    userId: string, type: 'credit' | 'debit', amount: number,
    walletType: 'deposit' | 'winnings' | 'bonus', description: string, balanceAfter: number,
  ) {
    const txns = this.get<Transaction[]>('transactions');
    txns.push({ id: uid(), userId, type, amount, walletType, description, balanceAfter, createdAt: now() });
    await this.persist('transactions');
  }

  watchTransactions(id: string, cb: (t: Transaction[]) => void): Unsub {
    return this.subscribe('transactions', () =>
      this.get<Transaction[]>('transactions')
        .filter((t) => t.userId === id)
        .sort((a, b) => b.createdAt - a.createdAt), cb);
  }

  async createDeposit(user: AppUser, amount: number) {
    await this.ready;
    this.get<MoneyRequest[]>('deposits').push({
      id: uid(), userId: user.uid, username: user.username, amount,
      status: 'pending', createdAt: now(),
    });
    await this.persist('deposits');
    // Demo convenience: auto-approve local deposits so the wallet is usable.
    const u = this.get<AppUser[]>('users').find((x) => x.uid === user.uid)!;
    u.wallet.deposit += amount;
    await this.saveUser(u);
    await this.addTransaction(u.uid, 'credit', amount, 'deposit',
      'Wallet recharge', u.wallet.deposit + u.wallet.winnings + u.wallet.bonus);
    const deps = this.get<MoneyRequest[]>('deposits');
    deps[deps.length - 1].status = 'approved';
    await this.persist('deposits');
  }

  async createWithdrawal(user: AppUser, amount: number) {
    await this.ready;
    const u = this.get<AppUser[]>('users').find((x) => x.uid === user.uid)!;
    if (u.wallet.winnings < amount) throw new Error('Withdrawable (winnings) balance too low.');
    this.get<MoneyRequest[]>('withdrawals').push({
      id: uid(), userId: user.uid, username: user.username, amount,
      status: 'pending', createdAt: now(),
    });
    u.wallet.winnings -= amount;
    await this.saveUser(u);
    await this.addTransaction(u.uid, 'debit', amount, 'winnings',
      'Withdrawal request', u.wallet.deposit + u.wallet.winnings + u.wallet.bonus);
    await this.persist('withdrawals');
  }

  // ---- leaderboard / notifications / admin ----
  watchLeaderboard(cb: (u: AppUser[]) => void): Unsub {
    return this.subscribe('users', () =>
      [...this.get<AppUser[]>('users')]
        .sort((a, b) => b.stats.earnings - a.stats.earnings)
        .slice(0, 50), cb);
  }

  watchNotifications(cb: (n: AppNotification[]) => void): Unsub {
    return this.subscribe('notifications', () =>
      [...this.get<AppNotification[]>('notifications')].sort((a, b) => b.createdAt - a.createdAt), cb);
  }

  watchDeposits(cb: (d: MoneyRequest[]) => void): Unsub {
    return this.subscribe('deposits', () =>
      [...this.get<MoneyRequest[]>('deposits')].sort((a, b) => b.createdAt - a.createdAt), cb);
  }

  watchWithdrawals(cb: (d: MoneyRequest[]) => void): Unsub {
    return this.subscribe('withdrawals', () =>
      [...this.get<MoneyRequest[]>('withdrawals')].sort((a, b) => b.createdAt - a.createdAt), cb);
  }

  // ---- seed ----
  async seed() {
    if (this.get<Game[]>('games').length === 0) {
      this.cache['games'] = SEED_GAMES.map((g) => ({ ...g }));
      await this.persist('games');
    }
    if (this.get<Contest[]>('contests').length === 0) {
      this.cache['contests'] = buildSampleContests();
      await this.persist('contests');
    }
    if (this.get<AppNotification[]>('notifications').length === 0) {
      this.cache['notifications'] = [
        { id: uid(), title: 'Welcome to Arena Play!', body: 'Join contests, climb the leaderboard, and win coins.', createdAt: now() },
        { id: uid(), title: 'Mandatory Recording', body: 'Screen recording is compulsory for evidence. Strict ban policy for cheaters.', createdAt: now() - 3600_000 },
      ];
      await this.persist('notifications');
    }
  }
}

export const localBackend = new LocalBackend();
