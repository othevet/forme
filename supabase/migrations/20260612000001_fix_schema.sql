-- Add coaching_context to profiles
alter table profiles add column if not exists coaching_context text;

-- Create workout_splits table
create table if not exists workout_splits (
  id uuid primary key default gen_random_uuid(),
  workout_id bigint references workouts(id) on delete cascade,
  split integer not null,
  distance_meters double precision,
  moving_time_seconds integer,
  elapsed_time_seconds integer,
  average_speed double precision,
  average_heartrate double precision,
  elevation_difference double precision,
  pace_seconds double precision
);

alter table workout_splits enable row level security;

create index if not exists idx_splits_workout on workout_splits(workout_id, split);

create policy "Users can view own splits"
  on workout_splits for select using (
    exists (select 1 from workouts where workouts.id = workout_splits.workout_id and workouts.user_id = auth.uid())
  );

create policy "Users can insert own splits"
  on workout_splits for insert with check (
    exists (select 1 from workouts where workouts.id = workout_splits.workout_id and workouts.user_id = auth.uid())
  );
