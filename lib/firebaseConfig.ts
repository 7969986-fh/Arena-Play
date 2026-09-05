/**
 * Firebase project configuration.
 *
 * Replace these placeholder values with the config from your own Firebase
 * project (Project settings → General → Your apps → Web app / SDK setup).
 * Until real keys are provided, `isFirebaseConfigured` is false and the app
 * shows a friendly "connect Firebase" notice instead of crashing.
 */
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',                      // ← need from web app
  authDomain: 'arena-play-885d7.firebaseapp.com',
  projectId: 'arena-play-885d7',
  storageBucket: 'arena-play-885d7.appspot.com',
  messagingSenderId: '858917302261',
  appId: 'YOUR_WEB_APP_ID',                    // ← need from web app
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');
