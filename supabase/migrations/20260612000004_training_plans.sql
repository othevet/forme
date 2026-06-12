create table if not exists training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  goal text,
  sport_type text default 'Run',
  duration_weeks int default 4,
  plan_json jsonb,
  created_at timestamptz default now()
);

alter table training_plans enable row level security;

create policy "Users can view own plans"
  on training_plans for select using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on training_plans for insert with check (auth.uid() = user_id);
