-- ============================================================================
-- Datos de ejemplo (semilla) — Selección de Docentes
-- ----------------------------------------------------------------------------
-- Ejecutá DESPUÉS de schema.sql, en Supabase SQL Editor.
-- Crea un concurso con criterios típicos (los pesos suman 100%) y participantes.
-- Las CALIFICACIONES no se siembran: las carga el jurado desde la app (cada
-- una requiere un usuario autenticado real).
--
-- Es idempotente: si ya existe el concurso de ejemplo, no lo duplica.
-- ============================================================================

do $$
declare
  v_concurso uuid;
begin
  -- ¿ya existe el concurso de ejemplo?
  select id into v_concurso
  from public.concursos
  where nombre = 'Concurso de ejemplo — Profesor Adjunto'
  limit 1;

  if v_concurso is null then
    insert into public.concursos (nombre, descripcion)
    values (
      'Concurso de ejemplo — Profesor Adjunto',
      'Cátedra de Álgebra I — Dedicación simple. Datos de demostración.'
    )
    returning id into v_concurso;

    -- Criterios típicos de un concurso docente universitario (suman 100%)
    insert into public.criterios (concurso_id, nombre, peso, orden) values
      (v_concurso, 'Antecedentes académicos (títulos y posgrados)', 25, 1),
      (v_concurso, 'Antecedentes docentes (experiencia)',           20, 2),
      (v_concurso, 'Investigación y publicaciones',                 15, 3),
      (v_concurso, 'Antecedentes profesionales y de extensión',     10, 4),
      (v_concurso, 'Prueba de oposición (clase pública)',           20, 5),
      (v_concurso, 'Entrevista personal',                           10, 6);

    -- Participantes de ejemplo
    insert into public.participantes (concurso_id, nombre, documento) values
      (v_concurso, 'García, María Laura',   '28.456.789'),
      (v_concurso, 'Pérez, Juan Ignacio',   '30.111.222'),
      (v_concurso, 'Sosa, Romina Belén',    '27.333.444');

    raise notice 'Semilla creada. Concurso id: %', v_concurso;
  else
    raise notice 'El concurso de ejemplo ya existe (id: %). No se duplica.', v_concurso;
  end if;
end $$;
