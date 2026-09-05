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

export interface ContestInput {
  gameId: string;
  title: string;
  mode: Contest['mode'];
  map: string;
  matchType: Contest['matchType'];
  entryFee: number;
  prizePool: number;
  perKill: number;
  totalSlots: number;
  schedule: number;
  prizeBreakdown: Contest['prizeBreakdown'];
  rules?: string;
}

/** Extra evidence a player attaches to a manual UPI deposit. */
export interface DepositProof {
  proofUrl?: string;
  utr?: string;
}

export interface ResultRow {
  registrationId: string;
  kills: number;
  placement: number;
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
  createDeposit(user: AppUser, amount: number, proof?: DepositProof): Promise<void>;
  createWithdrawal(user: AppUser, amount: number, payoutUpi?: string): Promise<void>;

  // Leaderboard / misc
  watchLeaderboard(cb: (u: AppUser[]) => void): Unsub;
  watchNotifications(cb: (n: AppNotification[]) => void): Unsub;

  // Admin / staff — money requests
  watchDeposits(cb: (d: MoneyRequest[]) => void): Unsub;
  watchWithdrawals(cb: (d: MoneyRequest[]) => void): Unsub;
  approveDeposit(req: MoneyRequest): Promise<void>;
  rejectDeposit(req: MoneyRequest): Promise<void>;
  approveWithdrawal(req: MoneyRequest): Promise<void>;
  rejectWithdrawal(req: MoneyRequest): Promise<void>;

  // Admin — catalog management
  watchAllContests(cb: (c: Contest[]) => void): Unsub;
  createContest(input: ContestInput): Promise<void>;
  updateContest(id: string, patch: Partial<Contest>): Promise<void>;
  deleteContest(id: string): Promise<void>;

  // Admin — users
  watchUsers(cb: (u: AppUser[]) => void): Unsub;
  setUserRole(uid: string, role: AppUser['role']): Promise<void>;
  setUserBanned(uid: string, banned: boolean): Promise<void>;

  // Admin — notifications
  sendNotification(title: string, body: string): Promise<void>;

  // Staff / admin — match management
  setRoomCredentials(contestId: string, roomId: string, roomPassword: string, status?: Contest['status']): Promise<void>;
  declareResults(contestId: string, results: ResultRow[]): Promise<void>;
  removeRegistration(reg: Registration): Promise<void>;

  /**
   * Stores a local image and returns a URL the app can render later.
   * The local backend keeps the on-device URI as-is; a cloud backend
   * uploads the file and returns its public URL.
   */
  uploadImage(localUri: string, folder: 'deposits' | 'results'): Promise<string>;

  // Setup
  seed(): Promise<void>;
}
