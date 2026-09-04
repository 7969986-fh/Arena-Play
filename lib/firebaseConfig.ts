/**
 * Firebase project configuration.
 *
 * Replace these placeholder values with the config from your own Firebase
 * project (Project settings → General → Your apps → Web app / SDK setup).
 * Until real keys are provided, `isFirebaseConfigured` is false and the app
 * shows a friendly "connect Firebase" notice instead of crashing.
 */
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');
