// ===========================================================================
// Arena Play — Back4App Cloud Code
//
// Paste this whole file into Back4App → Cloud Code → Functions → main.js,
// then click Deploy.
//
// Everything that touches money lives here. The app never writes a wallet
// balance itself: it calls these functions, which run on the server with the
// master key and check permissions first. A modified app therefore cannot
// credit its own coins, take a slot it did not pay for, or approve its own
// deposit.
// ===========================================================================

const MASTER = { useMasterKey: true };

const WELCOME_BONUS = 25;
const DAILY_REWARDS = [0, 2, 3, 5, 8, 12, 18, 25]; // index = streak day

/** Bonus coins earned by depositing this amount. Mirrors constants/app.ts. */
function depositBonus(amount) {
  if (amount >= 500) return 100;
  if (amount >= 300) return 60;
  if (amount >= 200) return 35;
  if (amount >= 100) return 15;
  if (amount >= 50) return 5;
  return 0;
}

/* ------------------------------------------------------------------ utils */

function requireUser(req) {
  if (!req.user) throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'Please sign in.');
  return req.user;
}

/** The Player row holding this user's wallet, stats and role. */
async function playerOf(userId) {
  const q = new Parse.Query('Player').equalTo('userId', userId);
  const p = await q.first(MASTER);
  if (!p) throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Profile not found.');
  return p;
}

async function requireRole(req, roles) {
  const user = requireUser(req);
  const player = await playerOf(user.id);
  if (!roles.includes(player.get('role'))) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'You do not have permission for that.');
  }
  return player;
}

const walletTotal = (w) => (w.deposit || 0) + (w.winnings || 0) + (w.bonus || 0);

/** Records a wallet movement so players can audit their own balance. */
async function logTxn(player, type, amount, walletType, description) {
  const Txn = Parse.Object.extend('Transaction');
  const t = new Txn();
  t.set('userId', player.get('userId'));
  t.set('type', type);
  t.set('amount', amount);
  t.set('walletType', walletType);
  t.set('description', description);
  t.set('balanceAfter', walletTotal(player.get('wallet')));
  await t.save(null, MASTER);
}

/* ------------------------------------------------------------- profile */

/**
 * Creates the Player row for a newly signed-up user.
 *
 * The very first account becomes the admin, so whoever sets the app up never
 * has to run a database query to grant themselves access. Everyone after
 * that is an ordinary player.
 */
Parse.Cloud.define('setupProfile', async (req) => {
  const user = requireUser(req);

  const existing = await new Parse.Query('Player').equalTo('userId', user.id).first(MASTER);
  if (existing) return { role: existing.get('role') };

  const playerCount = await new Parse.Query('Player').count(MASTER);
  const role = playerCount === 0 ? 'admin' : 'player';

  const Player = Parse.Object.extend('Player');
  const p = new Player();
  p.set('userId', user.id);
  p.set('username', req.params.displayName || user.get('email') || 'Player');
  p.set('email', user.get('email') || '');
  p.set('role', role);
  p.set('wallet', { deposit: 0, winnings: 0, bonus: WELCOME_BONUS });
  p.set('stats', { matchesPlayed: 0, kills: 0, earnings: 0 });
  // Denormalised for the leaderboard, which cannot sort inside a JSON field.
  p.set('earnings', 0);
  p.set('referralCode', user.id.slice(0, 8).toUpperCase());
  p.set('referredBy', user.get('referredBy') || null);
  p.set('banned', false);

  // Anyone signed in may read profiles (leaderboards, match lobbies); only
  // Cloud Code may write them.
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(false);
  p.setACL(acl);

  await p.save(null, MASTER);

  if (WELCOME_BONUS > 0) {
    await logTxn(p, 'credit', WELCOME_BONUS, 'bonus', 'Welcome bonus');
  }
  return { role };
});

/* ---------------------------------------------------------------- catalog */

/** Fills the nine game modes the first time the app asks. */
Parse.Cloud.define('seedCatalog', async () => {
  const count = await new Parse.Query('Game').count(MASTER);
  if (count > 0) return { seeded: false };

  const GAMES = [
    ['br-survival', 'BR SURVIVAL', 'Battle Royale', 1],
    ['br-full-map', 'BR FULL MAP', 'Battle Royale', 2],
    ['clash-squad-1v1', 'CLASH SQUAD 1vs1', 'Clash Squad', 3],
    ['lone-wolf-1v1', 'LONE WOLF 1vs1', 'Lone Wolf', 4],
    ['lone-wolf-2v2', 'LONE WOLF 2vs2', 'Lone Wolf', 5],
    ['cs-headshot', 'CS HEADSHOT', 'Clash Squad', 6],
    ['free-matches', 'FREE MATCHES', 'Free', 7],
    ['cs-headshot-2v2', 'CS HEADSHOT 2 VS 2', 'Clash Squad', 8],
    ['clash-squad-2v2', 'CLASH SQUAD 2 VS 2', 'Clash Squad', 9],
  ];

  const Game = Parse.Object.extend('Game');
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(false);

  const rows = GAMES.map(([gameId, name, mode, order]) => {
    const g = new Game();
    g.set('gameId', gameId);
    g.set('name', name);
    g.set('mode', mode);
    g.set('order', order);
    g.set('active', true);
    g.set('activeContests', 0);
    g.setACL(acl);
    return g;
  });

  await Parse.Object.saveAll(rows, MASTER);
  return { seeded: true, count: rows.length };
});

/* ------------------------------------------------------------------ join */

/**
 * Claims a slot and charges the entry fee together.
 *
 * The slot row is created before the wallet is touched: a unique index on
 * (contestId, slotNumber) means a second player racing for the same slot
 * fails here rather than after being charged.
 */
Parse.Cloud.define('joinContest', async (req) => {
  const user = requireUser(req);
  const player = await playerOf(user.id);
  if (player.get('banned')) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Your account is suspended.');
  }

  const { contestId, slotNumber, inGameName, teamName } = req.params;
  const contest = await new Parse.Query('Contest').get(contestId, MASTER);
  if (contest.get('status') === 'resulted') {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'This match is already finished.');
  }
  if (slotNumber < 1 || slotNumber > contest.get('totalSlots')) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Invalid slot.');
  }

  const taken = await new Parse.Query('Registration')
    .equalTo('contestId', contestId)
    .equalTo('slotNumber', slotNumber)
    .first(MASTER);
  if (taken) {
    throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, 'That slot was just taken. Pick another.');
  }

  const already = await new Parse.Query('Registration')
    .equalTo('contestId', contestId)
    .equalTo('userId', user.id)
    .first(MASTER);
  if (already) {
    throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, 'You have already joined this match.');
  }

  const fee = contest.get('matchType') === 'free' ? 0 : contest.get('entryFee') || 0;
  const wallet = player.get('wallet');
  if (fee > 0 && walletTotal(wallet) < fee) {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Insufficient balance. Please recharge.');
  }

  const Registration = Parse.Object.extend('Registration');
  const reg = new Registration();
  reg.set('contestId', contestId);
  reg.set('gameId', contest.get('gameId'));
  reg.set('userId', user.id);
  reg.set('username', player.get('username'));
  reg.set('slotNumber', slotNumber);
  reg.set('inGameName', inGameName);
  reg.set('teamName', teamName || '');
  reg.set('paidAmount', fee);
  reg.set('kills', 0);
  reg.set('placement', 0);
  reg.set('wonAmount', 0);
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(false);
  reg.setACL(acl);
  await reg.save(null, MASTER);

  // Debit bonus first, then deposit, then winnings.
  let remaining = fee;
  for (const kind of ['bonus', 'deposit', 'winnings']) {
    const take = Math.min(wallet[kind] || 0, remaining);
    wallet[kind] = (wallet[kind] || 0) - take;
    remaining -= take;
  }
  const stats = player.get('stats');
  stats.matchesPlayed = (stats.matchesPlayed || 0) + 1;
  player.set('wallet', wallet);
  player.set('stats', stats);
  await player.save(null, MASTER);

  contest.increment('filledSlots');
  await contest.save(null, MASTER);

  if (fee > 0) {
    await logTxn(player, 'debit', fee, 'deposit', `Entry fee — ${contest.get('title')}`);
  }
  return { ok: true };
});

/* -------------------------------------------------------------- deposits */

Parse.Cloud.define('createDeposit', async (req) => {
  const user = requireUser(req);
  const player = await playerOf(user.id);
  const amount = Number(req.params.amount);
  if (!(amount > 0)) throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Invalid amount.');

  const Deposit = Parse.Object.extend('Deposit');
  const d = new Deposit();
  d.set('userId', user.id);
  d.set('username', player.get('username'));
  d.set('amount', amount);
  d.set('status', 'pending');
  d.set('proofUrl', req.params.proofUrl || '');
  d.set('utr', req.params.utr || '');
  await d.save(null, MASTER);
  return { id: d.id };
});

/** Credits the deposit plus its tier bonus, exactly once. */
Parse.Cloud.define('approveDeposit', async (req) => {
  await requireRole(req, ['admin']);
  const d = await new Parse.Query('Deposit').get(req.params.id, MASTER);
  if (d.get('status') !== 'pending') {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Already processed.');
  }

  const player = await playerOf(d.get('userId'));
  const amount = d.get('amount');
  const bonus = depositBonus(amount);

  d.set('status', 'approved');
  await d.save(null, MASTER);

  const wallet = player.get('wallet');
  wallet.deposit = (wallet.deposit || 0) + amount;
  wallet.bonus = (wallet.bonus || 0) + bonus;
  player.set('wallet', wallet);
  await player.save(null, MASTER);

  await logTxn(player, 'credit', amount, 'deposit', 'Deposit approved');
  if (bonus > 0) {
    await logTxn(player, 'credit', bonus, 'bonus', `Deposit bonus (₹${amount} tier)`);
  }
  return { ok: true };
});

Parse.Cloud.define('rejectDeposit', async (req) => {
  await requireRole(req, ['admin']);
  const d = await new Parse.Query('Deposit').get(req.params.id, MASTER);
  if (d.get('status') === 'pending') {
    d.set('status', 'rejected');
    await d.save(null, MASTER);
  }
  return { ok: true };
});

/* ----------------------------------------------------------- withdrawals */

/** Holds the amount at request time so the same winnings cannot go twice. */
Parse.Cloud.define('requestWithdrawal', async (req) => {
  const user = requireUser(req);
  const player = await playerOf(user.id);
  const amount = Number(req.params.amount);
  if (!(amount > 0)) throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Invalid amount.');

  const wallet = player.get('wallet');
  if ((wallet.winnings || 0) < amount) {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Withdrawable (winnings) balance too low.');
  }

  wallet.winnings -= amount;
  player.set('wallet', wallet);
  await player.save(null, MASTER);

  const Withdrawal = Parse.Object.extend('Withdrawal');
  const w = new Withdrawal();
  w.set('userId', user.id);
  w.set('username', player.get('username'));
  w.set('amount', amount);
  w.set('status', 'pending');
  w.set('payoutUpi', req.params.payoutUpi || '');
  await w.save(null, MASTER);

  await logTxn(player, 'debit', amount, 'winnings', 'Withdrawal request');
  return { id: w.id };
});

Parse.Cloud.define('approveWithdrawal', async (req) => {
  await requireRole(req, ['admin']);
  const w = await new Parse.Query('Withdrawal').get(req.params.id, MASTER);
  if (w.get('status') === 'pending') {
    w.set('status', 'approved');
    await w.save(null, MASTER);
  }
  return { ok: true };
});

/** Returns the held amount, since the payout is not happening. */
Parse.Cloud.define('rejectWithdrawal', async (req) => {
  await requireRole(req, ['admin']);
  const w = await new Parse.Query('Withdrawal').get(req.params.id, MASTER);
  if (w.get('status') !== 'pending') {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Already processed.');
  }

  w.set('status', 'rejected');
  await w.save(null, MASTER);

  const player = await playerOf(w.get('userId'));
  const wallet = player.get('wallet');
  wallet.winnings = (wallet.winnings || 0) + w.get('amount');
  player.set('wallet', wallet);
  await player.save(null, MASTER);

  await logTxn(player, 'credit', w.get('amount'), 'winnings', 'Withdrawal rejected — refunded');
  return { ok: true };
});

/* --------------------------------------------------------- daily bonus */

/** Grows day 1 to day 7, then holds. Resets after a missed day. */
Parse.Cloud.define('claimDailyBonus', async (req) => {
  const user = requireUser(req);
  const player = await playerOf(user.id);
  if (player.get('banned')) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Your account is suspended.');
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (player.get('lastClaimDate') === today) {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Already claimed today. Come back tomorrow.');
  }

  const streak =
    player.get('lastClaimDate') === yesterday
      ? Math.min((player.get('claimStreak') || 0) + 1, 7)
      : 1;
  const reward = DAILY_REWARDS[streak];

  const wallet = player.get('wallet');
  wallet.bonus = (wallet.bonus || 0) + reward;
  player.set('wallet', wallet);
  player.set('lastClaimDate', today);
  player.set('claimStreak', streak);
  await player.save(null, MASTER);

  await logTxn(player, 'credit', reward, 'bonus', `Daily bonus — day ${streak}`);
  return { reward, streak };
});

/* ------------------------------------------------------ match management */

Parse.Cloud.define('setRoomCredentials', async (req) => {
  await requireRole(req, ['staff', 'admin']);
  const c = await new Parse.Query('Contest').get(req.params.contestId, MASTER);
  c.set('roomId', req.params.roomId || '');
  c.set('roomPassword', req.params.roomPassword || '');
  if (req.params.status) c.set('status', req.params.status);
  await c.save(null, MASTER);
  return { ok: true };
});

/**
 * Settles a whole contest at once: records each player's kills and placement,
 * credits winnings, updates lifetime stats and closes the match.
 */
Parse.Cloud.define('declareResults', async (req) => {
  await requireRole(req, ['staff', 'admin']);
  const contest = await new Parse.Query('Contest').get(req.params.contestId, MASTER);
  if (contest.get('status') === 'resulted') {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'Results are already declared.');
  }

  const breakdown = contest.get('prizeBreakdown') || [];
  const perKill = contest.get('perKill') || 0;

  for (const row of req.params.results || []) {
    const reg = await new Parse.Query('Registration').get(row.registrationId, MASTER)
      .catch(() => null);
    if (!reg) continue;

    const place = breakdown.find((p) => p.rank === row.placement);
    const won = (place ? place.amount : 0) + (row.kills || 0) * perKill;

    reg.set('kills', row.kills || 0);
    reg.set('placement', row.placement || 0);
    reg.set('wonAmount', won);
    // Denormalised so the winners feed needs no second query.
    reg.set('contestTitle', contest.get('title'));
    await reg.save(null, MASTER);

    const player = await playerOf(reg.get('userId')).catch(() => null);
    if (!player) continue;

    const wallet = player.get('wallet');
    wallet.winnings = (wallet.winnings || 0) + won;
    const stats = player.get('stats');
    stats.kills = (stats.kills || 0) + (row.kills || 0);
    stats.earnings = (stats.earnings || 0) + won;
    player.set('wallet', wallet);
    player.set('stats', stats);
    player.set('earnings', stats.earnings);
    await player.save(null, MASTER);

    if (won > 0) {
      await logTxn(player, 'credit', won, 'winnings', `Winnings — ${contest.get('title')}`);
    }
  }

  contest.set('status', 'resulted');
  await contest.save(null, MASTER);
  return { ok: true };
});

/** Drops a player from a match and refunds what they paid. */
Parse.Cloud.define('removeRegistration', async (req) => {
  await requireRole(req, ['staff', 'admin']);
  const reg = await new Parse.Query('Registration').get(req.params.registrationId, MASTER);
  const paid = reg.get('paidAmount') || 0;
  const contestId = reg.get('contestId');
  const userId = reg.get('userId');
  await reg.destroy(MASTER);

  const contest = await new Parse.Query('Contest').get(contestId, MASTER).catch(() => null);
  if (contest) {
    contest.set('filledSlots', Math.max(0, (contest.get('filledSlots') || 0) - 1));
    await contest.save(null, MASTER);
  }

  if (paid > 0) {
    const player = await playerOf(userId).catch(() => null);
    if (player) {
      const wallet = player.get('wallet');
      wallet.deposit = (wallet.deposit || 0) + paid;
      player.set('wallet', wallet);
      await player.save(null, MASTER);
      await logTxn(player, 'credit', paid, 'deposit', 'Entry fee refunded');
    }
  }
  return { ok: true };
});

Parse.Cloud.define('setResultProof', async (req) => {
  const user = requireUser(req);
  const reg = await new Parse.Query('Registration').get(req.params.registrationId, MASTER);
  // Only the player who joined may attach their own proof.
  if (reg.get('userId') !== user.id) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'That is not your registration.');
  }
  reg.set('proofUrl', req.params.proofUrl || '');
  await reg.save(null, MASTER);
  return { ok: true };
});

/* ------------------------------------------------------------ admin ops */

const CONTEST_FIELDS = [
  'gameId', 'title', 'mode', 'map', 'matchType', 'entryFee', 'prizePool',
  'perKill', 'totalSlots', 'schedule', 'prizeBreakdown', 'rules',
  'bannerUrl', 'videoUrl', 'status', 'roomId', 'roomPassword',
];

/** Creates a contest, or updates the one whose id is given. */
Parse.Cloud.define('saveContest', async (req) => {
  await requireRole(req, ['admin']);
  const input = req.params.contest || {};

  let c;
  if (req.params.id) {
    c = await new Parse.Query('Contest').get(req.params.id, MASTER);
  } else {
    c = new (Parse.Object.extend('Contest'))();
    c.set('filledSlots', 0);
    c.set('status', 'upcoming');
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(false);
    c.setACL(acl);
  }

  // Only known fields are copied, so a crafted request cannot set anything
  // else on the row.
  for (const f of CONTEST_FIELDS) {
    if (input[f] !== undefined) c.set(f, input[f]);
  }
  await c.save(null, MASTER);
  return { id: c.id };
});

Parse.Cloud.define('deleteContest', async (req) => {
  await requireRole(req, ['admin']);
  const c = await new Parse.Query('Contest').get(req.params.id, MASTER);
  await c.destroy(MASTER);
  return { ok: true };
});

Parse.Cloud.define('setUserRole', async (req) => {
  await requireRole(req, ['admin']);
  const role = req.params.role;
  if (!['player', 'staff', 'admin'].includes(role)) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Unknown role.');
  }
  const player = await playerOf(req.params.userId);
  player.set('role', role);
  await player.save(null, MASTER);
  return { ok: true };
});

Parse.Cloud.define('setUserBanned', async (req) => {
  await requireRole(req, ['admin']);
  const player = await playerOf(req.params.userId);
  player.set('banned', !!req.params.banned);
  await player.save(null, MASTER);
  return { ok: true };
});

Parse.Cloud.define('sendNotification', async (req) => {
  await requireRole(req, ['admin']);
  const n = new (Parse.Object.extend('Notification'))();
  n.set('title', req.params.title);
  n.set('body', req.params.body);
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(false);
  n.setACL(acl);
  await n.save(null, MASTER);
  return { id: n.id };
});

/* ----------------------------------------------------------- protection */

// Belt and braces: even if a class is left writable in the dashboard, these
// hooks refuse any direct client write to the tables that hold money.
for (const cls of ['Player', 'Transaction', 'Deposit', 'Withdrawal', 'Registration', 'Contest', 'Game', 'Notification']) {
  Parse.Cloud.beforeSave(cls, (req) => {
    if (!req.master) {
      throw new Parse.Error(
        Parse.Error.OPERATION_FORBIDDEN,
        `${cls} can only be changed by the server.`,
      );
    }
  });
  Parse.Cloud.beforeDelete(cls, (req) => {
    if (!req.master) {
      throw new Parse.Error(
        Parse.Error.OPERATION_FORBIDDEN,
        `${cls} can only be deleted by the server.`,
      );
    }
  });
}
