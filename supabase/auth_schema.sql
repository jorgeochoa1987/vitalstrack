-- Auth + perfiles + mediciones por usuario (AHA/ACC app)
-- Ejecutar en SQL Editor de Supabase

create extension if not exists "pgcrypto";

-- Perfiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  birth_date date,
  sex text check (sex is null or sex in ('male', 'female', 'other', 'unspecified')),
  height_cm numeric(5,1) check (height_cm is null or height_cm between 50 and 250),
  weight_kg numeric(5,1) check (weight_kg is null or weight_kg between 20 and 400),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles select own" on public.profiles;
drop policy if exists "Profiles insert own" on public.profiles;
drop policy if exists "Profiles update own" on public.profiles;

create policy "Profiles select own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Profiles insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Profiles update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on public.profiles to authenticated;

-- Crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mediciones
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  systolic integer not null check (systolic between 60 and 250),
  diastolic integer not null check (diastolic between 40 and 150),
  pulse integer not null check (pulse between 30 and 220),
  recorded_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Si la tabla ya existía sin user_id:
alter table public.measurements
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists measurements_recorded_at_idx
  on public.measurements (recorded_at desc);

create index if not exists measurements_user_id_idx
  on public.measurements (user_id, recorded_at desc);

alter table public.measurements enable row level security;

-- Quitar policies públicas antiguas
drop policy if exists "Allow public select" on public.measurements;
drop policy if exists "Allow public insert" on public.measurements;
drop policy if exists "Allow public update" on public.measurements;
drop policy if exists "Allow public delete" on public.measurements;
drop policy if exists "Measurements select own" on public.measurements;
drop policy if exists "Measurements insert own" on public.measurements;
drop policy if exists "Measurements update own" on public.measurements;
drop policy if exists "Measurements delete own" on public.measurements;

create policy "Measurements select own"
  on public.measurements for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Measurements insert own"
  on public.measurements for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Measurements update own"
  on public.measurements for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Measurements delete own"
  on public.measurements for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.measurements to authenticated;

notify pgrst, 'reload schema';
