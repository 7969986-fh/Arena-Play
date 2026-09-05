import { UserStats } from '@/models/types';

/**
 * Levels and badges, derived entirely from stats the app already records.
 *
 * Nothing here is stored: a player's level and badges are recomputed from
 * matches, kills and earnings whenever they are shown. That means there is
 * no second copy of progression to drift out of step with the real numbers,
 * and no way to award XP that the underlying stats do not justify.
 */

/** XP weights. Winning is worth far more than turning up. */
const XP_PER_MATCH = 10;
const XP_PER_KILL = 5;
const XP_PER_RUPEE_WON = 2;

export function xpOf(stats?: UserStats): number {
  if (!stats) return 0;
  return (
    stats.matchesPlayed * XP_PER_MATCH +
    stats.kills * XP_PER_KILL +
    stats.earnings * XP_PER_RUPEE_WON
  );
}

export interface Rank {
  level: number;
  title: string;
  colour: string;
}

/** Rank titles, chosen so early levels come quickly and later ones don't. */
const TIERS: { min: number; title: string; colour: string }[] = [
  { min: 0, title: 'Rookie', colour: '#8A9A97' },
  { min: 150, title: 'Fighter', colour: '#4B9FE1' },
  { min: 500, title: 'Challenger', colour: '#0FB89B' },
  { min: 1200, title: 'Elite', colour: '#7C4DFF' },
  { min: 2500, title: 'Master', colour: '#EF6C00' },
  { min: 5000, title: 'Grandmaster', colour: '#C1121F' },
  { min: 10000, title: 'Legend', colour: '#FFC107' },
];

/** Level is XP on a widening curve, so progress never fully stalls. */
export function rankOf(stats?: UserStats): Rank {
  const xp = xpOf(stats);
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 40)) + 1);
  const tier = [...TIERS].reverse().find((t) => xp >= t.min) ?? TIERS[0];
  return { level, title: tier.title, colour: tier.colour };
}

/** XP earned into the current level, and what the next one costs. */
export function levelProgress(stats?: UserStats) {
  const xp = xpOf(stats);
  const level = rankOf(stats).level;
  const floor = Math.pow(level - 1, 2) * 40;
  const ceiling = Math.pow(level, 2) * 40;
  return {
    xp,
    into: Math.max(0, xp - floor),
    needed: Math.max(1, ceiling - floor),
    fraction: Math.min(1, Math.max(0, (xp - floor) / (ceiling - floor))),
  };
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
}

/** Milestones a player can unlock, in the order they are shown. */
export function badgesOf(stats?: UserStats): Badge[] {
  const s = stats ?? { matchesPlayed: 0, kills: 0, earnings: 0 };
  const def = (
    id: string,
    label: string,
    description: string,
    icon: string,
    earned: boolean,
  ): Badge => ({ id, label, description, icon, earned });

  return [
    def('first-match', 'First Drop', 'Play your first match', '🪂', s.matchesPlayed >= 1),
    def('ten-matches', 'Regular', 'Play 10 matches', '🎮', s.matchesPlayed >= 10),
    def('fifty-matches', 'Veteran', 'Play 50 matches', '🎖️', s.matchesPlayed >= 50),
    def('first-kill', 'First Blood', 'Get your first kill', '🩸', s.kills >= 1),
    def('fifty-kills', 'Sharpshooter', 'Get 50 kills', '🎯', s.kills >= 50),
    def('two-fifty-kills', 'Deadeye', 'Get 250 kills', '💀', s.kills >= 250),
    def('first-win', 'Winner', 'Win your first prize', '🏆', s.earnings >= 1),
    def('earn-500', 'Earner', 'Win ₹500 in total', '💰', s.earnings >= 500),
    def('earn-5000', 'Champion', 'Win ₹5,000 in total', '👑', s.earnings >= 5000),
  ];
}
