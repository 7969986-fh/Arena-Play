import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, firebaseAuth } from '@/lib/firebase';
import {
  AppNotification, AppUser, Contest, Game, MoneyRequest, Registration, Transaction,
} from '@/models/types';
import { SEED_GAMES } from '@/constants/games';
import { buildSampleContests } from '@/services/sampleData';
import { Backend, JoinInput, Unsub } from '@/services/backendTypes';

const now = () => Date.now();

function docsTo<T>(snap: any): T[] {
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as T);
}

class FirebaseBackend implements Backend {
  readonly kind = 'firebase' as const;

  onAuthChange(cb: (uid: string | null) => void): Unsub {
    return onAuthStateChanged(firebaseAuth, (u) => cb(u?.uid ?? null));
  }

  async signUp(username: string, email: string, password: string, referredBy?: string) {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const user: AppUser = {
      uid: cred.user.uid,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role: 'player',
      wallet: { deposit: 0, winnings: 0, bonus: 0 },
      stats: { matchesPlayed: 0, kills: 0, earnings: 0 },
      referralCode: username.trim().toLowerCase().replace(/\s+/g, ''),
      referredBy: referredBy || null,
      banned: false,
      createdAt: now(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), user);
  }

  async signIn(email: string, password: string) {
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  }

  async signOut() {
    await fbSignOut(firebaseAuth);
  }

  watchUser(uid: string, cb: (u: AppUser | null) => void): Unsub {
    return onSnapshot(doc(db, 'users', uid), (d) =>
      cb(d.exists() ? ({ uid: d.id, ...d.data() } as AppUser) : null));
  }

  watchGames(cb: (g: Game[]) => void): Unsub {
    return onSnapshot(query(collection(db, 'games'), orderBy('order')), (s) =>
      cb(docsTo<Game>(s)));
  }

  watchContests(gameId: string, cb: (c: Contest[]) => void): Unsub {
    return onSnapshot(
      query(collection(db, 'contests'), where('gameId', '==', gameId), orderBy('schedule')),
      (s) => cb(docsTo<Contest>(s)));
  }

  async getContest(id: string): Promise<Contest | null> {
    const d = await getDoc(doc(db, 'contests', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Contest) : null;
  }

  watchContest(id: string, cb: (c: Contest | null) => void): Unsub {
    return onSnapshot(doc(db, 'contests', id), (d) =>
      cb(d.exists() ? ({ id: d.id, ...d.data() } as Contest) : null));
  }

  watchUserRegistrations(uid: string, cb: (r: Registration[]) => void): Unsub {
    return onSnapshot(
      query(collection(db, 'registrations'), where('userId', '==', uid), orderBy('joinedAt', 'desc')),
      (s) => cb(docsTo<Registration>(s)));
  }

  watchContestRegistrations(contestId: string, cb: (r: Registration[]) => void): Unsub {
    return onSnapshot(
      query(collection(db, 'registrations'), where('contestId', '==', contestId)),
      (s) => cb(docsTo<Registration>(s).sort((a, b) => a.slotNumber - b.slotNumber)));
  }

  async joinContest({ contest, user, slotNumber, inGameName, teamName }: JoinInput) {
    const contestRef = doc(db, 'contests', contest.id);
    const userRef = doc(db, 'users', user.uid);
    const regRef = doc(collection(db, 'registrations'));

    await runTransaction(db, async (tx) => {
      const cSnap = await tx.get(contestRef);
      const uSnap = await tx.get(userRef);
      if (!cSnap.exists()) throw new Error('Contest not found.');
      if (!uSnap.exists()) throw new Error('User not found.');
      const c = cSnap.data() as Contest;
      const u = uSnap.data() as AppUser;

      if (c.filledSlots >= c.totalSlots) throw new Error('Contest is full.');
      const fee = c.entryFee;
      const balance = u.wallet.deposit + u.wallet.winnings + u.wallet.bonus;
      if (fee > 0 && balance < fee) throw new Error('Insufficient balance. Please recharge.');

      let remaining = fee;
      const wallet = { ...u.wallet };
      for (const wt of ['bonus', 'deposit', 'winnings'] as const) {
        const take = Math.min(wallet[wt], remaining);
        wallet[wt] -= take;
        remaining -= take;
      }

      tx.update(userRef, { wallet, 'stats.matchesPlayed': increment(1) });
      tx.update(contestRef, { filledSlots: increment(1) });
      tx.set(regRef, {
        contestId: c.id, gameId: c.gameId, userId: u.uid, username: u.username,
        slotNumber, inGameName, teamName: teamName ?? `Team ${slotNumber}`,
        paidAmount: fee, kills: 0, placement: 0, wonAmount: 0, joinedAt: now(),
      } as Omit<Registration, 'id'>);
      if (fee > 0) {
        const balAfter = wallet.deposit + wallet.winnings + wallet.bonus;
        tx.set(doc(collection(db, 'transactions')), {
          userId: u.uid, type: 'debit', amount: fee, walletType: 'deposit',
          description: `Joined ${c.title}`, balanceAfter: balAfter, createdAt: now(),
        } as Omit<Transaction, 'id'>);
      }
    });
  }

  watchTransactions(uid: string, cb: (t: Transaction[]) => void): Unsub {
    return onSnapshot(
      query(collection(db, 'transactions'), where('userId', '==', uid), orderBy('createdAt', 'desc')),
      (s) => cb(docsTo<Transaction>(s)));
  }

  async createDeposit(user: AppUser, amount: number) {
    await addDoc(collection(db, 'deposits'), {
      userId: user.uid, username: user.username, amount, status: 'pending', createdAt: now(),
    } as Omit<MoneyRequest, 'id'>);
  }

  async createWithdrawal(user: AppUser, amount: number) {
    await addDoc(collection(db, 'withdrawals'), {
      userId: user.uid, username: user.username, amount, status: 'pending', createdAt: now(),
    } as Omit<MoneyRequest, 'id'>);
  }

  watchLeaderboard(cb: (u: AppUser[]) => void): Unsub {
    return onSnapshot(
      query(collection(db, 'users'), orderBy('stats.earnings', 'desc'), limit(50)),
      (s) => cb(docsTo<AppUser>(s)));
  }

  watchNotifications(cb: (n: AppNotification[]) => void): Unsub {
    return onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc')),
      (s) => cb(docsTo<AppNotification>(s)));
  }

  watchDeposits(cb: (d: MoneyRequest[]) => void): Unsub {
    return onSnapshot(
      query(collection(db, 'deposits'), orderBy('createdAt', 'desc')),
      (s) => cb(docsTo<MoneyRequest>(s)));
  }

  watchWithdrawals(cb: (d: MoneyRequest[]) => void): Unsub {
    return onSnapshot(
      query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc')),
      (s) => cb(docsTo<MoneyRequest>(s)));
  }

  async seed() {
    for (const g of SEED_GAMES) {
      await setDoc(doc(db, 'games', g.id), g, { merge: true });
    }
    for (const c of buildSampleContests()) {
      await setDoc(doc(db, 'contests', c.id), c, { merge: true });
    }
  }
}

export const firebaseBackend = new FirebaseBackend();
