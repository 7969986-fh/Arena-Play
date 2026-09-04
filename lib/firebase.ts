import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is not in the web type surface but exists in the RN bundle
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

/**
 * Single Firebase entry point.
 * Fill in real keys in ./firebaseConfig.ts (copy from firebaseConfig.example.ts)
 * to run against your own project.
 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized (fast refresh) — fall back to getAuth.
  auth = getAuth(app);
}

export const firebaseAuth = auth;
export const db = getFirestore(app);
export { isFirebaseConfigured };
export default app;
