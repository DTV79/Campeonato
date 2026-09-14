-- Permite dejar sin definir la ronda inicial de eliminatorias.

CREATE OR REPLACE FUNCTION public.admin_guardar_configuracion(p_codigo text, p_configuracion jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_nombre text;
    v_id_excel text;
    v_anio smallint;
    v_fecha date;
    v_lugar text;
    v_horario text;
    v_version text;
    v_estado_texto text;
    v_estado text;
    v_tipo text;
    v_estructura text;
    v_num_grupos smallint;
    v_equipos_grupo smallint;
    v_hay_regrupos boolean;
    v_pasan_regrupos smallint;
    v_pasan_cruces smallint;
    v_puntos_arrastrados smallint;
    v_pistas smallint;
    v_ronda text;
    v_criterio text;
    v_hay_palas boolean;
    v_posicion_palas smallint;
    v_objetivo smallint;
    v_maximo smallint;
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado' using errcode = '42501';
    end if;

    if jsonb_typeof(p_configuracion) <> 'object' then
        raise exception 'La configuración no tiene un formato válido';
    end if;

    if not exists (
        select 1 from public.campeonatos where codigo_campeonato = p_codigo
    ) then
        raise exception 'El campeonato no existe';
    end if;

    v_nombre := nullif(btrim(p_configuracion ->> 'nombre_campeonato'), '');
    v_id_excel := nullif(btrim(p_configuracion ->> 'id_campeonato'), '');
    v_anio := (p_configuracion ->> 'anio_campeonato')::smallint;
    v_fecha := nullif(p_configuracion ->> 'fecha_campeonato', '')::date;
    v_lugar := nullif(btrim(p_configuracion ->> 'lugar_campeonato'), '');
    v_horario := nullif(btrim(p_configuracion ->> 'horario_campeonato'), '');
    v_version := nullif(btrim(p_configuracion ->> 'version_web'), '');
    v_estado_texto := lower(btrim(coalesce(p_configuracion ->> 'estado_torneo', '')));
    v_estado := case v_estado_texto
        when 'pretorneo' then 'pretorneo'
        when 'inscripciones' then 'inscripciones'
        when 'en juego' then 'en_juego'
        when 'en_juego' then 'en_juego'
        when 'finalizado' then 'finalizado'
        else null
    end;
    v_tipo := nullif(btrim(p_configuracion ->> 'tipo_campeonato'), '');
    v_estructura := nullif(btrim(p_configuracion ->> 'estructura_primera_fase'), '');
    v_num_grupos := coalesce(nullif(p_configuracion ->> 'num_grupos_iniciales', '')::smallint, 0);
    v_equipos_grupo := coalesce(nullif(p_configuracion ->> 'equipos_por_grupo', '')::smallint, 0);
    v_hay_regrupos := coalesce((p_configuracion ->> 'hay_regrupos')::boolean, false);
    v_pasan_regrupos := coalesce(nullif(p_configuracion ->> 'equipos_pasan_a_regrupos', '')::smallint, 0);
    v_pasan_cruces := coalesce(nullif(p_configuracion ->> 'equipos_pasan_a_cruces_por_grupo', '')::smallint, 0);
    v_puntos_arrastrados := coalesce(nullif(p_configuracion ->> 'puntos_partido_arrastrado', '')::smallint, 0);
    v_pistas := coalesce(nullif(p_configuracion ->> 'num_pistas_disponibles', '')::smallint, 0);
    v_ronda := nullif(btrim(p_configuracion ->> 'ronda_inicial_eliminatorias'), '');
    v_criterio := nullif(btrim(p_configuracion ->> 'criterio_generar_cruces'), '');
    v_hay_palas := case
        when jsonb_typeof(p_configuracion -> 'hay_copa_palas_playa') = 'boolean'
            then (p_configuracion ->> 'hay_copa_palas_playa')::boolean
        else null
    end;
    v_posicion_palas := coalesce(nullif(p_configuracion ->> 'posicion_inicio_palas_playa', '')::smallint, 0);
    v_objetivo := coalesce(nullif(p_configuracion ->> 'puntos_objetivo_set', '')::smallint, 0);
    v_maximo := coalesce(nullif(p_configuracion ->> 'puntos_maximos_por_set', '')::smallint, 0);

    if v_nombre is null or v_id_excel is null then
        raise exception 'Indica el nombre y el identificador del campeonato';
    end if;
    if v_anio < 2000 or v_anio > 2100 then
        raise exception 'El año del campeonato no es válido';
    end if;
    if v_estado is null then
        raise exception 'El estado del torneo no es válido';
    end if;
    if v_tipo is not null and v_tipo not in ('Liguilla', 'Grupos') then
        raise exception 'El tipo debe ser Liguilla, Grupos o quedar sin definir';
    end if;
    if v_tipo is null then
        v_estructura := null;
        v_num_grupos := null;
    elsif v_estructura not in ('Liguilla Única', '2 Grupos', '4 Grupos') then
        raise exception 'La estructura de la primera fase no es válida';
    elsif (v_tipo = 'Liguilla' and v_estructura <> 'Liguilla Única')
       or (v_tipo = 'Grupos' and v_estructura = 'Liguilla Única') then
        raise exception 'El tipo y la estructura de la primera fase no son compatibles';
    end if;
    if v_tipo = 'Grupos' and v_num_grupos not in (2, 4) then
        raise exception 'Los campeonatos por grupos deben tener 2 o 4 grupos';
    end if;
    if v_tipo = 'Grupos' and v_equipos_grupo < 2 then
        raise exception 'Debe haber al menos dos equipos por grupo';
    end if;
    if v_hay_regrupos and v_pasan_regrupos < 2 then
        raise exception 'Indica cuántos equipos pasan a ReGrupos';
    end if;
    if v_pasan_cruces < 1 then
        raise exception 'Debe pasar al menos un equipo a eliminatorias';
    end if;
    if v_pistas < 1 then
        raise exception 'Debe haber al menos una pista disponible';
    end if;
    if v_ronda is not null and v_ronda not in ('Octavos', 'Cuartos', 'Semifinales', 'Final') then
        raise exception 'La ronda inicial de eliminatorias no es válida';
    end if;
    if v_criterio not in ('Por Clasificación', 'No Enfrentados') then
        raise exception 'El criterio para generar cruces no es válido';
    end if;
    if v_hay_palas and v_posicion_palas < 1 then
        raise exception 'Indica desde qué posición se juega Palas de Playa';
    end if;
    if v_objetivo < 1 or v_maximo < v_objetivo then
        raise exception 'La puntuación máxima debe ser igual o superior a la puntuación objetivo';
    end if;

    update public.campeonatos
    set nombre = v_nombre,
        id_campeonato_excel = v_id_excel,
        anio = v_anio,
        fecha_inicio = v_fecha,
        localidad = v_lugar,
        horario = v_horario,
        version_web = v_version,
        estado = v_estado,
        tipo_campeonato = v_tipo,
        estructura_primera_fase = v_estructura,
        numero_grupos = case when v_tipo is null then null when v_tipo = 'Grupos' then v_num_grupos else 1 end,
        hay_regrupos = v_hay_regrupos,
        hay_palas_playa = v_hay_palas,
        configuracion = coalesce(configuracion, '{}'::jsonb)
            || p_configuracion
            || jsonb_build_object(
                'tipo_campeonato', coalesce(v_tipo, ''),
                'estructura_primera_fase', coalesce(v_estructura, ''),
                'num_grupos_iniciales', v_num_grupos,
                'hay_copa_palas_playa', v_hay_palas,
                'ronda_inicial_eliminatorias', coalesce(v_ronda, '')
            ),
        configuracion_gestionada_admin = true,
        configuracion_gestionada_admin_at = now(),
        updated_at = now()
    where codigo_campeonato = p_codigo;

    return public.admin_obtener_configuracion(p_codigo);
end;
$function$
;

revoke all on function public.admin_guardar_configuracion(text, jsonb) from public, anon;
grant execute on function public.admin_guardar_configuracion(text, jsonb) to authenticated;
