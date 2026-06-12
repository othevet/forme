-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  goal_description text,
  sport_type text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Strava connections
create table if not exists strava_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references profiles(id) on delete cascade,
  strava_athlete_id bigint,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table strava_connections enable row level security;

create policy "Users can view own strava connection"
  on strava_connections for select using (auth.uid() = user_id);

create policy "Users can insert own strava connection"
  on strava_connections for insert with check (auth.uid() = user_id);

create policy "Users can update own strava connection"
  on strava_connections for update using (auth.uid() = user_id);

-- Workouts synced from Strava
create table if not exists workouts (
  id bigint primary key, -- Strava activity ID
  user_id uuid references profiles(id) on delete cascade,
  strava_connection_id uuid references strava_connections(id) on delete set null,
  name text,
  sport_type text,
  workout_type text,
  description text,
  distance_meters float,
  moving_time_seconds int,
  elapsed_time_seconds int,
  total_elevation_gain float,
  average_speed float,
  max_speed float,
  average_heartrate float,
  max_heartrate float,
  average_cadence float,
  average_watts float,
  max_watts float,
  kilojoules float,
  calories float,
  perceived_exertion int,
  start_date timestamptz,
  timezone text,
  polyline text,
  map_summary_polyline text,
  device_name text,
  gear_id text,
  is_manual boolean default false,
  trainer boolean default false,
  commute boolean default false,
  flagged boolean default false,
  private_note text,
  weather_temp float,
  weather_humidity float,
  weather_wind_speed float,
  weather_description text,
  raw_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table workouts enable row level security;

create policy "Users can view own workouts"
  on workouts for select using (auth.uid() = user_id);

create policy "Users can insert own workouts"
  on workouts for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on workouts for update using (auth.uid() = user_id);

create index idx_workouts_user_date on workouts(user_id, start_date desc);
create index idx_workouts_sport on workouts(user_id, sport_type);

-- Workout streams (time-series data)
create table if not exists workout_streams (
  id uuid primary key default gen_random_uuid(),
  workout_id bigint references workouts(id) on delete cascade,
  stream_type text not null, -- heartrate, cadence, velocity, altitude, etc.
  data jsonb not null, -- array of values
  series_type text, -- distance or time
  original_size int,
  resolution text, -- low, medium, high
  created_at timestamptz default now()
);

alter table workout_streams enable row level security;

create policy "Users can view own workout streams"
  on workout_streams for select using (
    exists (select 1 from workouts where workouts.id = workout_streams.workout_id and workouts.user_id = auth.uid())
  );

create policy "Users can insert own workout streams"
  on workout_streams for insert with check (
    exists (select 1 from workouts where workouts.id = workout_streams.workout_id and workouts.user_id = auth.uid())
  );

-- Goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  sport_type text,
  target_type text not null check (target_type in ('distance', 'time', 'frequency', 'pace', 'heart_rate', 'elevation', 'custom')),
  target_value float,
  target_unit text,
  current_value float default 0,
  start_date date,
  target_date date,
  status text default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table goals enable row level security;

create policy "Users can view own goals"
  on goals for select using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on goals for insert with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on goals for update using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on goals for delete using (auth.uid() = user_id);

-- Coaching history (AI conversations)
create table if not exists coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  summary text,
  workout_id bigint references workouts(id) on delete set null,
  created_at timestamptz default now()
);

alter table coaching_sessions enable row level security;

create policy "Users can view own coaching sessions"
  on coaching_sessions for select using (auth.uid() = user_id);

create policy "Users can insert own coaching sessions"
  on coaching_sessions for insert with check (auth.uid() = user_id);

-- Coaching messages
create table if not exists coaching_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references coaching_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table coaching_messages enable row level security;

create policy "Users can view own coaching messages"
  on coaching_messages for select using (
    exists (select 1 from coaching_sessions where coaching_sessions.id = coaching_messages.session_id and coaching_sessions.user_id = auth.uid())
  );

create policy "Users can insert own coaching messages"
  on coaching_messages for insert with check (
    exists (select 1 from coaching_sessions where coaching_sessions.id = coaching_messages.session_id and coaching_sessions.user_id = auth.uid())
  );

-- Workout analytics cache
create table if not exists workout_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  period text not null check (period in ('week', 'month', 'year', 'all')),
  data jsonb not null,
  computed_at timestamptz default now(),
  unique(user_id, period)
);

alter table workout_analytics enable row level security;

create policy "Users can view own analytics"
  on workout_analytics for select using (auth.uid() = user_id);
