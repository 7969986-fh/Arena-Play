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
- **Back4App / Parse Server** (database + auth + LiveQuery + file storage) when configured
- **Offline local backend** (AsyncStorage) as a fallback so the app is fully usable and testable without any cloud setup
- `react-native-reanimated` for animations, `expo-linear-gradient` for the 3D gradients

## Running the app

```bash
npm install
npx expo start
```

Open in **Expo Go** (scan the QR) or an Android/iOS emulator.

By default the app runs in **offline demo mode** using a local AsyncStorage backend — you can register, join contests, recharge (auto-approved in demo) and browse everything immediately. Local demo deposits are auto-approved for convenience.

## Going live with Back4App

The app runs fully offline until you connect a backend. Connecting takes
about three minutes and needs no credit card.

1. **Create the app.** Go to [back4app.com](https://www.back4app.com), sign
   up, then **Build new app → Backend as a Service**, name it `Arena Play`,
   and create it.
2. **Copy your keys.** Left sidebar → **App Settings → Security & Keys**.
   Copy the **Application ID** and the **JavaScript Key** into
   `lib/parseConfig.ts`. Both are client keys and are meant to ship inside
   the app. **Never** put the Master Key there — it bypasses every
   permission check.
3. **Deploy the server rules.** Left sidebar → **Cloud Code → Functions &
   Web Hosting**. Open `main.js`, paste in all of `cloud/main.js` from this
   repo, and click **Deploy**.

That is the whole setup — there are no tables to create and no email
confirmation to turn off. Classes are created on first write, and the game
catalog seeds itself the first time the app connects.

Then set your own values in `constants/app.ts` — the UPI ID deposits are
paid to, your support contacts, and the APK download link.

### Making yourself admin

**The first account you create becomes the admin automatically.** Sign up in
the app before sharing it with anyone else.

To promote someone later, use the admin panel's user list, or run this once
from Back4App → **API Console → Cloud Code**:

```js
Parse.Cloud.run('setUserRole', { userId: '<their id>', role: 'admin' });
```

Use `'staff'` for people who only run matches.

### How the money is protected

Wallet balances are never writable from the app. Joining a contest,
approving a deposit, requesting a withdrawal and declaring results each run
as a Cloud Code function that does its own permission check, and
`beforeSave` / `beforeDelete` hooks reject any write that did not come from
the server. Slot claims and balance changes are re-checked server-side, so
two players cannot take the same slot or overdraw one balance.

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
