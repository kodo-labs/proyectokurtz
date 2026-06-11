-- BookDesk Supabase schema
-- Run this in Supabase SQL Editor, then configure frontend/.env.local.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('member', 'admin')),
  avatar text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 2))
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        avatar = excluded.avatar;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.resources (
  id text primary key,
  name text not null,
  type text not null check (type in ('room', 'desk')),
  capacity integer not null default 1,
  floor integer not null default 1,
  amenities text[] not null default '{}',
  description text,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id text primary key,
  resource_id text not null references public.resources(id) on delete cascade,
  user_id text not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'pending', 'cancelled')),
  title text not null default 'Reserva',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id text primary key,
  reservation_id text not null references public.reservations(id) on delete cascade,
  user_id text not null,
  actor_id text not null,
  channel text not null default 'email' check (channel in ('email')),
  recipient_email text not null,
  event text not null check (event in ('confirmed', 'cancelled', 'new_reservation')),
  status text not null default 'processing' check (status in ('processing', 'sent', 'failed')),
  provider_id text,
  error text,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_logs_reservation_event_user_key unique (reservation_id, event, user_id)
);

alter table public.notification_logs
  add column if not exists channel text not null default 'email';

alter table public.notification_logs
  drop constraint if exists notification_logs_event_check;

alter table public.notification_logs
  add constraint notification_logs_event_check
  check (event in ('confirmed', 'cancelled', 'new_reservation'));

alter table public.notification_logs
  drop constraint if exists notification_logs_reservation_event_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.notification_logs'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (reservation_id, event, user_id)'
  ) then
    alter table public.notification_logs
      add constraint notification_logs_reservation_event_user_key
      unique (reservation_id, event, user_id);
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.reservations enable row level security;
alter table public.notification_logs enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
drop policy if exists "Users read own profile and admins read all" on public.profiles;
create policy "Users read own profile and admins read all"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or public.is_admin()
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Resources are readable by everyone" on public.resources;
create policy "Resources are readable by everyone"
  on public.resources for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can create resources" on public.resources;
drop policy if exists "Admins can create resources" on public.resources;
create policy "Admins can create resources"
  on public.resources for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Authenticated users can update resources" on public.resources;
drop policy if exists "Admins can update resources" on public.resources;
create policy "Admins can update resources"
  on public.resources for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated users can delete resources" on public.resources;
drop policy if exists "Admins can delete resources" on public.resources;
create policy "Admins can delete resources"
  on public.resources for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Reservations are readable by authenticated users" on public.reservations;
drop policy if exists "Users read own reservations and admins read all" on public.reservations;
create policy "Users read own reservations and admins read all"
  on public.reservations for select
  to authenticated
  using (
    user_id = auth.uid()::text
    or public.is_admin()
  );

drop policy if exists "Authenticated users can create reservations" on public.reservations;
drop policy if exists "Users create own reservations and admins create blocks" on public.reservations;
create policy "Users create own reservations and admins create blocks"
  on public.reservations for insert
  to authenticated
  with check (
    user_id = auth.uid()::text
    or (
      is_blocked = true
      and public.is_admin()
    )
  );

drop policy if exists "Authenticated users can update reservations" on public.reservations;
drop policy if exists "Users update own reservations and admins update all" on public.reservations;
create policy "Users update own reservations and admins update all"
  on public.reservations for update
  to authenticated
  using (
    user_id = auth.uid()::text
    or public.is_admin()
  )
  with check (
    user_id = auth.uid()::text
    or public.is_admin()
  );

insert into public.resources (id, name, type, capacity, floor, amenities, description)
values
  ('sala-alpha', 'Sala Alpha', 'room', 8, 2, array['Proyector', 'Pizarron', 'AC', 'Video conferencia'], 'Sala de reuniones equipada para equipos medianos.'),
  ('sala-beta', 'Sala Beta', 'room', 4, 1, array['TV 55"', 'Pizarron', 'AC'], 'Sala compacta, ideal para reuniones pequenas o entrevistas.'),
  ('sala-gamma', 'Sala Gamma', 'room', 12, 3, array['Proyector 4K', 'AC', 'Video conferencia', 'Sistema de audio'], 'Sala grande para workshops, demos o reuniones de equipo.'),
  ('escritorio-a1', 'Escritorio A1', 'desk', 1, 1, array['Monitor 27"', 'Teclado', 'Mouse'], 'Escritorio en zona tranquila, vista al parque.'),
  ('escritorio-a2', 'Escritorio A2', 'desk', 1, 1, array['Monitor 24"'], 'Escritorio estandar cerca de la ventana.'),
  ('escritorio-a3', 'Escritorio A3', 'desk', 1, 1, array['Monitor 27"', 'Teclado mecanico', 'Mouse'], 'Escritorio premium en zona silenciosa.'),
  ('escritorio-b1', 'Escritorio B1', 'desk', 1, 2, array['Monitor 24"', 'Teclado'], 'Escritorio en planta alta, zona colaborativa.'),
  ('escritorio-b2', 'Escritorio B2', 'desk', 1, 2, array['Monitor 24"'], 'Escritorio en planta alta, cerca de la cocina.')
on conflict (id) do nothing;

-- Demo credentials suggested for Supabase Auth:
-- memberdemo@bookdesk.com / memberdemo
-- admindemo@bookdesk.com / admindemo
-- Create them from Authentication > Users. Then set the admin profile role to admin.
