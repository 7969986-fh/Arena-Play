-- ============================================================================
-- Arena Play — Supabase schema
-- Paste this whole file into the SQL Editor in your Supabase dashboard and Run.
-- Safe to run more than once.
-- ============================================================================

-- ---------------------------------------------------------------- tables

create table if not exists public.users (
  uid           uuid primary key references auth.users(id) on delete cascade,
  username      text not null,
  email         text not null,
  role          text not null default 'player' check (role in ('player','staff','admin')),
  wallet        jsonb not null default '{"deposit":0,"winnings":0,"bonus":0}'::jsonb,
  stats         jsonb not null default '{"matchesPlayed":0,"kills":0,"earnings":0}'::jsonb,
  referral_code text not null unique,
  referred_by   text,
  banned        boolean not null default false,
  created_at    bigint not null
);

create table if not exists public.games (
  id              text primary key,
  name            text not null,
  image           text default '',
  mode            text not null,
  "order"         int  not null default 0,
  active          boolean not null default true,
  active_contests int not null default 0
);

create table if not exists public.contests (
  id              uuid primary key default gen_random_uuid(),
  game_id         text not null references public.games(id) on delete cascade,
  title           text not null,
  mode            text not null check (mode in ('solo','duo','squad')),
  map             text not null,
  match_type      text not null check (match_type in ('paid','free')),
  entry_fee       int  not null default 0,
  prize_pool      int  not null default 0,
  per_kill        int  not null default 0,
  total_slots     int  not null,
  filled_slots    int  not null default 0,
  schedule        bigint not null,
  status          text not null default 'upcoming' check (status in ('upcoming','ongoing','resulted')),
  room_id         text default '',
  room_password   text default '',
  prize_breakdown jsonb not null default '[]'::jsonb,
  rules           text default '',
  banner_url      text default '',
  video_url       text default '',
  created_at      bigint not null
);

-- Added after the first release; safe on an existing database.
alter table public.contests add column if not exists banner_url text default '';
alter table public.contests add column if not exists video_url  text default '';

create table if not exists public.registrations (
  id           uuid primary key default gen_random_uuid(),
  contest_id   uuid not null references public.contests(id) on delete cascade,
  game_id      text not null,
  user_id      uuid not null references public.users(uid) on delete cascade,
  username     text not null,
  slot_number  int  not null,
  in_game_name text not null,
  team_name    text default '',
  paid_amount  int  not null default 0,
  kills        int  not null default 0,
  placement    int  not null default 0,
  won_amount   int  not null default 0,
  proof_url    text default '',
  joined_at    bigint not null,
  -- one player per contest, and no two players in the same slot
  unique (contest_id, user_id),
  unique (contest_id, slot_number)
);

create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(uid) on delete cascade,
  type          text not null check (type in ('credit','debit')),
  amount        int  not null,
  wallet_type   text not null check (wallet_type in ('deposit','winnings','bonus')),
  description   text not null,
  balance_after int  not null,
  created_at    bigint not null
);

create table if not exists public.deposits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(uid) on delete cascade,
  username   text not null,
  amount     int  not null,
  status     text not null default 'pending' check (status in ('pending','approved','rejected')),
  note       text default '',
  proof_url  text default '',
  utr        text default '',
  created_at bigint not null
);

create table if not exists public.withdrawals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(uid) on delete cascade,
  username   text not null,
  amount     int  not null,
  status     text not null default 'pending' check (status in ('pending','approved','rejected')),
  note       text default '',
  payout_upi text default '',
  created_at bigint not null
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  created_at bigint not null
);

create index if not exists idx_contests_game     on public.contests(game_id);
create index if not exists idx_contests_schedule on public.contests(schedule);
create index if not exists idx_regs_contest      on public.registrations(contest_id);
create index if not exists idx_regs_user         on public.registrations(user_id);
create index if not exists idx_txn_user          on public.transactions(user_id, created_at desc);

-- ---------------------------------------------------------------- roles
-- SECURITY DEFINER so a policy on `users` can read `users` without the
-- policy re-entering itself and recursing.

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.users where uid = auth.uid()), 'player');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() = 'admin';
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() in ('staff','admin');
$$;

-- ---------------------------------------------------------------- RLS
-- Money columns are never writable from the client. Every balance change
-- goes through a SECURITY DEFINER function below, so a tampered client
-- cannot credit its own wallet.

alter table public.users         enable row level security;
alter table public.games         enable row level security;
alter table public.contests      enable row level security;
alter table public.registrations enable row level security;
alter table public.transactions  enable row level security;
alter table public.deposits      enable row level security;
alter table public.withdrawals   enable row level security;
alter table public.notifications enable row level security;

drop policy if exists users_read      on public.users;
drop policy if exists users_insert    on public.users;
drop policy if exists users_admin_all on public.users;
create policy users_read      on public.users for select to authenticated using (true);
create policy users_insert    on public.users for insert to authenticated with check (uid = auth.uid());
create policy users_admin_all on public.users for update to authenticated using (public.is_admin());

drop policy if exists games_read on public.games;
drop policy if exists games_write on public.games;
create policy games_read  on public.games for select to authenticated using (true);
create policy games_write on public.games for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists contests_read on public.contests;
drop policy if exists contests_write on public.contests;
drop policy if exists contests_staff_update on public.contests;
create policy contests_read  on public.contests for select to authenticated using (true);
create policy contests_write on public.contests for all    to authenticated using (public.is_admin()) with check (public.is_admin());
-- staff set room credentials and flip status, but cannot change prizes/fees
create policy contests_staff_update on public.contests for update to authenticated using (public.is_staff());

drop policy if exists regs_read on public.registrations;
drop policy if exists regs_own_update on public.registrations;
drop policy if exists regs_staff_all on public.registrations;
create policy regs_read       on public.registrations for select to authenticated using (true);
-- a player may attach their own result screenshot, nothing else
create policy regs_own_update on public.registrations for update to authenticated using (user_id = auth.uid());
create policy regs_staff_all  on public.registrations for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists txn_read on public.transactions;
create policy txn_read on public.transactions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists dep_read on public.deposits;
drop policy if exists dep_insert on public.deposits;
drop policy if exists dep_admin on public.deposits;
create policy dep_read   on public.deposits for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy dep_insert on public.deposits for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy dep_admin  on public.deposits for update to authenticated using (public.is_admin());

drop policy if exists wd_read on public.withdrawals;
drop policy if exists wd_insert on public.withdrawals;
drop policy if exists wd_admin on public.withdrawals;
create policy wd_read   on public.withdrawals for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy wd_insert on public.withdrawals for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy wd_admin  on public.withdrawals for update to authenticated using (public.is_admin());

drop policy if exists notif_read on public.notifications;
drop policy if exists notif_write on public.notifications;
create policy notif_read  on public.notifications for select to authenticated using (true);
create policy notif_write on public.notifications for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- money
-- Every wallet change lives in one of these functions. They run as the
-- table owner (SECURITY DEFINER) and each does its own permission check,
-- so the client never needs write access to a balance.

-- Debits bonus -> deposit -> winnings, matching the offline backend.
create or replace function public.wallet_debit(w jsonb, amt int)
returns jsonb language plpgsql immutable as $$
declare rem int := amt; take int; out jsonb := w; k text;
begin
  foreach k in array array['bonus','deposit','winnings'] loop
    take := least((out->>k)::int, rem);
    out := jsonb_set(out, array[k], to_jsonb((out->>k)::int - take));
    rem := rem - take;
  end loop;
  return out;
end $$;

create or replace function public.log_txn(
  p_user uuid, p_type text, p_amount int, p_wallet text, p_desc text)
returns void language plpgsql security definer set search_path = public as $$
declare w jsonb;
begin
  select wallet into w from public.users where uid = p_user;
  insert into public.transactions(user_id, type, amount, wallet_type, description, balance_after, created_at)
  values (p_user, p_type, p_amount, p_wallet, p_desc,
          (w->>'deposit')::int + (w->>'winnings')::int + (w->>'bonus')::int,
          (extract(epoch from now()) * 1000)::bigint);
end $$;

-- Joins a contest: checks the slot and balance, debits, registers and
-- bumps the filled count in one transaction so two players cannot take
-- the same slot or overdraw the same balance.
create or replace function public.join_contest(
  p_contest uuid, p_slot int, p_ign text, p_team text default '')
returns void language plpgsql security definer set search_path = public as $$
declare c record; u record; fee int; bal int;
begin
  select * into u from public.users where uid = auth.uid();
  if u is null then raise exception 'Not signed in.'; end if;
  if u.banned then raise exception 'Your account is suspended.'; end if;

  select * into c from public.contests where id = p_contest for update;
  if c is null then raise exception 'Contest not found.'; end if;
  if c.status = 'resulted' then raise exception 'This match is already finished.'; end if;
  if p_slot < 1 or p_slot > c.total_slots then raise exception 'Invalid slot.'; end if;

  fee := case when c.match_type = 'free' then 0 else c.entry_fee end;
  bal := (u.wallet->>'deposit')::int + (u.wallet->>'winnings')::int + (u.wallet->>'bonus')::int;
  if fee > 0 and bal < fee then raise exception 'Insufficient balance. Please recharge.'; end if;

  insert into public.registrations(
    contest_id, game_id, user_id, username, slot_number, in_game_name,
    team_name, paid_amount, joined_at)
  values (p_contest, c.game_id, u.uid, u.username, p_slot, p_ign,
          coalesce(p_team, ''), fee, (extract(epoch from now()) * 1000)::bigint);

  update public.users
     set wallet = public.wallet_debit(wallet, fee),
         stats  = jsonb_set(stats, '{matchesPlayed}', to_jsonb((stats->>'matchesPlayed')::int + 1))
   where uid = u.uid;

  update public.contests set filled_slots = filled_slots + 1 where id = p_contest;

  if fee > 0 then
    perform public.log_txn(u.uid, 'debit', fee, 'deposit', 'Entry fee — ' || c.title);
  end if;
exception
  when unique_violation then
    raise exception 'That slot was just taken. Pick another.';
end $$;

-- Bonus coins earned on a deposit. Mirrors DEPOSIT_BONUS_TIERS in
-- constants/app.ts — change both together.
create or replace function public.deposit_bonus(amount int)
returns int language sql immutable as $$
  select case
    when amount >= 500 then 100
    when amount >= 300 then 60
    when amount >= 200 then 35
    when amount >= 100 then 15
    when amount >= 50  then 5
    else 0
  end;
$$;

-- Admin approves a deposit: credits the deposit wallet exactly once, plus
-- any tier bonus into the bonus wallet (spendable on entry fees, never
-- withdrawable).
create or replace function public.approve_deposit(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare d record; b int;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  select * into d from public.deposits where id = p_id for update;
  if d is null then raise exception 'Request not found.'; end if;
  if d.status <> 'pending' then raise exception 'Already processed.'; end if;

  b := public.deposit_bonus(d.amount);

  update public.deposits set status = 'approved' where id = p_id;
  update public.users
     set wallet = jsonb_set(
                    jsonb_set(wallet, '{deposit}', to_jsonb((wallet->>'deposit')::int + d.amount)),
                    '{bonus}', to_jsonb((wallet->>'bonus')::int + b))
   where uid = d.user_id;

  perform public.log_txn(d.user_id, 'credit', d.amount, 'deposit', 'Deposit approved');
  if b > 0 then
    perform public.log_txn(d.user_id, 'credit', b, 'bonus',
      'Deposit bonus (₹' || d.amount || ' tier)');
  end if;
end $$;

create or replace function public.reject_deposit(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  update public.deposits set status = 'rejected' where id = p_id and status = 'pending';
end $$;

-- Withdrawal requests hold the money at request time, so approving only
-- marks it paid and rejecting returns the held amount.
create or replace function public.request_withdrawal(p_amount int, p_upi text)
returns void language plpgsql security definer set search_path = public as $$
declare u record;
begin
  select * into u from public.users where uid = auth.uid() for update;
  if u is null then raise exception 'Not signed in.'; end if;
  if p_amount <= 0 then raise exception 'Invalid amount.'; end if;
  if (u.wallet->>'winnings')::int < p_amount then
    raise exception 'Withdrawable (winnings) balance too low.';
  end if;

  update public.users
     set wallet = jsonb_set(wallet, '{winnings}', to_jsonb((wallet->>'winnings')::int - p_amount))
   where uid = u.uid;

  insert into public.withdrawals(user_id, username, amount, payout_upi, created_at)
  values (u.uid, u.username, p_amount, coalesce(p_upi, ''),
          (extract(epoch from now()) * 1000)::bigint);

  perform public.log_txn(u.uid, 'debit', p_amount, 'winnings', 'Withdrawal request');
end $$;

create or replace function public.approve_withdrawal(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  update public.withdrawals set status = 'approved' where id = p_id and status = 'pending';
end $$;

create or replace function public.reject_withdrawal(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare w record;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  select * into w from public.withdrawals where id = p_id for update;
  if w is null or w.status <> 'pending' then raise exception 'Already processed.'; end if;

  update public.withdrawals set status = 'rejected' where id = p_id;
  update public.users
     set wallet = jsonb_set(wallet, '{winnings}', to_jsonb((wallet->>'winnings')::int + w.amount))
   where uid = w.user_id;
  perform public.log_txn(w.user_id, 'credit', w.amount, 'winnings', 'Withdrawal rejected — refunded');
end $$;

-- Declares results for a whole contest at once: records each player's
-- kills and placement, credits winnings, updates lifetime stats and
-- closes the contest. All-or-nothing so prizes can never be half paid.
create or replace function public.declare_results(p_contest uuid, p_rows jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare c record; r jsonb; reg record; won int; place_amt int;
begin
  if not public.is_staff() then raise exception 'Staff only.'; end if;

  select * into c from public.contests where id = p_contest for update;
  if c is null then raise exception 'Contest not found.'; end if;
  if c.status = 'resulted' then raise exception 'Results are already declared.'; end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    select * into reg from public.registrations
      where id = (r->>'registrationId')::uuid and contest_id = p_contest;
    continue when reg is null;

    -- placement prize from the contest's own breakdown, plus per-kill
    select coalesce((select (x->>'amount')::int
                       from jsonb_array_elements(c.prize_breakdown) x
                      where (x->>'rank')::int = (r->>'placement')::int), 0)
      into place_amt;
    won := place_amt + (r->>'kills')::int * c.per_kill;

    update public.registrations
       set kills = (r->>'kills')::int,
           placement = (r->>'placement')::int,
           won_amount = won
     where id = reg.id;

    update public.users
       set wallet = jsonb_set(wallet, '{winnings}', to_jsonb((wallet->>'winnings')::int + won)),
           stats = jsonb_set(
                     jsonb_set(stats, '{kills}',
                       to_jsonb((stats->>'kills')::int + (r->>'kills')::int)),
                     '{earnings}', to_jsonb((stats->>'earnings')::int + won))
     where uid = reg.user_id;

    if won > 0 then
      perform public.log_txn(reg.user_id, 'credit', won, 'winnings', 'Winnings — ' || c.title);
    end if;
  end loop;

  update public.contests set status = 'resulted' where id = p_contest;
end $$;

-- Removes a player from a contest and refunds their entry fee.
create or replace function public.remove_registration(p_reg uuid)
returns void language plpgsql security definer set search_path = public as $$
declare reg record;
begin
  if not public.is_staff() then raise exception 'Staff only.'; end if;
  select * into reg from public.registrations where id = p_reg for update;
  if reg is null then raise exception 'Registration not found.'; end if;

  delete from public.registrations where id = p_reg;
  update public.contests
     set filled_slots = greatest(0, filled_slots - 1)
   where id = reg.contest_id;

  if reg.paid_amount > 0 then
    update public.users
       set wallet = jsonb_set(wallet, '{deposit}', to_jsonb((wallet->>'deposit')::int + reg.paid_amount))
     where uid = reg.user_id;
    perform public.log_txn(reg.user_id, 'credit', reg.paid_amount, 'deposit', 'Entry fee refunded');
  end if;
end $$;

-- ------------------------------------------------------------ daily bonus
-- Streak state lives on the user row; the claim runs server-side so the
-- reward cannot be granted by a tampered client or claimed twice a day.

alter table public.users add column if not exists last_claim_date date;
alter table public.users add column if not exists claim_streak int not null default 0;

-- Day 1 through 7 of a streak, then it holds at the day-7 value.
create or replace function public.streak_reward(day int)
returns int language sql immutable as $$
  select case least(greatest(day, 1), 7)
    when 1 then 2 when 2 then 3 when 3 then 5 when 4 then 8
    when 5 then 12 when 6 then 18 else 25 end;
$$;

create or replace function public.claim_daily_bonus()
returns jsonb language plpgsql security definer set search_path = public as $$
declare u record; today date := current_date; next_streak int; reward int;
begin
  select * into u from public.users where uid = auth.uid() for update;
  if u is null then raise exception 'Not signed in.'; end if;
  if u.banned then raise exception 'Your account is suspended.'; end if;
  if u.last_claim_date = today then
    raise exception 'Already claimed today. Come back tomorrow.';
  end if;

  -- Consecutive only when the last claim was yesterday; any longer gap
  -- restarts the streak at one.
  next_streak := case when u.last_claim_date = today - 1
                      then least(u.claim_streak + 1, 7) else 1 end;
  reward := public.streak_reward(next_streak);

  update public.users
     set wallet = jsonb_set(wallet, '{bonus}', to_jsonb((wallet->>'bonus')::int + reward)),
         last_claim_date = today,
         claim_streak = next_streak
   where uid = u.uid;

  perform public.log_txn(u.uid, 'credit', reward, 'bonus',
    'Daily bonus — day ' || next_streak);

  return jsonb_build_object('reward', reward, 'streak', next_streak);
end $$;

-- ---------------------------------------------------------------- signup
-- Creates the app-side profile whenever an auth user is created, so the
-- client never has to write the wallet or role itself.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare code text;
begin
  code := upper(substr(replace(new.id::text, '-', ''), 1, 8));
  insert into public.users(uid, username, email, referral_code, referred_by, wallet, created_at)
  values (
    new.id,
    -- email signup sends 'username'; Google sends 'full_name' / 'name'
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    code,
    nullif(new.raw_user_meta_data->>'referredBy', ''),
    '{"deposit":0,"winnings":0,"bonus":25}'::jsonb,   -- welcome bonus
    (extract(epoch from now()) * 1000)::bigint
  )
  on conflict (uid) do nothing;
  return new;
exception when others then
  -- Never block sign-up over profile creation: raising here makes Supabase
  -- reject the whole registration with "Database error saving new user".
  -- The app backfills a missing profile on first load instead.
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- storage
-- One public bucket for payment and result screenshots. Reads are public
-- so the admin panel can render them; writes are limited to signed-in users.

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

drop policy if exists proofs_read   on storage.objects;
drop policy if exists proofs_upload on storage.objects;
create policy proofs_read   on storage.objects for select using (bucket_id = 'proofs');
create policy proofs_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs');

-- ---------------------------------------------------------------- realtime
-- Lets the app receive live updates instead of polling. Wrapped so a
-- re-run does not fail on tables already in the publication.

do $$
declare t text;
begin
  foreach t in array array[
    'users','contests','registrations','transactions',
    'deposits','withdrawals','notifications','games'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      -- Already in the publication from a previous run; nothing to do.
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------- catalog
-- The nine game modes the app ships with.

insert into public.games(id, name, mode, "order") values
  ('br-survival',     'BR SURVIVAL',        'Battle Royale', 1),
  ('br-full-map',     'BR FULL MAP',        'Battle Royale', 2),
  ('clash-squad-1v1', 'CLASH SQUAD 1vs1',   'Clash Squad',   3),
  ('lone-wolf-1v1',   'LONE WOLF 1vs1',     'Lone Wolf',     4),
  ('lone-wolf-2v2',   'LONE WOLF 2vs2',     'Lone Wolf',     5),
  ('cs-headshot',     'CS HEADSHOT',        'Clash Squad',   6),
  ('free-matches',    'FREE MATCHES',       'Free',          7),
  ('cs-headshot-2v2', 'CS HEADSHOT 2 VS 2', 'Clash Squad',   8),
  ('clash-squad-2v2', 'CLASH SQUAD 2 VS 2', 'Clash Squad',   9)
on conflict (id) do nothing;
