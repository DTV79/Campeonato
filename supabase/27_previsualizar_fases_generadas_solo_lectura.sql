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

-- Corrige la obtención del nombre de pareja: equipos no tiene nombre_equipo.
CREATE OR REPLACE FUNCTION public.admin_previsualizar_eliminatorias_propuesta(p_codigo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_c public.campeonatos%rowtype; v_config jsonb; v_fase text; v_ronda text; v_rc text; v_total int; v_por_grupo int; v_num_grupos int; v_criterio text; v_equipos text[]; v_nombres jsonb; v_partidos jsonb:='[]'::jsonb; v_i int; v_a text; v_b text; v_lista text[]; v_n int; v_j int; v_mejor_j int; v_coste int; v_mejor_coste int;
begin
 if not public.es_administrador() then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
 select * into v_c from public.campeonatos where codigo_campeonato=p_codigo; if not found then return jsonb_build_object('ok',false,'error','El campeonato no existe'); end if; v_config:=v_c.configuracion; v_fase:=case when v_c.tipo_campeonato='Liguilla' then 'GR' when v_c.hay_regrupos then 'RG' else 'GR' end;
 v_ronda:=nullif(v_config->>'ronda_inicial_eliminatorias',''); v_rc:=case v_ronda when 'Octavos' then 'OCT' when 'Cuartos' then 'CUA' when 'Semifinales' then 'SEM' when 'Final' then 'FIN' end; v_total:=case v_rc when 'OCT' then 16 when 'CUA' then 8 when 'SEM' then 4 when 'FIN' then 2 end; if v_rc is null then return jsonb_build_object('ok',false,'error','Configura y guarda primero la ronda inicial de las eliminatorias'); end if;
 if exists(select 1 from public.partidos where codigo_campeonato=p_codigo and codigo_fase='MM') then return jsonb_build_object('ok',false,'error','Ya existe un cuadro de eliminatorias'); end if;
 if not exists(select 1 from public.partidos where codigo_campeonato=p_codigo and codigo_fase=v_fase) then return jsonb_build_object('ok',false,'error',case when v_fase='RG' then 'Primero debes generar y jugar los ReGrupos' when v_c.tipo_campeonato='Liguilla' then 'Primero debes jugar la liguilla' else 'Primero debes generar y jugar los grupos' end); end if;
 if exists(select 1 from public.partidos where codigo_campeonato=p_codigo and codigo_fase=v_fase and estado<>'jugado') then return jsonb_build_object('ok',false,'error','Todavía quedan partidos pendientes en la fase que da acceso a las eliminatorias'); end if;
 if v_c.tipo_campeonato='Liguilla' then
   perform public.recalcular_clasificacion_liguilla(p_codigo); select array_agg(id_equipo order by posicion) into v_equipos from public.clasificaciones where codigo_campeonato=p_codigo and codigo_fase='GR' and posicion<=v_total;
 else
   perform public.recalcular_clasificacion_fase(p_codigo,v_fase); v_por_grupo:=greatest(coalesce(nullif(v_config->>'equipos_pasan_a_cruces_por_grupo','')::int,0),0); select count(distinct codigo_grupo)::int into v_num_grupos from public.clasificaciones where codigo_campeonato=p_codigo and codigo_fase=v_fase; if v_por_grupo*v_num_grupos<>v_total then return jsonb_build_object('ok',false,'error',format('La ronda %s necesita %s equipos y la configuración aporta %s',v_ronda,v_total,v_por_grupo*v_num_grupos)); end if; select array_agg(id_equipo order by codigo_grupo,posicion) into v_equipos from public.clasificaciones where codigo_campeonato=p_codigo and codigo_fase=v_fase and posicion<=v_por_grupo;
 end if;
 if coalesce(array_length(v_equipos,1),0)<>v_total then return jsonb_build_object('ok',false,'error',format('La clasificación todavía no contiene los %s equipos necesarios',v_total)); end if;
 v_criterio:=coalesce(nullif(v_config->>'criterio_generar_cruces',''),'Por Clasificación'); v_lista:=v_equipos; v_n:=array_length(v_lista,1);
 if lower(v_criterio) like '%clasific%' then select array_agg(u.id_equipo order by public.ranking_base_equipo_cuadro(p_codigo,u.id_equipo),u.ord) into v_lista from unnest(v_lista) with ordinality u(id_equipo,ord); for v_i in 1..v_n/2 loop v_partidos:=v_partidos||jsonb_build_array(jsonb_build_object('orden',v_i,'equipo_1',v_lista[v_i],'equipo_2',v_lista[v_n+1-v_i])); end loop;
 elsif lower(v_criterio) like '%aleator%' then return jsonb_build_object('ok',true,'puede_generar',true,'tipo_campeonato',v_c.tipo_campeonato,'fase_origen',v_fase,'ronda_inicial',v_ronda,'criterio_cruces',v_criterio,'clasificados',v_total,'equipos',to_jsonb(v_equipos),'partidos',jsonb_build_array(),'mensaje','El criterio es Aleatorio: los cruces se sortearán únicamente al confirmar para que la previsualización no condicione el sorteo.');
 else
   select array_agg(u.id_equipo order by public.ranking_base_equipo_cuadro(p_codigo,u.id_equipo),u.ord) into v_lista from unnest(v_lista) with ordinality u(id_equipo,ord); for v_i in 1..v_n/2 loop v_a:=v_lista[1]; v_mejor_j:=2; v_mejor_coste:=2147483647; for v_j in 2..array_length(v_lista,1) loop select count(*)::int into v_coste from public.partidos p where p.codigo_campeonato=p_codigo and p.estado='jugado' and ((p.id_equipo_1=v_a and p.id_equipo_2=v_lista[v_j]) or(p.id_equipo_1=v_lista[v_j] and p.id_equipo_2=v_a)); if v_coste<v_mejor_coste then v_mejor_coste:=v_coste;v_mejor_j:=v_j; end if; end loop; v_b:=v_lista[v_mejor_j]; v_partidos:=v_partidos||jsonb_build_array(jsonb_build_object('orden',v_i,'equipo_1',v_a,'equipo_2',v_b,'enfrentamientos_previos',v_mejor_coste)); v_lista:=array_remove(array_remove(v_lista,v_a),v_b); end loop;
 end if;
 select coalesce(jsonb_object_agg(e.id_equipo, concat_ws(' / ', j1.alias, j2.alias)),'{}'::jsonb)
   into v_nombres
   from public.equipos e
   join public.jugadores j1 on j1.id_jugador=e.id_jugador_1
   join public.jugadores j2 on j2.id_jugador=e.id_jugador_2
   where e.codigo_campeonato=p_codigo and e.id_equipo=any(v_equipos);
 return jsonb_build_object('ok',true,'puede_generar',true,'tipo_campeonato',v_c.tipo_campeonato,'fase_origen',v_fase,'ronda_inicial',v_ronda,'criterio_cruces',v_criterio,'clasificados',v_total,'equipos',to_jsonb(v_equipos),'nombres_equipos',v_nombres,'partidos',v_partidos);
end; $function$

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
