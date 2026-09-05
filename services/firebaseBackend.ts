import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db, firebaseAuth } from '@/lib/firebase';
import {
  AppNotification, AppUser, Contest, Game, MoneyRequest, Registration, Transaction,
} from '@/models/types';
import { SEED_GAMES } from '@/constants/games';
import { computeWinnings } from '@/constants/scoring';
import { buildSampleContests } from '@/services/sampleData';
import { Backend, ContestInput, JoinInput, ResultRow, Unsub, DepositProof, RecentWin } from '@/services/backendTypes';

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

  async isGoogleAvailable() {
    return false;
  }

  async signInWithGoogle(): Promise<void> {
    throw new Error('Google sign-in needs Supabase. Use email and password.');
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

  async createDeposit(user: AppUser, amount: number, proof?: DepositProof) {
    await addDoc(collection(db, 'deposits'), {
      userId: user.uid, username: user.username, amount, status: 'pending', createdAt: now(),
      proofUrl: proof?.proofUrl ?? '', utr: proof?.utr ?? '',
    } as Omit<MoneyRequest, 'id'>);
  }

  async createWithdrawal(user: AppUser, amount: number, payoutUpi?: string) {
    await addDoc(collection(db, 'withdrawals'), {
      userId: user.uid, username: user.username, amount, status: 'pending', createdAt: now(),
      payoutUpi: payoutUpi ?? '',
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

  // ---- admin: money requests ----
  async approveDeposit(req: MoneyRequest) {
    const userRef = doc(db, 'users', req.userId);
    await runTransaction(db, async (tx) => {
      const uSnap = await tx.get(userRef);
      if (!uSnap.exists()) throw new Error('User not found.');
      const u = uSnap.data() as AppUser;
      const balAfter = u.wallet.deposit + req.amount + u.wallet.winnings + u.wallet.bonus;
      tx.update(userRef, { 'wallet.deposit': increment(req.amount) });
      tx.update(doc(db, 'deposits', req.id), { status: 'approved' });
      tx.set(doc(collection(db, 'transactions')), {
        userId: req.userId, type: 'credit', amount: req.amount, walletType: 'deposit',
        description: 'Deposit approved', balanceAfter: balAfter, createdAt: now(),
      } as Omit<Transaction, 'id'>);
    });
  }

  async rejectDeposit(req: MoneyRequest) {
    await setDoc(doc(db, 'deposits', req.id), { status: 'rejected' }, { merge: true });
  }

  async approveWithdrawal(req: MoneyRequest) {
    await setDoc(doc(db, 'withdrawals', req.id), { status: 'approved' }, { merge: true });
  }

  async rejectWithdrawal(req: MoneyRequest) {
    const userRef = doc(db, 'users', req.userId);
    await runTransaction(db, async (tx) => {
      const uSnap = await tx.get(userRef);
      if (uSnap.exists()) {
        const u = uSnap.data() as AppUser;
        const balAfter = u.wallet.deposit + u.wallet.winnings + req.amount + u.wallet.bonus;
        tx.update(userRef, { 'wallet.winnings': increment(req.amount) });
        tx.set(doc(collection(db, 'transactions')), {
          userId: req.userId, type: 'credit', amount: req.amount, walletType: 'winnings',
          description: 'Withdrawal rejected — refund', balanceAfter: balAfter, createdAt: now(),
        } as Omit<Transaction, 'id'>);
      }
      tx.update(doc(db, 'withdrawals', req.id), { status: 'rejected' });
    });
  }

  // ---- admin: catalog ----
  watchAllContests(cb: (c: Contest[]) => void): Unsub {
    return onSnapshot(query(collection(db, 'contests'), orderBy('createdAt', 'desc')), (s) =>
      cb(docsTo<Contest>(s)));
  }

  async createContest(input: ContestInput) {
    await addDoc(collection(db, 'contests'), {
      ...input, filledSlots: 0, status: 'upcoming', roomId: '', roomPassword: '', createdAt: now(),
    } as Omit<Contest, 'id'>);
  }

  async updateContest(id: string, patch: Partial<Contest>) {
    await setDoc(doc(db, 'contests', id), patch, { merge: true });
  }

  async deleteContest(id: string) {
    await deleteDoc(doc(db, 'contests', id));
  }

  // ---- admin: users ----
  watchUsers(cb: (u: AppUser[]) => void): Unsub {
    return onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (s) =>
      cb(docsTo<AppUser>(s)));
  }

  async setUserRole(uid: string, role: AppUser['role']) {
    await setDoc(doc(db, 'users', uid), { role }, { merge: true });
  }

  async setUserBanned(uid: string, banned: boolean) {
    await setDoc(doc(db, 'users', uid), { banned }, { merge: true });
  }

  // ---- admin: notifications ----
  async sendNotification(title: string, body: string) {
    await addDoc(collection(db, 'notifications'), { title, body, createdAt: now() } as Omit<AppNotification, 'id'>);
  }

  // ---- staff/admin: match management ----
  async setRoomCredentials(contestId: string, roomId: string, roomPassword: string, status?: Contest['status']) {
    await setDoc(doc(db, 'contests', contestId),
      { roomId, roomPassword, ...(status ? { status } : {}) }, { merge: true });
  }

  async declareResults(contestId: string, results: ResultRow[]) {
    const cSnap = await getDoc(doc(db, 'contests', contestId));
    if (!cSnap.exists()) throw new Error('Contest not found.');
    const contest = cSnap.data() as Contest;

    for (const r of results) {
      const regRef = doc(db, 'registrations', r.registrationId);
      const regSnap = await getDoc(regRef);
      if (!regSnap.exists()) continue;
      const reg = regSnap.data() as Registration;
      const won = computeWinnings(r.placement, r.kills, contest.perKill, contest.prizeBreakdown);

      await runTransaction(db, async (tx) => {
        tx.update(regRef, { kills: r.kills, placement: r.placement, wonAmount: won });
        const userRef = doc(db, 'users', reg.userId);
        const uSnap = await tx.get(userRef);
        if (uSnap.exists()) {
          const u = uSnap.data() as AppUser;
          tx.update(userRef, { 'stats.kills': increment(r.kills) });
          if (won > 0) {
            const balAfter = u.wallet.deposit + u.wallet.winnings + won + u.wallet.bonus;
            tx.update(userRef, { 'wallet.winnings': increment(won), 'stats.earnings': increment(won) });
            tx.set(doc(collection(db, 'transactions')), {
              userId: reg.userId, type: 'credit', amount: won, walletType: 'winnings',
              description: `Won ${contest.title}`, balanceAfter: balAfter, createdAt: now(),
            } as Omit<Transaction, 'id'>);
          }
        }
      });
    }
    await setDoc(doc(db, 'contests', contestId), { status: 'resulted' }, { merge: true });
  }

  async removeRegistration(reg: Registration) {
    await deleteDoc(doc(db, 'registrations', reg.id));
    await setDoc(doc(db, 'contests', reg.contestId), { filledSlots: increment(-1) }, { merge: true });
    if (reg.paidAmount > 0) {
      await setDoc(doc(db, 'users', reg.userId), { 'wallet.deposit': increment(reg.paidAmount) } as any, { merge: true });
      await addDoc(collection(db, 'transactions'), {
        userId: reg.userId, type: 'credit', amount: reg.paidAmount, walletType: 'deposit',
        description: 'Registration removed — refund', balanceAfter: 0, createdAt: now(),
      } as Omit<Transaction, 'id'>);
    }
  }

  async setResultProof(registrationId: string, proofUrl: string) {
    await updateDoc(doc(db, 'registrations', registrationId), { proofUrl });
  }

  async claimDailyBonus(): Promise<{ reward: number; streak: number }> {
    throw new Error('Daily bonus needs Supabase.');
  }

  watchRecentWins(cb: (w: RecentWin[]) => void): Unsub {
    // Firestore cannot join the contest title in one query and this build
    // is superseded by Supabase, so the feed stays empty here.
    cb([]);
    return () => {};
  }

  async uploadImage(localUri: string) {
    // Firebase Storage is not wired up in this build; the device URI is
    // kept so the flow still works for a single-device demo.
    return localUri;
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
