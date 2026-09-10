create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  focuses text[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mood smallint not null check (mood between 1 and 10),
  energy smallint not null check (energy between 1 and 10),
  stress smallint not null check (stress between 1 and 10),
  productivity smallint not null check (productivity between 1 and 10),
  sleep_hours numeric(4,2) not null default 0,
  sleep_quality smallint not null check (sleep_quality between 1 and 10),
  exercise_minutes integer not null default 0 check (exercise_minutes >= 0),
  steps integer not null default 0 check (steps >= 0),
  meals integer not null default 0 check (meals >= 0),
  water_glasses integer not null default 0 check (water_glasses >= 0),
  alcohol_units numeric(6,2) not null default 0 check (alcohol_units >= 0),
  social_minutes integer not null default 0 check (social_minutes >= 0),
  screen_hours numeric(5,2) not null default 0 check (screen_hours >= 0),
  spend numeric(12,2) not null default 0 check (spend >= 0),
  habits text[] not null default '{}',
  notes text not null default '',
  source text not null default 'manual' check (source in ('manual', 'demo', 'fitbit', 'apple-health')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.profiles enable row level security;
alter table public.check_ins enable row level security;
alter table public.connections enable row level security;

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users read own check-ins" on public.check_ins for select using (auth.uid() = user_id);
create policy "Users insert own check-ins" on public.check_ins for insert with check (auth.uid() = user_id);
create policy "Users update own check-ins" on public.check_ins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own check-ins" on public.check_ins for delete using (auth.uid() = user_id);

create policy "Users read own connections" on public.connections for select using (auth.uid() = user_id);
create policy "Users insert own connections" on public.connections for insert with check (auth.uid() = user_id);
create policy "Users update own connections" on public.connections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own connections" on public.connections for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

