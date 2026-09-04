import { Contest, ContestMode, MatchType } from '@/models/types';

const now = () => Date.now();
const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 8);
const HOUR = 3600_000;

function prize(pool: number) {
  return [
    { rank: 1, amount: Math.round(pool * 0.35) },
    { rank: 2, amount: Math.round(pool * 0.2) },
    { rank: 3, amount: Math.round(pool * 0.12) },
    { rank: 4, amount: Math.round(pool * 0.1) },
    { rank: 5, amount: Math.round(pool * 0.08) },
  ];
}

interface Spec {
  gameId: string;
  title: string;
  mode: ContestMode;
  map: string;
  matchType: MatchType;
  entryFee: number;
  prizePool: number;
  perKill: number;
  totalSlots: number;
  filled: number;
  inHours: number;
  status: Contest['status'];
}

const SPECS: Spec[] = [
  { gameId: 'br-survival', title: 'BR SURVIVAL (SNIPER + PRECISE AIM OFF) — VEHICLE ON', mode: 'solo', map: 'Bermuda', matchType: 'paid', entryFee: 11, prizePool: 200, perKill: 0, totalSlots: 20, filled: 13, inHours: 6, status: 'upcoming' },
  { gameId: 'br-survival', title: 'BR SURVIVAL PRO LOBBY — FULL MAP', mode: 'solo', map: 'Purgatory', matchType: 'paid', entryFee: 25, prizePool: 400, perKill: 5, totalSlots: 48, filled: 30, inHours: 2, status: 'ongoing' },
  { gameId: 'br-survival', title: 'BR SURVIVAL FREE PRACTICE', mode: 'squad', map: 'Bermuda', matchType: 'free', entryFee: 0, prizePool: 50, perKill: 0, totalSlots: 12, filled: 4, inHours: 12, status: 'upcoming' },
  { gameId: 'clash-squad-1v1', title: 'CS HEADSHOT SKILL OFF 1vs1', mode: 'solo', map: 'Clash Arena', matchType: 'paid', entryFee: 15, prizePool: 28, perKill: 0, totalSlots: 2, filled: 1, inHours: 1, status: 'upcoming' },
  { gameId: 'lone-wolf-1v1', title: 'LONE WOLF 1vs1 — PER KILL', mode: 'solo', map: 'Bermuda', matchType: 'paid', entryFee: 6, prizePool: 20, perKill: 10, totalSlots: 2, filled: 0, inHours: 3, status: 'upcoming' },
  { gameId: 'cs-headshot', title: 'CS HEADSHOT KING — HEADSHOT ONLY', mode: 'duo', map: 'Clash Arena', matchType: 'paid', entryFee: 20, prizePool: 300, perKill: 0, totalSlots: 8, filled: 8, inHours: -2, status: 'resulted' },
  { gameId: 'free-matches', title: 'FREE TOURNAMENT — DAILY', mode: 'squad', map: 'Bermuda', matchType: 'free', entryFee: 0, prizePool: 100, perKill: 0, totalSlots: 12, filled: 6, inHours: 8, status: 'upcoming' },
];

export function buildSampleContests(): Contest[] {
  const t = now();
  return SPECS.map((s) => ({
    id: uid(),
    gameId: s.gameId,
    title: s.title,
    mode: s.mode,
    map: s.map,
    matchType: s.matchType,
    entryFee: s.entryFee,
    prizePool: s.prizePool,
    perKill: s.perKill,
    totalSlots: s.totalSlots,
    filledSlots: s.filled,
    schedule: t + s.inHours * HOUR,
    status: s.status,
    roomId: s.status === 'ongoing' ? '48213377' : '',
    roomPassword: s.status === 'ongoing' ? 'arena123' : '',
    prizeBreakdown: prize(s.prizePool),
    rules: 'No teaming. No hacks. Screen recording mandatory.',
    createdAt: t,
  }));
}
