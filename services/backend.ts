import { isFirebaseConfigured } from '@/lib/firebaseConfig';
import { Backend } from '@/services/backendTypes';
import { localBackend } from '@/services/localBackend';

/**
 * Selects the active backend. Firebase when configured with real keys,
 * otherwise the local offline store so the app is fully usable during
 * development and demos.
 */
let selected: Backend = localBackend;

if (isFirebaseConfigured) {
  // Lazy require so Firebase only initializes when actually configured.
  const { firebaseBackend } = require('@/services/firebaseBackend');
  selected = firebaseBackend;
}

export const backend = selected;
export const backendKind = selected.kind;
