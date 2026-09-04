import {
  AppNotification,
  AppUser,
  Contest,
  Game,
  MoneyRequest,
  Registration,
  Transaction,
} from '@/models/types';

export type Unsub = () => void;

export interface JoinInput {
  contest: Contest;
  user: AppUser;
  slotNumber: number;
  inGameName: string;
  teamName?: string;
}

export interface Backend {
  readonly kind: 'local' | 'firebase';

  // Auth
  onAuthChange(cb: (uid: string | null) => void): Unsub;
  signUp(username: string, email: string, password: string, referredBy?: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;

  // User
  watchUser(uid: string, cb: (u: AppUser | null) => void): Unsub;

  // Catalog
  watchGames(cb: (g: Game[]) => void): Unsub;
  watchContests(gameId: string, cb: (c: Contest[]) => void): Unsub;
  getContest(id: string): Promise<Contest | null>;
  watchContest(id: string, cb: (c: Contest | null) => void): Unsub;

  // Registrations
  watchUserRegistrations(uid: string, cb: (r: Registration[]) => void): Unsub;
  watchContestRegistrations(contestId: string, cb: (r: Registration[]) => void): Unsub;
  joinContest(input: JoinInput): Promise<void>;

  // Wallet
  watchTransactions(uid: string, cb: (t: Transaction[]) => void): Unsub;
  createDeposit(user: AppUser, amount: number): Promise<void>;
  createWithdrawal(user: AppUser, amount: number): Promise<void>;

  // Leaderboard / misc
  watchLeaderboard(cb: (u: AppUser[]) => void): Unsub;
  watchNotifications(cb: (n: AppNotification[]) => void): Unsub;

  // Admin / staff
  watchDeposits(cb: (d: MoneyRequest[]) => void): Unsub;
  watchWithdrawals(cb: (d: MoneyRequest[]) => void): Unsub;

  // Setup
  seed(): Promise<void>;
}
