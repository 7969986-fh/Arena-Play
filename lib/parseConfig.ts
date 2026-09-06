/**
 * Back4App (Parse Server) connection.
 *
 * Both values come from one screen in the Back4App dashboard:
 * App Settings → Security & Keys. They are client keys and are meant to ship
 * inside the app; what an app is allowed to do is decided by class-level
 * permissions and the Cloud Code in `cloud/main.js`, not by hiding these.
 *
 * Never put the Master Key here — that one bypasses every permission check.
 */
export const parseConfig = {
  appId: 'bdZdjfvg21Km30XVv8WIDP7sXAUxePVgmnreKvdr',
  javascriptKey: 'KXcxBAgqRpCtTENWQHZzY9olo44RffKOzruJXyNX',
  serverURL: 'https://parseapi.back4app.com/',
  liveQueryURL: 'wss://arena-play.back4app.io',
};

export const isParseConfigured =
  !!parseConfig.appId && !parseConfig.appId.startsWith('YOUR_');
