import { isParseConfigured } from '@/lib/parseConfig';
import { isFirebaseConfigured } from '@/lib/firebaseConfig';
import { Backend } from '@/services/backendTypes';
import { localBackend } from '@/services/localBackend';

/**
 * Selects the active backend. Parse (Back4App) when configured, then
 * Firebase, otherwise the local offline store so the app stays fully usable
 * with no cloud setup at all.
 *
 * Requires are lazy so an unconfigured cloud SDK never initializes, and are
 * guarded because this module is loaded during app startup: a cloud adapter
 * that throws while loading (a missing native module, say) would otherwise
 * kill the app before React mounts, leaving no error to show. Falling back
 * to the offline store keeps the app openable and reports the reason.
 */
function pick(): Backend {
  if (isParseConfigured) {
    try {
      return require('@/services/parseBackend').parseBackend;
    } catch (e) {
      console.error('[backend] Parse adapter failed to load', e);
    }
  }
  if (isFirebaseConfigured) {
    try {
      return require('@/services/firebaseBackend').firebaseBackend;
    } catch (e) {
      console.error('[backend] Firebase adapter failed to load', e);
    }
  }
  return localBackend;
}

export const backend = pick();
export const backendKind = backend.kind;

/** True when a cloud backend was configured but could not be loaded. */
export const backendDegraded =
  (isParseConfigured || isFirebaseConfigured) && backend.kind === 'local';
