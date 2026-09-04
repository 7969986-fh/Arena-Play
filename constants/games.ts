import { Game } from '@/models/types';

/** Seed catalog of esports game categories. */
export const SEED_GAMES: Game[] = [
  { id: 'br-survival', name: 'BR SURVIVAL', image: '', mode: 'Battle Royale', order: 1, active: true, activeContests: 0 },
  { id: 'br-full-map', name: 'BR FULL MAP', image: '', mode: 'Battle Royale', order: 2, active: true, activeContests: 0 },
  { id: 'clash-squad-1v1', name: 'CLASH SQUAD 1vs1', image: '', mode: 'Clash Squad', order: 3, active: true, activeContests: 0 },
  { id: 'lone-wolf-1v1', name: 'LONE WOLF 1vs1', image: '', mode: 'Lone Wolf', order: 4, active: true, activeContests: 0 },
  { id: 'lone-wolf-2v2', name: 'LONE WOLF 2vs2', image: '', mode: 'Lone Wolf', order: 5, active: true, activeContests: 0 },
  { id: 'cs-headshot', name: 'CS HEADSHOT', image: '', mode: 'Clash Squad', order: 6, active: true, activeContests: 0 },
  { id: 'free-matches', name: 'FREE MATCHES', image: '', mode: 'Free', order: 7, active: true, activeContests: 0 },
  { id: 'cs-headshot-2v2', name: 'CS HEADSHOT 2 VS 2', image: '', mode: 'Clash Squad', order: 8, active: true, activeContests: 0 },
  { id: 'clash-squad-2v2', name: 'CLASH SQUAD 2 VS 2', image: '', mode: 'Clash Squad', order: 9, active: true, activeContests: 0 },
];

/** Deterministic banner gradient per game for the 3D card look. */
export const GAME_GRADIENTS: Record<string, readonly [string, string]> = {
  'br-survival': ['#7C4DFF', '#4A1E9E'],
  'br-full-map': ['#1F2A44', '#0B1020'],
  'clash-squad-1v1': ['#1E90FF', '#0A4DA6'],
  'lone-wolf-1v1': ['#C1121F', '#6A0000'],
  'lone-wolf-2v2': ['#2E7D32', '#14401A'],
  'cs-headshot': ['#3949AB', '#1A237E'],
  'free-matches': ['#00897B', '#004D40'],
  'cs-headshot-2v2': ['#AD1457', '#560027'],
  'clash-squad-2v2': ['#EF6C00', '#A34000'],
};

export function gameGradient(id: string): readonly [string, string] {
  return GAME_GRADIENTS[id] ?? (['#0FB89B', '#0A9A82'] as const);
}
