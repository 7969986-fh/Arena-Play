import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Set once the intro has been seen, so it never shows again. */
export const ONBOARDED_KEY = 'arenaplay.onboarded';

interface OnboardingState {
  /** undefined until the stored flag has been read. */
  onboarded: boolean | undefined;
  /** Records the intro as seen, both on disk and in memory. */
  complete: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingState | undefined>(undefined);

/**
 * Holds whether the intro has been seen.
 *
 * This lives in shared state rather than being read straight from storage by
 * the router: writing the flag to disk does not tell a component already
 * mounted that it changed, so the router would keep acting on the value it
 * read at startup and bounce the player back into the intro.
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboarded, setOnboarded] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setOnboarded(v === '1'))
      // Unreadable storage should not trap a player in the intro forever.
      .catch(() => setOnboarded(true));
  }, []);

  const complete = useCallback(async () => {
    setOnboarded(true);
    await AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
  }, []);

  return (
    <OnboardingContext.Provider value={{ onboarded, complete }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
