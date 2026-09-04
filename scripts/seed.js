/**
 * Seed the Firestore database with games and sample contests.
 *
 * Usage:
 *   1. Fill real keys into lib/firebaseConfig.ts
 *   2. node scripts/seed.js
 *
 * Uses the Firebase Web SDK (works in Node). Only needed for the Firebase
 * backend — the local/offline backend seeds itself automatically on first run.
 */
const path = require('path');

async function main() {
  // Lazy import so a missing firebase install gives a clear message.
  let initializeApp, getFirestore, doc, setDoc;
  try {
    ({ initializeApp } = require('firebase/app'));
    ({ getFirestore, doc, setDoc } = require('firebase/firestore'));
  } catch {
    console.error('firebase is not installed. Run `npm install` first.');
    process.exit(1);
  }

  // Read the app's firebase config (transpile-free values only).
  const cfgPath = path.join(__dirname, '..', 'lib', 'firebaseConfig.ts');
  const raw = require('fs').readFileSync(cfgPath, 'utf8');
  const pick = (k) => (raw.match(new RegExp(`${k}:\\s*'([^']+)'`)) || [])[1];
  const firebaseConfig = {
    apiKey: pick('apiKey'),
    authDomain: pick('authDomain'),
    projectId: pick('projectId'),
    storageBucket: pick('storageBucket'),
    messagingSenderId: pick('messagingSenderId'),
    appId: pick('appId'),
  };
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('YOUR_')) {
    console.error('Firebase not configured. Edit lib/firebaseConfig.ts with real keys first.');
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const now = Date.now();
  const HOUR = 3600000;
  const games = [
    { id: 'br-survival', name: 'BR SURVIVAL', mode: 'Battle Royale', order: 1 },
    { id: 'br-full-map', name: 'BR FULL MAP', mode: 'Battle Royale', order: 2 },
    { id: 'clash-squad-1v1', name: 'CLASH SQUAD 1vs1', mode: 'Clash Squad', order: 3 },
    { id: 'lone-wolf-1v1', name: 'LONE WOLF 1vs1', mode: 'Lone Wolf', order: 4 },
    { id: 'lone-wolf-2v2', name: 'LONE WOLF 2vs2', mode: 'Lone Wolf', order: 5 },
    { id: 'cs-headshot', name: 'CS HEADSHOT', mode: 'Clash Squad', order: 6 },
    { id: 'free-matches', name: 'FREE MATCHES', mode: 'Free', order: 7 },
  ];
  for (const g of games) {
    await setDoc(doc(db, 'games', g.id), { ...g, image: '', active: true }, { merge: true });
  }

  const contest = (gameId, title, entryFee, prizePool, slots, inH, status) => ({
    gameId, title, mode: 'solo', map: 'Bermuda',
    matchType: entryFee > 0 ? 'paid' : 'free',
    entryFee, prizePool, perKill: 0, totalSlots: slots, filledSlots: 0,
    schedule: now + inH * HOUR, status,
    roomId: '', roomPassword: '',
    prizeBreakdown: [
      { rank: 1, amount: Math.round(prizePool * 0.4) },
      { rank: 2, amount: Math.round(prizePool * 0.25) },
      { rank: 3, amount: Math.round(prizePool * 0.15) },
    ],
    rules: 'No teaming. No hacks. Screen recording mandatory.',
    createdAt: now,
  });
  const contests = [
    contest('br-survival', 'BR SURVIVAL PRO LOBBY', 11, 200, 20, 6, 'upcoming'),
    contest('br-survival', 'BR SURVIVAL FREE PRACTICE', 0, 50, 12, 12, 'upcoming'),
    contest('cs-headshot', 'CS HEADSHOT KING', 20, 300, 8, 3, 'upcoming'),
  ];
  let i = 0;
  for (const c of contests) {
    await setDoc(doc(db, 'contests', `seed-${now}-${i++}`), c, { merge: true });
  }

  console.log(`Seeded ${games.length} games and ${contests.length} contests.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
