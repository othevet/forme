alter table profiles add column if not exists email_weekly_report boolean not null default false;
alter table profiles add column if not exists email text;
