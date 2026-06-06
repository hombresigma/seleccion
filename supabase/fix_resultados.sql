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
      select jsonb_build_object('id', id, 'nombre', nombre, 'acumulado', acumulado)
      from filas
      where acumulado > 0
      order by acumulado desc, nombre
      limit 1
    )
  ) into resultado;

  return resultado;
end;
$$;

-- La función es SECURITY DEFINER: solo usuarios autenticados pueden ejecutarla.
revoke execute on function public.resultados_concurso(uuid) from anon, public;
grant execute on function public.resultados_concurso(uuid) to authenticated;

