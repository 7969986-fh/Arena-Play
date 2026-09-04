# Arena Play 🎮

A **Free Fire esports contest** mobile app built with **React Native (Expo)** and **TypeScript**. Players browse esports games, join paid/free contests with **virtual coins**, get room codes, and climb the leaderboard. Features a soft, light, 3D-styled UI with smooth animations.

> Phase 1 (this build) delivers the full **core player flow** end-to-end. Admin & staff panels are scaffolded with role gating and land fully in Phase 2.

## Features (Phase 1)

- **Auth** — email/password sign up & sign in
- **Home** — esports games grid, promo banner, "My Matches" shortcuts
- **Contests** — per game, split into Ongoing / Upcoming / Resulted
- **Contest details** — live countdown, prize breakdown, rules, room credentials (once joined & live)
- **Join flow** — pick a match slot, enter in-game name, pay the entry fee (atomic wallet deduction)
- **Wallet** — deposit / winnings / bonus balances, recharge, withdraw, transaction history
- **Leaderboard** — Weekly / Monthly / Fulltime
- **Refer & Earn**, **My Statistics**, **Profile**, **Notifications**, FAQ / About / Privacy / Contact
- **Role gating** — `player` / `staff` / `admin`; staff & admin see extra panels in the menu

## Tech Stack

- Expo (React Native) + TypeScript + **Expo Router** (file-based navigation)
- **Firebase** (Auth + Firestore) when configured
- **Offline local backend** (AsyncStorage) as a fallback so the app is fully usable and testable without any cloud setup
- `react-native-reanimated` for animations, `expo-linear-gradient` for the 3D gradients

## Running the app

```bash
npm install
npx expo start
```

Open in **Expo Go** (scan the QR) or an Android/iOS emulator.

By default the app runs in **offline demo mode** using a local AsyncStorage backend — you can register, join contests, recharge (auto-approved in demo) and browse everything immediately. Local demo deposits are auto-approved for convenience.

## Going live with Firebase

1. Create a free Firebase project → add a **Web app** → copy the SDK config.
2. Paste the values into `lib/firebaseConfig.ts` (replace the `YOUR_*` placeholders).
3. Enable **Email/Password** auth and create a **Firestore** database.
4. Seed the catalog: `npm run seed`.
5. Restart the app — it now uses Firebase automatically.

To make a user an **admin** or **staff**, set their `role` field to `"admin"` / `"staff"` in the `users` collection.

## Project structure

```
app/            Screens & routes (Expo Router)
  (auth)/       login, register
  (tabs)/       home, earn, leaderboard, menu
  game/[id]     contests for a game
  contest/[id]  details + join
  wallet/       wallet, recharge, withdraw
  admin/ staff/ role-gated panels (Phase 2)
components/      UI kit (Button, Card, Input, Coin, …) + feature cards
constants/       theme, scoring, games catalog
hooks/           useAuth, data hooks
services/        backend abstraction (local + firebase adapters)
models/          TypeScript types
utils/           formatting helpers
```

## Notes

- Coins are **virtual** — there is no real-money payment gateway in this build. Real payments (and full admin/staff tooling) are planned for Phase 2.
- Real-money gaming is regulated in many regions; keep the virtual-coin model unless you have the appropriate licenses and compliance in place.
