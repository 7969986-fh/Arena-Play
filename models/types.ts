export type Role = 'player' | 'staff' | 'admin';
export type ContestMode = 'solo' | 'duo' | 'squad';
export type MatchType = 'paid' | 'free';
export type ContestStatus = 'upcoming' | 'ongoing' | 'resulted';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type WalletType = 'deposit' | 'winnings' | 'bonus';
export type TxnType = 'credit' | 'debit';

export interface Wallet {
  deposit: number;
  winnings: number;
  bonus: number;
}

export interface UserStats {
  matchesPlayed: number;
  kills: number;
  earnings: number;
}

export interface AppUser {
  uid: string;
  username: string;
  email: string;
  role: Role;
  wallet: Wallet;
  stats: UserStats;
  referralCode: string;
  referredBy?: string | null;
  banned?: boolean;
  createdAt: number;
}

export interface Game {
  id: string;
  name: string;
  image: string;
  mode: string;
  order: number;
  active: boolean;
  activeContests?: number;
}

export interface PrizeRow {
  rank: number;
  amount: number;
}

export interface Contest {
  id: string;
  gameId: string;
  title: string;
  mode: ContestMode;
  map: string;
  matchType: MatchType;
  entryFee: number;
  prizePool: number;
  perKill: number;
  totalSlots: number;
  filledSlots: number;
  schedule: number; // epoch ms
  status: ContestStatus;
  roomId?: string;
  roomPassword?: string;
  prizeBreakdown: PrizeRow[];
  rules?: string;
  bannerColor?: string;
  createdAt: number;
}

export interface Registration {
  id: string;
  contestId: string;
  gameId: string;
  userId: string;
  username: string;
  slotNumber: number;
  inGameName: string;
  teamName?: string;
  paidAmount: number;
  kills: number;
  placement: number;
  wonAmount: number;
  joinedAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TxnType;
  amount: number;
  walletType: WalletType;
  description: string;
  balanceAfter: number;
  createdAt: number;
}

export interface MoneyRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  status: RequestStatus;
  note?: string;
  /** Deposits: screenshot of the UPI payment, for the admin to verify. */
  proofUrl?: string;
  /** Deposits: UPI reference / UTR number the player pasted in. */
  utr?: string;
  /** Withdrawals: the UPI ID the player wants to be paid on. */
  payoutUpi?: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}

export function walletTotal(w?: Wallet): number {
  if (!w) return 0;
  return (w.deposit || 0) + (w.winnings || 0) + (w.bonus || 0);
}
