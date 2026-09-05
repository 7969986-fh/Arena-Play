import { ImageSourcePropType } from 'react-native';

/**
 * Metro resolves `require` at build time, so every asset needs a literal path
 * here rather than a path built from the game id at runtime.
 */
const GAME_ART: Record<string, ImageSourcePropType> = {
  'br-survival': require('@/assets/games/br-survival.png'),
  'br-full-map': require('@/assets/games/br-full-map.png'),
  'clash-squad-1v1': require('@/assets/games/clash-squad-1v1.png'),
  'lone-wolf-1v1': require('@/assets/games/lone-wolf-1v1.png'),
  'lone-wolf-2v2': require('@/assets/games/lone-wolf-2v2.png'),
  'cs-headshot': require('@/assets/games/cs-headshot.png'),
  'free-matches': require('@/assets/games/free-matches.png'),
  'cs-headshot-2v2': require('@/assets/games/cs-headshot-2v2.png'),
  'clash-squad-2v2': require('@/assets/games/clash-squad-2v2.png'),
};

/** Artwork for a game card. Falls back to BR Survival for unknown ids. */
export function gameArt(id: string): ImageSourcePropType {
  return GAME_ART[id] ?? GAME_ART['br-survival'];
}

export interface Promo {
  id: string;
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
  /** Route opened when the banner is tapped. */
  href: string;
}

export const PROMOS: Promo[] = [
  {
    id: 'welcome',
    image: require('@/assets/promo/promo-welcome.png'),
    title: 'Welcome Bonus',
    subtitle: '25 coins credited on sign up',
    href: '/wallet',
  },
  {
    id: 'daily',
    image: require('@/assets/promo/promo-daily.png'),
    title: 'Daily Matches',
    subtitle: 'New contests every few hours',
    href: '/(tabs)',
  },
  {
    id: 'refer',
    image: require('@/assets/promo/promo-refer.png'),
    title: 'Refer & Earn',
    subtitle: 'Invite friends, earn coins',
    href: '/(tabs)/earn',
  },
];
