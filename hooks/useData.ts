import { useEffect, useState } from 'react';
import {
  AppNotification, AppUser, Contest, Game, MoneyRequest, Registration, Transaction,
} from '@/models/types';
import { backend } from '@/services/backend';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => backend.watchGames((g) => { setGames(g); setLoading(false); }), []);
  return { games, loading };
}

export function useContests(gameId: string) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!gameId) return;
    return backend.watchContests(gameId, (c) => { setContests(c); setLoading(false); });
  }, [gameId]);
  return { contests, loading };
}

export function useContest(id: string) {
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    return backend.watchContest(id, (c) => { setContest(c); setLoading(false); });
  }, [id]);
  return { contest, loading };
}

export function useContestRegistrations(contestId: string) {
  const [regs, setRegs] = useState<Registration[]>([]);
  useEffect(() => {
    if (!contestId) return;
    return backend.watchContestRegistrations(contestId, setRegs);
  }, [contestId]);
  return regs;
}

export function useUserRegistrations(uid: string | null) {
  const [regs, setRegs] = useState<Registration[]>([]);
  useEffect(() => {
    if (!uid) { setRegs([]); return; }
    return backend.watchUserRegistrations(uid, setRegs);
  }, [uid]);
  return regs;
}

export function useTransactions(uid: string | null) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  useEffect(() => {
    if (!uid) { setTxns([]); return; }
    return backend.watchTransactions(uid, setTxns);
  }, [uid]);
  return txns;
}

export function useLeaderboard() {
  const [users, setUsers] = useState<AppUser[]>([]);
  useEffect(() => backend.watchLeaderboard(setUsers), []);
  return users;
}

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  useEffect(() => backend.watchNotifications(setItems), []);
  return items;
}

export function useDeposits() {
  const [items, setItems] = useState<MoneyRequest[]>([]);
  useEffect(() => backend.watchDeposits(setItems), []);
  return items;
}

export function useWithdrawals() {
  const [items, setItems] = useState<MoneyRequest[]>([]);
  useEffect(() => backend.watchWithdrawals(setItems), []);
  return items;
}
