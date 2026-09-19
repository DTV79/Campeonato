-- Permite consultar fases ya generadas sin autorizar su regeneración.
-- Las funciones originales de propuesta se conservan como helpers privados.

alter function public.admin_previsualizar_regrupos(text)
  rename to admin_previsualizar_regrupos_propuesta;

CREATE OR REPLACE FUNCTION public.admin_previsualizar_regrupos(p_codigo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_existentes integer;
  v_jugados integer;
  v_total integer;
  v_num_grupos integer;
  v_grupos jsonb;
  v_repetir boolean;
begin
  if not public.es_administrador() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  select count(*)::integer,
         count(*) filter (where p.estado = 'jugado')::integer
    into v_existentes, v_jugados
  from public.partidos p
  where p.codigo_campeonato = p_codigo
    and p.codigo_fase = 'RG';

  if v_existentes > 0 then
    select coalesce((c.configuracion ->> 'repetir_enfrentamientos_regrupos')::boolean, false)
      into v_repetir
    from public.campeonatos c
    where c.codigo_campeonato = p_codigo;

    select count(*)::integer
      into v_total
    from public.equipos_grupo_fase egf
    where egf.codigo_campeonato = p_codigo
      and egf.codigo_fase = 'RG';

    with grupos_actuales as (
      select egf.codigo_grupo,
             coalesce(gf.nombre, 'ReGrupo ' || egf.codigo_grupo) as nombre,
             coalesce(gf.orden, 32767) as orden_grupo,
             count(*)::integer as cantidad,
             jsonb_agg(
               concat_ws(' / ', j1.alias, j2.alias)
               order by egf.orden, egf.id_equipo
             ) as equipos
      from public.equipos_grupo_fase egf
      join public.equipos e
        on e.codigo_campeonato = egf.codigo_campeonato
       and e.id_equipo = egf.id_equipo
      join public.jugadores j1 on j1.id_jugador = e.id_jugador_1
      join public.jugadores j2 on j2.id_jugador = e.id_jugador_2
      left join public.grupos_fase gf
        on gf.codigo_campeonato = egf.codigo_campeonato
       and gf.codigo_fase = egf.codigo_fase
       and gf.codigo_grupo = egf.codigo_grupo
      where egf.codigo_campeonato = p_codigo
        and egf.codigo_fase = 'RG'
      group by egf.codigo_grupo, gf.nombre, gf.orden
    )
    select count(*)::integer,
           coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'codigo', codigo_grupo,
                 'nombre', nombre,
                 'cantidad', cantidad,
                 'equipos', equipos
               )
               order by orden_grupo, codigo_grupo
             ),
             '[]'::jsonb
           )
      into v_num_grupos, v_grupos
    from grupos_actuales;

    return jsonb_build_object(
      'ok', true,
      'ya_generados', true,
      'solo_lectura', true,
      'puede_generar', false,
      'equipos', v_total,
      'numero_regrupos', v_num_grupos,
      'partidos_existentes', v_existentes,
      'partidos_jugados', v_jugados,
      'partidos_pendientes', v_existentes - v_jugados,
      'repetir_enfrentamientos', coalesce(v_repetir, false),
      'regrupos', v_grupos,
      'mensaje', format(
        'ReGrupos ya generados: %s partidos existentes (%s jugados y %s pendientes).',
        v_existentes, v_jugados, v_existentes - v_jugados
      )
    );
  end if;

  return public.admin_previsualizar_regrupos_propuesta(p_codigo);
end;
$function$
;

revoke all on function public.admin_previsualizar_regrupos_propuesta(text)
  from public, anon, authenticated;
revoke all on function public.admin_previsualizar_regrupos(text)
  from public, anon;
grant execute on function public.admin_previsualizar_regrupos(text)
  to authenticated, service_role;

alter function public.admin_previsualizar_eliminatorias(text)
  rename to admin_previsualizar_eliminatorias_propuesta;

CREATE OR REPLACE FUNCTION public.admin_previsualizar_eliminatorias(p_codigo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_existentes integer;
  v_jugados integer;
  v_ronda text;
  v_criterio text;
  v_partidos jsonb;
  v_nombres jsonb;
  v_clasificados integer;
begin
  if not public.es_administrador() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;

  select count(*)::integer,
         count(*) filter (where p.estado = 'jugado')::integer
    into v_existentes, v_jugados
  from public.partidos p
  where p.codigo_campeonato = p_codigo
    and p.codigo_fase = 'MM';

  if v_existentes > 0 then
    select coalesce(nullif(c.configuracion ->> 'criterio_generar_cruces', ''), 'Por Clasificación')
      into v_criterio
    from public.campeonatos c
    where c.codigo_campeonato = p_codigo;

    select p.codigo_ronda
      into v_ronda
    from public.partidos p
    left join public.rondas_fase rf
      on rf.codigo_campeonato = p.codigo_campeonato
     and rf.codigo_fase = p.codigo_fase
     and rf.codigo_ronda = p.codigo_ronda
    where p.codigo_campeonato = p_codigo
      and p.codigo_fase = 'MM'
    order by rf.orden nulls last, p.codigo_ronda, p.orden
    limit 1;

    select count(distinct x.id_equipo)::integer
      into v_clasificados
    from (
      select p.id_equipo_1 as id_equipo
      from public.partidos p
      where p.codigo_campeonato = p_codigo
        and p.codigo_fase = 'MM'
        and p.codigo_ronda = v_ronda
      union
      select p.id_equipo_2
      from public.partidos p
      where p.codigo_campeonato = p_codigo
        and p.codigo_fase = 'MM'
        and p.codigo_ronda = v_ronda
    ) x
    where x.id_equipo is not null;

    select coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'id_partido', p.id_partido,
                 'orden', p.orden,
                 'ronda', p.codigo_ronda,
                 'equipo_1', p.id_equipo_1,
                 'equipo_2', p.id_equipo_2,
                 'pista', p.pista,
                 'estado', p.estado
               )
               order by rf.orden nulls last, p.codigo_ronda, p.orden
             ),
             '[]'::jsonb
           )
      into v_partidos
    from public.partidos p
    left join public.rondas_fase rf
      on rf.codigo_campeonato = p.codigo_campeonato
     and rf.codigo_fase = p.codigo_fase
     and rf.codigo_ronda = p.codigo_ronda
    where p.codigo_campeonato = p_codigo
      and p.codigo_fase = 'MM';

    select coalesce(
             jsonb_object_agg(
               e.id_equipo,
               concat_ws(' / ', j1.alias, j2.alias)
             ),
             '{}'::jsonb
           )
      into v_nombres
    from public.equipos e
    join public.jugadores j1 on j1.id_jugador = e.id_jugador_1
    join public.jugadores j2 on j2.id_jugador = e.id_jugador_2
    where e.codigo_campeonato = p_codigo
      and exists (
        select 1
        from public.partidos p
        where p.codigo_campeonato = p_codigo
          and p.codigo_fase = 'MM'
          and (p.id_equipo_1 = e.id_equipo or p.id_equipo_2 = e.id_equipo)
      );

    return jsonb_build_object(
      'ok', true,
      'ya_generadas', true,
      'solo_lectura', true,
      'puede_generar', false,
      'ronda_inicial', v_ronda,
      'criterio_cruces', coalesce(v_criterio, 'Por Clasificación'),
      'fase_origen', 'Cuadro existente',
      'clasificados', coalesce(v_clasificados, 0),
      'partidos_existentes', v_existentes,
      'partidos_jugados', v_jugados,
      'partidos_pendientes', v_existentes - v_jugados,
      'partidos', v_partidos,
      'nombres_equipos', v_nombres,
      'mensaje', format(
        'Eliminatorias ya generadas: %s partidos existentes (%s jugados y %s pendientes).',
        v_existentes, v_jugados, v_existentes - v_jugados
      )
    );
  end if;

  return public.admin_previsualizar_eliminatorias_propuesta(p_codigo);
end;
$function$
;

revoke all on function public.admin_previsualizar_eliminatorias_propuesta(text)
  from public, anon, authenticated;
revoke all on function public.admin_previsualizar_eliminatorias(text)
  from public, anon;
grant execute on function public.admin_previsualizar_eliminatorias(text)
  to authenticated, service_role;
