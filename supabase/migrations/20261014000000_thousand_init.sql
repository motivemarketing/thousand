-- THOUSAND database schema.
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste this whole file > Run.
-- Safe to re-run: it drops and recreates policies and functions, and creates tables only if missing.


-- ============ Tables ============

-- Public profile: what your spouse and crew can see.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  photo_url text,
  phone text,
  birthday_md text,            -- 'MM-DD' only; the full birthday stays private in baselines
  guide text default 'ember',
  onboarded boolean default false,
  created_at timestamptz default now()
);

-- Private baseline: only you can read it.
create table if not exists public.baselines (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birthday date,
  sex text,
  answers jsonb not null default '{}',
  time_budget jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Marriage answers: you and your spouse can read them (side-by-side view).
create table if not exists public.marriage_answers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answers jsonb not null default '{}',
  updated_at timestamptz default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz default now()
);
create table if not exists public.household_members (
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete cascade,
  primary key (household_id, user_id)
);

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create table if not exists public.crew_members (
  crew_id uuid references public.crews(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (crew_id, user_id)
);

-- A goal belongs to one person, or to a household (the shared Budget goal).
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  area text not null check (area in ('faith','marriage','parenting','health','worklife','budget')),
  title text not null,
  template text,
  measure_kind text check (measure_kind in ('down','up','count')),
  unit text,
  start_value numeric,
  goal_value numeric,
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active','complete','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  completed_at timestamptz,
  check ((owner_id is not null) <> (household_id is not null))
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  name text not null,
  days int[] not null check (not (0 = any(days))),   -- 1..6 = Mon..Sat; Sunday is never allowed
  shared boolean not null default false,
  position int not null default 0,
  active_from date,
  active_until date
);

create table if not exists public.rep_logs (
  habit_id uuid references public.habits(id) on delete cascade,
  day date not null,
  logged_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  primary key (habit_id, day)
);

create table if not exists public.measure_logs (
  goal_id uuid references public.goals(id) on delete cascade,
  day date not null,
  value numeric not null,
  logged_by uuid references auth.users(id) on delete set null,
  primary key (goal_id, day)
);

create index if not exists goals_owner_idx on public.goals(owner_id);
create index if not exists goals_household_idx on public.goals(household_id);
create index if not exists habits_goal_idx on public.habits(goal_id);
create index if not exists rep_logs_day_idx on public.rep_logs(day);

-- ============ Access helpers (security definer so policies don't recurse) ============

create or replace function public.my_household() returns uuid
language sql stable security definer set search_path = public as $$
  select household_id from household_members where user_id = auth.uid()
$$;

create or replace function public.is_spouse(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from household_members a join household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and b.user_id = other and other <> auth.uid())
$$;

create or replace function public.shares_crew(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from crew_members a join crew_members b on a.crew_id = b.crew_id
    where a.user_id = auth.uid() and b.user_id = other)
$$;

-- Who can see a goal: you; your household; your spouse (everything); your crew (everything except Budget).
create or replace function public.can_see_goal(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from goals x where x.id = g and (
      x.owner_id = auth.uid()
      or x.household_id = my_household()
      or (x.owner_id is not null and is_spouse(x.owner_id))
      or (x.owner_id is not null and x.area <> 'budget' and shares_crew(x.owner_id))))
$$;

-- Who can change a goal and log its reps: you, or your household for household goals.
create or replace function public.can_edit_goal(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from goals x where x.id = g and (x.owner_id = auth.uid() or x.household_id = my_household()))
$$;

-- ============ Row-level security ============

alter table public.profiles enable row level security;
alter table public.baselines enable row level security;
alter table public.marriage_answers enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.goals enable row level security;
alter table public.habits enable row level security;
alter table public.rep_logs enable row level security;
alter table public.measure_logs enable row level security;

drop policy if exists p_profiles_read on public.profiles;
create policy p_profiles_read on public.profiles for select using (id = auth.uid() or is_spouse(id) or shares_crew(id));
drop policy if exists p_profiles_write on public.profiles;
create policy p_profiles_write on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists p_baselines on public.baselines;
create policy p_baselines on public.baselines for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists p_marriage_read on public.marriage_answers;
create policy p_marriage_read on public.marriage_answers for select using (user_id = auth.uid() or is_spouse(user_id));
drop policy if exists p_marriage_write on public.marriage_answers;
create policy p_marriage_write on public.marriage_answers for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists p_households_read on public.households;
create policy p_households_read on public.households for select using (id = my_household());
drop policy if exists p_hm_read on public.household_members;
create policy p_hm_read on public.household_members for select using (household_id = my_household());
drop policy if exists p_hm_leave on public.household_members;
create policy p_hm_leave on public.household_members for delete using (user_id = auth.uid());

drop policy if exists p_crews_read on public.crews;
create policy p_crews_read on public.crews for select using (exists (select 1 from crew_members m where m.crew_id = id and m.user_id = auth.uid()));
drop policy if exists p_crews_update on public.crews;
create policy p_crews_update on public.crews for update using (created_by = auth.uid());
drop policy if exists p_cm_read on public.crew_members;
create policy p_cm_read on public.crew_members for select using (shares_crew(user_id) or user_id = auth.uid());
drop policy if exists p_cm_leave on public.crew_members;
create policy p_cm_leave on public.crew_members for delete using (user_id = auth.uid());

drop policy if exists p_goals_read on public.goals;
create policy p_goals_read on public.goals for select using (
  owner_id = auth.uid() or household_id = my_household()
  or (owner_id is not null and (is_spouse(owner_id) or (area <> 'budget' and shares_crew(owner_id)))));
drop policy if exists p_goals_insert on public.goals;
create policy p_goals_insert on public.goals for insert with check (
  (owner_id = auth.uid() and household_id is null) or (household_id = my_household() and owner_id is null));
drop policy if exists p_goals_update on public.goals;
create policy p_goals_update on public.goals for update using (can_edit_goal(id));
drop policy if exists p_goals_delete on public.goals;
create policy p_goals_delete on public.goals for delete using (can_edit_goal(id));

drop policy if exists p_habits_read on public.habits;
create policy p_habits_read on public.habits for select using (can_see_goal(goal_id));
drop policy if exists p_habits_write on public.habits;
create policy p_habits_write on public.habits for all using (can_edit_goal(goal_id)) with check (can_edit_goal(goal_id));

drop policy if exists p_reps_read on public.rep_logs;
create policy p_reps_read on public.rep_logs for select using (can_see_goal((select goal_id from habits h where h.id = habit_id)));
-- Writes to rep_logs go through log_rep() below.

drop policy if exists p_measure_read on public.measure_logs;
create policy p_measure_read on public.measure_logs for select using (can_see_goal(goal_id));
drop policy if exists p_measure_write on public.measure_logs;
create policy p_measure_write on public.measure_logs for all using (can_edit_goal(goal_id)) with check (can_edit_goal(goal_id));

-- ============ Functions the app calls ============

-- Log or unlog a rep. A shared Marriage rep also lands on your spouse's matching shared habit,
-- so one check counts for both of you.
create or replace function public.log_rep(p_habit uuid, p_day date, p_done boolean) returns void
language plpgsql security definer set search_path = public as $$
declare g goals; h habits; mirror uuid;
begin
  select * into h from habits where id = p_habit;
  select * into g from goals where id = h.goal_id;
  if not can_edit_goal(g.id) then raise exception 'not allowed'; end if;
  if extract(dow from p_day) = 0 then raise exception 'Sunday is a rest day'; end if;
  if p_day > current_date + 1 or p_day < current_date - 2 then raise exception 'You can log today or yesterday'; end if;

  if p_done then
    insert into rep_logs(habit_id, day, logged_by) values (p_habit, p_day, auth.uid()) on conflict do nothing;
  else
    delete from rep_logs where habit_id = p_habit and day = p_day;
  end if;

  if h.shared and g.owner_id is not null then
    for mirror in
      select hh.id from habits hh join goals gg on gg.id = hh.goal_id
      where hh.shared and lower(hh.name) = lower(h.name) and gg.status = 'active' and gg.area = g.area
        and gg.owner_id is not null and gg.owner_id <> g.owner_id and is_spouse(gg.owner_id)
    loop
      if p_done then
        insert into rep_logs(habit_id, day, logged_by) values (mirror, p_day, auth.uid()) on conflict do nothing;
      else
        delete from rep_logs where habit_id = mirror and day = p_day;
      end if;
    end loop;
  end if;
end $$;

-- Start a household (for the shared Budget goal and spouse view), or return the one you're in.
create or replace function public.ensure_household() returns households
language plpgsql security definer set search_path = public as $$
declare h households;
begin
  select * into h from households where id = my_household();
  if h.id is null then
    insert into households default values returning * into h;
    insert into household_members(household_id, user_id) values (h.id, auth.uid());
  end if;
  return h;
end $$;

create or replace function public.join_household(p_code text) returns households
language plpgsql security definer set search_path = public as $$
declare h households; n int;
begin
  select * into h from households where invite_code = upper(trim(p_code));
  if h.id is null then raise exception 'That invite code isn''t valid'; end if;
  select count(*) into n from household_members where household_id = h.id;
  if n >= 2 and not exists (select 1 from household_members where household_id = h.id and user_id = auth.uid()) then
    raise exception 'This household already has two people';
  end if;
  delete from household_members where user_id = auth.uid() and household_id <> h.id;
  insert into household_members(household_id, user_id) values (h.id, auth.uid()) on conflict do nothing;
  return h;
end $$;

create or replace function public.create_crew(p_name text) returns crews
language plpgsql security definer set search_path = public as $$
declare c crews;
begin
  insert into crews(name, created_by) values (coalesce(nullif(trim(p_name), ''), 'Crew'), auth.uid()) returning * into c;
  insert into crew_members(crew_id, user_id) values (c.id, auth.uid());
  return c;
end $$;

create or replace function public.join_crew(p_code text) returns crews
language plpgsql security definer set search_path = public as $$
declare c crews;
begin
  select * into c from crews where invite_code = upper(trim(p_code));
  if c.id is null then raise exception 'That invite code isn''t valid'; end if;
  insert into crew_members(crew_id, user_id) values (c.id, auth.uid()) on conflict do nothing;
  return c;
end $$;

-- What an invite code points to (shown before you accept). Works without being a member.
create or replace function public.peek_invite(p_kind text, p_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if p_kind = 'crew' then
    select jsonb_build_object('name', c.name, 'members', (select count(*) from crew_members m where m.crew_id = c.id),
      'from', (select first_name from profiles p where p.id = c.created_by))
      into r from crews c where c.invite_code = upper(trim(p_code));
  else
    select jsonb_build_object('name', 'Household', 'members', (select count(*) from household_members m where m.household_id = h.id),
      'from', (select p.first_name from household_members m join profiles p on p.id = m.user_id where m.household_id = h.id limit 1))
      into r from households h where h.invite_code = upper(trim(p_code));
  end if;
  return r;
end $$;

-- Delete my account and everything I own. Household goals stay with my spouse.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

grant execute on function public.log_rep, public.ensure_household, public.join_household, public.create_crew,
  public.join_crew, public.peek_invite, public.delete_my_account to authenticated;

-- ============ Profile photos ============
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
drop policy if exists p_avatars_write on storage.objects;
create policy p_avatars_write on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
