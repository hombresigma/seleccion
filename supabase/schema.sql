-- ============================================================================
-- Selección de Docentes — Esquema de base de datos (PostgreSQL / Supabase)
-- ----------------------------------------------------------------------------
-- Ejecutá este archivo completo en:  Supabase Dashboard -> SQL Editor -> New query
-- Es idempotente: se puede correr varias veces sin romper nada.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Perfiles de usuario (rol: admin | jurado)
--    Se crea automáticamente al registrarse un usuario en Supabase Auth.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  nombre      text,
  rol         text not null default 'jurado' check (rol in ('admin', 'jurado')),
  created_at  timestamptz not null default now()
);

-- Crea el perfil al darse de alta. El PRIMER usuario registrado queda como admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  es_primero boolean;
begin
  select count(*) = 0 into es_primero from public.profiles;
  insert into public.profiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', new.email),
    case when es_primero then 'admin' else 'jurado' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: ¿el usuario actual es admin?
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Concursos docentes
-- ----------------------------------------------------------------------------
create table if not exists public.concursos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  estado      text not null default 'abierto' check (estado in ('abierto', 'cerrado')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. Criterios de evaluación (cada uno con su PESO en %).
--    El total de los pesos de un concurso debe ser 100% (se valida abajo).
-- ----------------------------------------------------------------------------
create table if not exists public.criterios (
  id          uuid primary key default gen_random_uuid(),
  concurso_id uuid not null references public.concursos(id) on delete cascade,
  nombre      text not null,
  peso        numeric(6,2) not null check (peso >= 0 and peso <= 100),
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_criterios_concurso on public.criterios(concurso_id);

-- Devuelve la suma de pesos de un concurso (para avisar si != 100).
create or replace function public.suma_pesos(p_concurso_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(peso), 0) from public.criterios where concurso_id = p_concurso_id;
$$;

-- ----------------------------------------------------------------------------
-- 4. Participantes (docentes que se presentan al concurso)
-- ----------------------------------------------------------------------------
create table if not exists public.participantes (
  id          uuid primary key default gen_random_uuid(),
  concurso_id uuid not null references public.concursos(id) on delete cascade,
  nombre      text not null,
  documento   text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_participantes_concurso on public.participantes(concurso_id);

-- ----------------------------------------------------------------------------
-- 5. Calificaciones: cada miembro del jurado puntúa (0-100) a cada
--    participante en cada criterio. Luego se promedia entre el jurado.
-- ----------------------------------------------------------------------------
create table if not exists public.calificaciones (
  id              uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.participantes(id) on delete cascade,
  criterio_id     uuid not null references public.criterios(id) on delete cascade,
  evaluador_id    uuid not null references auth.users(id) on delete cascade,
  puntaje         numeric(6,2) not null check (puntaje >= 0 and puntaje <= 100),
  updated_at      timestamptz not null default now(),
  unique (participante_id, criterio_id, evaluador_id)
);
create index if not exists idx_calif_participante on public.calificaciones(participante_id);

-- ============================================================================
-- 6. CÁLCULO PONDERADO (todo en Postgres)
--    Para cada participante:
--      - promedio del jurado por criterio
--      - aporte ponderado = promedio * (peso / 100)
--      - acumulado = suma de aportes
--    Devuelve además quién es el participante con mayor calificación (ganador).
-- ============================================================================
create or replace function public.resultados_concurso(p_concurso_id uuid)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  resultado jsonb;
begin
  with
  crit as (
    select id, nombre, peso, orden
    from public.criterios
    where concurso_id = p_concurso_id
  ),
  -- promedio del jurado por participante + criterio
  prom as (
    select
      p.id as participante_id,
      c.id as criterio_id,
      avg(ca.puntaje) as promedio,
      count(ca.puntaje) as n_evaluadores
    from public.participantes p
    cross join crit c
    left join public.calificaciones ca
      on ca.participante_id = p.id and ca.criterio_id = c.id
    where p.concurso_id = p_concurso_id
    group by p.id, c.id
  ),
  -- detalle por participante/criterio con aporte ponderado
  detalle as (
    select
      pr.participante_id,
      jsonb_agg(
        jsonb_build_object(
          'criterio_id', c.id,
          'nombre', c.nombre,
          'peso', c.peso,
          'promedio', round(coalesce(pr.promedio, 0), 2),
          'aporte', round(coalesce(pr.promedio, 0) * c.peso / 100.0, 2),
          'n_evaluadores', coalesce(pr.n_evaluadores, 0)
        ) order by c.orden, c.nombre
      ) as criterios,
      round(sum(coalesce(pr.promedio, 0) * c.peso / 100.0), 2) as acumulado
    from prom pr
    join crit c on c.id = pr.criterio_id
    group by pr.participante_id
  ),
  filas as (
    select
      p.id,
      p.nombre,
      p.documento,
      coalesce(d.criterios, '[]'::jsonb) as criterios,
      coalesce(d.acumulado, 0) as acumulado
    from public.participantes p
    left join detalle d on d.participante_id = p.id
    where p.concurso_id = p_concurso_id
  )
  select jsonb_build_object(
    'criterios', (
      select coalesce(jsonb_agg(
        jsonb_build_object('id', id, 'nombre', nombre, 'peso', peso)
        order by orden, nombre
      ), '[]'::jsonb) from crit
    ),
    'suma_pesos', (select coalesce(sum(peso), 0) from crit),
    'participantes', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', id, 'nombre', nombre, 'documento', documento,
          'criterios', criterios, 'acumulado', acumulado
        ) order by acumulado desc, nombre
      ), '[]'::jsonb) from filas
    ),
    'ganador', (
      select case when count(*) = 0 then null else
        jsonb_build_object('id', id, 'nombre', nombre, 'acumulado', acumulado)
      end
      from filas
      where acumulado = (select max(acumulado) from filas) and acumulado > 0
      limit 1
    )
  ) into resultado;

  return resultado;
end;
$$;

-- ============================================================================
-- 7. SEGURIDAD (Row Level Security)
--    - Todos los usuarios autenticados pueden LEER.
--    - Solo ADMIN gestiona concursos / criterios / participantes.
--    - Cada miembro del jurado guarda SUS propias calificaciones.
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.concursos      enable row level security;
alter table public.criterios      enable row level security;
alter table public.participantes  enable row level security;
alter table public.calificaciones enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- concursos
drop policy if exists concursos_select on public.concursos;
create policy concursos_select on public.concursos
  for select to authenticated using (true);
drop policy if exists concursos_admin on public.concursos;
create policy concursos_admin on public.concursos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- criterios
drop policy if exists criterios_select on public.criterios;
create policy criterios_select on public.criterios
  for select to authenticated using (true);
drop policy if exists criterios_admin on public.criterios;
create policy criterios_admin on public.criterios
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- participantes
drop policy if exists participantes_select on public.participantes;
create policy participantes_select on public.participantes
  for select to authenticated using (true);
drop policy if exists participantes_admin on public.participantes;
create policy participantes_admin on public.participantes
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- calificaciones: leer todas; escribir solo las propias
drop policy if exists calif_select on public.calificaciones;
create policy calif_select on public.calificaciones
  for select to authenticated using (true);
drop policy if exists calif_insert_own on public.calificaciones;
create policy calif_insert_own on public.calificaciones
  for insert to authenticated with check (evaluador_id = auth.uid());
drop policy if exists calif_update_own on public.calificaciones;
create policy calif_update_own on public.calificaciones
  for update to authenticated using (evaluador_id = auth.uid()) with check (evaluador_id = auth.uid());
drop policy if exists calif_delete_own on public.calificaciones;
create policy calif_delete_own on public.calificaciones
  for delete to authenticated using (evaluador_id = auth.uid());

-- ============================================================================
-- Fin del esquema.
-- ============================================================================
