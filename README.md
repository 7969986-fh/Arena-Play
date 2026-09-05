# Arena Play 🎮

A **Free Fire esports contest** mobile app built with **React Native (Expo)** and **TypeScript**. Players browse esports games, join paid/free contests with **virtual coins**, get room codes, and climb the leaderboard. Features a soft, light, 3D-styled UI with smooth animations.

> Phase 1 delivers the full **core player flow**. **Phase 2 (done)** adds the full **admin & staff panels**.

## 📱 Download the APK

**[⬇️ Download the latest APK](https://github.com/7969986-fh/Arena-Play/releases/latest)** — open this on your Android phone, tap the `.apk`, and allow "install from unknown sources" if prompted.

### Building a new APK (no tools needed)

Every push builds an APK automatically. To build one on demand:

1. Go to the **Actions** tab
2. Click **Build APK** in the left sidebar
3. Click **Run workflow** → **Run workflow**
4. Wait ~12 minutes, then grab it from [Releases](https://github.com/7969986-fh/Arena-Play/releases)

The build runs entirely on GitHub's servers — no Android Studio, Node, or Expo account required. The APK is signed with a debug key, which is fine for installing and sharing but **not** for Play Store upload (that needs a real keystore).

## Player features

- **Auth** — email/password sign up & sign in (new players get a welcome bonus)
- **Home** — esports games grid, promo banner, "My Matches" shortcuts
- **Contests** — per game, split into Ongoing / Upcoming / Resulted
- **Contest details** — live countdown, prize breakdown, rules, room credentials (once joined & live)
- **Join flow** — pick a match slot, enter in-game name, pay the entry fee (atomic wallet deduction)
- **Wallet** — deposit / winnings / bonus balances, recharge, withdraw, transaction history
- **Leaderboard** — Weekly / Monthly / Fulltime
- **Refer & Earn**, **My Statistics**, **Profile**, **Notifications**, FAQ / About / Privacy / Contact
- **Role gating** — `player` / `staff` / `admin`; staff & admin see extra panels in the menu

## Admin panel (Phase 2)

- **Manage contests** — create (with auto prize split), edit, delete
- **Deposits** — approve/reject recharge requests (approval credits the player's wallet)
- **Withdrawals** — approve (mark paid) or reject (refunds held winnings)
- **Manage users** — cycle roles (player → staff → admin), ban/unban
- **Send notifications** — broadcast announcements to all players
- Live dashboard with pending counts

## Staff panel (Phase 2)

- Browse contests and open the **Manage Match** screen to:
  - **Share room ID & password** and set the match live
  - **Enter results** (kills + placement per player) and **declare** — distributes prizes to winners' wallets and updates stats
  - **Moderate** — remove a player (refunds their entry fee, frees the slot)

## Demo logins (offline mode)

The offline backend seeds two staff accounts so you can try the panels immediately:

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | `admin@arena.test`  | `admin123` |
| Staff | `staff@arena.test`  | `admin123` |

> On native (Android/iOS) confirmation dialogs (logout, declare results, ban, delete) use the OS alert. On the web preview those confirm callbacks are a no-op — use a device/emulator for those actions.

## Tech Stack

- Expo (React Native) + TypeScript + **Expo Router** (file-based navigation)
- **Supabase** (Postgres + Auth + Realtime + Storage) when configured
- **Offline local backend** (AsyncStorage) as a fallback so the app is fully usable and testable without any cloud setup
- `react-native-reanimated` for animations, `expo-linear-gradient` for the 3D gradients

## Running the app

```bash
npm install
npx expo start
```

Open in **Expo Go** (scan the QR) or an Android/iOS emulator.

By default the app runs in **offline demo mode** using a local AsyncStorage backend — you can register, join contests, recharge (auto-approved in demo) and browse everything immediately. Local demo deposits are auto-approved for convenience.

## Going live with Supabase

The app ships pointed at a Supabase project. Two setup steps are needed
before it works:

1. **Create the database.** Open your project → **SQL Editor** → New query,
   paste all of `supabase/schema.sql`, and Run. This creates every table,
   the security policies, the storage bucket and the nine game modes.
2. **Enable email sign-in.** Authentication → Providers → Email. For testing,
   turn *off* "Confirm email" so accounts work immediately.

Then set your own values in `constants/app.ts` — the UPI ID deposits are
paid to, your support contacts, and the APK download link.

### Optional: Google sign-in

The Google button only appears once the provider is enabled — until then the
app shows email sign-in alone, so nothing looks broken.

1. In **Google Cloud Console** → APIs & Services → Credentials, create an
   **OAuth client ID** of type *Web application*.
2. Add this to **Authorized redirect URIs**, using your own project ref:
   `https://<your-ref>.supabase.co/auth/v1/callback`
3. In Supabase → **Authentication → Providers → Google**, paste the client ID
   and client secret, and enable it.
4. In Supabase → **Authentication → URL Configuration**, add `arenaplay://` to
   **Redirect URLs** so the app can catch the sign-in coming back.

### Making yourself admin

Sign up in the app first, then in the SQL Editor run:

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

Use `'staff'` for people who only run matches.

### How the money is protected

Wallet balances are never writable from the app. Joining a contest,
approving a deposit, requesting a withdrawal and declaring results each run
as a database function that does its own permission check, and row-level
security blocks direct writes. Slots use a uniqueness constraint plus a row
lock, so two players cannot claim the same slot or overdraw one balance.

The publishable key in `lib/supabaseConfig.ts` is meant to ship in the app —
it only grants what those policies allow. Never put the **secret** /
service-role key in the app; that one bypasses security entirely.

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
