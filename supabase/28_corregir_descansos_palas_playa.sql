
create or replace function public.web_descansos_palas(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
with configuracion as (
  select
    c.tipo_campeonato,
    coalesce(c.configuracion ->> 'formato_acceso_eliminatorias', 'Cruces normales') as formato,
    greatest(
      coalesce(nullif(c.configuracion ->> 'posicion_inicio_palas_playa', '')::integer, 1),
      1
    ) as posicion_inicio
  from public.campeonatos c
  where c.codigo_campeonato = p_codigo
),
primera_ronda_palas as (
  select p.codigo_ronda
  from public.partidos p
  left join public.rondas_fase rf
    on rf.codigo_campeonato = p.codigo_campeonato
   and rf.codigo_fase = p.codigo_fase
   and rf.codigo_ronda = p.codigo_ronda
  where p.codigo_campeonato = p_codigo
    and p.codigo_fase = 'PP'
  group by p.codigo_ronda
  order by min(rf.orden) nulls last, p.codigo_ronda
  limit 1
),
primera_ronda_cuadro as (
  select p.codigo_ronda
  from public.partidos p
  left join public.rondas_fase rf
    on rf.codigo_campeonato = p.codigo_campeonato
   and rf.codigo_fase = p.codigo_fase
   and rf.codigo_ronda = p.codigo_ronda
  where p.codigo_campeonato = p_codigo
    and p.codigo_fase = 'MM'
  group by p.codigo_ronda
  order by min(rf.orden) nulls last, p.codigo_ronda
  limit 1
),
participantes_ids as (
  select c.id_equipo
  from public.clasificaciones c
  cross join configuracion cfg
  where cfg.tipo_campeonato = 'Liguilla'
    and c.codigo_campeonato = p_codigo
    and c.codigo_fase = 'GR'
    and c.posicion >= cfg.posicion_inicio

  union

  select c.id_equipo
  from public.clasificaciones c
  cross join configuracion cfg
  where cfg.tipo_campeonato <> 'Liguilla'
    and cfg.formato = 'Campeones de ReGrupo directos a semifinales'
    and c.codigo_campeonato = p_codigo
    and c.codigo_fase = 'RG'
    and c.posicion = 4

  union

  select public.equipo_resultado_cuadro(p.id_partido, true)
  from public.partidos p
  cross join configuracion cfg
  where cfg.tipo_campeonato <> 'Liguilla'
    and cfg.formato = 'Campeones de ReGrupo directos a semifinales'
    and p.codigo_campeonato = p_codigo
    and p.codigo_fase = 'MM'
    and p.codigo_ronda = 'CUA'
    and p.estado = 'jugado'

  union

  select public.equipo_resultado_cuadro(p.id_partido, true)
  from public.partidos p
  join primera_ronda_cuadro pr on pr.codigo_ronda = p.codigo_ronda
  cross join configuracion cfg
  where cfg.tipo_campeonato <> 'Liguilla'
    and cfg.formato <> 'Campeones de ReGrupo directos a semifinales'
    and p.codigo_campeonato = p_codigo
    and p.codigo_fase = 'MM'
    and p.estado = 'jugado'
),
participantes as (
  select
    ids.id_equipo,
    public.ranking_base_equipo_cuadro(p_codigo, ids.id_equipo) as posicion,
    concat_ws(' / ', j1.alias, j2.alias) as equipo
  from participantes_ids ids
  join public.equipos e
    on e.codigo_campeonato = p_codigo
   and e.id_equipo = ids.id_equipo
  join public.jugadores j1 on j1.id_jugador = e.id_jugador_1
  join public.jugadores j2 on j2.id_jugador = e.id_jugador_2
  where ids.id_equipo is not null
),
en_primera_ronda as (
  select p.id_equipo_1 as id_equipo
  from public.partidos p
  join primera_ronda_palas pr on pr.codigo_ronda = p.codigo_ronda
  where p.codigo_campeonato = p_codigo
    and p.codigo_fase = 'PP'
  union
  select p.id_equipo_2
  from public.partidos p
  join primera_ronda_palas pr on pr.codigo_ronda = p.codigo_ronda
  where p.codigo_campeonato = p_codigo
    and p.codigo_fase = 'PP'
)
select coalesce(
  jsonb_agg(
    jsonb_build_object(
      'id_equipo', participantes.id_equipo,
      'equipo', participantes.equipo,
      'posicion', participantes.posicion,
      'codigo_ronda', primera_ronda_palas.codigo_ronda,
      'mensaje', 'Descansa y pasa directamente'
    )
    order by participantes.posicion, participantes.id_equipo
  ),
  '[]'::jsonb
)
from participantes
cross join primera_ronda_palas
where not exists (
  select 1
  from en_primera_ronda usados
  where usados.id_equipo = participantes.id_equipo
);
$function$;

revoke all on function public.web_descansos_palas(text) from public;
grant execute on function public.web_descansos_palas(text) to anon, authenticated, service_role;
