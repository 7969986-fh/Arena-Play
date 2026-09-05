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
  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState<Registration[]>([]);
  useEffect(() => {
    if (!contestId) return;
    return backend.watchContestRegistrations(contestId, (v) => { setRegs(v); setLoading(false); });
  }, [contestId]);
  return { regs, loading };
}

export function useUserRegistrations(uid: string | null) {
  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState<Registration[]>([]);
  useEffect(() => {
    if (!uid) { setRegs([]); return; }
    return backend.watchUserRegistrations(uid, (v) => { setRegs(v); setLoading(false); });
  }, [uid]);
  return { regs, loading };
}

export function useTransactions(uid: string | null) {
  const [loading, setLoading] = useState(true);
  const [txns, setTxns] = useState<Transaction[]>([]);
  useEffect(() => {
    if (!uid) { setTxns([]); return; }
    return backend.watchTransactions(uid, (v) => { setTxns(v); setLoading(false); });
  }, [uid]);
  return { txns, loading };
}

export function useLeaderboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  useEffect(() => backend.watchLeaderboard((v) => { setUsers(v); setLoading(false); }), []);
  return { users, loading };
}

export function useNotifications() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AppNotification[]>([]);
  useEffect(() => backend.watchNotifications((v) => { setItems(v); setLoading(false); }), []);
  return { items, loading };
}

export function useAllContests() {
  const [loading, setLoading] = useState(true);
  const [contests, setContests] = useState<Contest[]>([]);
  useEffect(() => backend.watchAllContests((v) => { setContests(v); setLoading(false); }), []);
  return { contests, loading };
}

export function useUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  useEffect(() => backend.watchUsers((v) => { setUsers(v); setLoading(false); }), []);
  return { users, loading };
}

export function useDeposits() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MoneyRequest[]>([]);
  useEffect(() => backend.watchDeposits((v) => { setItems(v); setLoading(false); }), []);
  return { items, loading };
}

export function useWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MoneyRequest[]>([]);
  useEffect(() => backend.watchWithdrawals((v) => { setItems(v); setLoading(false); }), []);
  return { items, loading };
}
