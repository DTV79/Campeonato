-- Impide que admin_actualizar_cuadro vuelva a emparejar una ronda de
-- Palas de Playa ya creada y hace avanzar a los ganadores a la final.

CREATE OR REPLACE FUNCTION public.admin_actualizar_cuadro_especial(p_codigo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_1a text; v_1b text; v_4a text; v_4b text;
    v_g_c1 text; v_g_c2 text; v_p_c1 text; v_p_c2 text;
    v_g_s1 text; v_g_s2 text; v_g_ps1 text; v_g_ps2 text;
    v_hay_palas boolean;
    v_creados integer := 0;
    v_equipos_pp text[];
begin
    if not public.es_administrador() then raise exception 'Acceso no autorizado' using errcode = '42501'; end if;

    perform public.recalcular_clasificacion_fase(p_codigo, 'RG');
    select coalesce(c.hay_palas_playa, false) into v_hay_palas
    from public.campeonatos c where c.codigo_campeonato = p_codigo;

    select id_equipo into v_1a from public.clasificaciones
    where codigo_campeonato=p_codigo and codigo_fase='RG' and posicion=1 order by codigo_grupo limit 1;
    select id_equipo into v_1b from public.clasificaciones
    where codigo_campeonato=p_codigo and codigo_fase='RG' and posicion=1 order by codigo_grupo offset 1 limit 1;
    select id_equipo into v_4a from public.clasificaciones
    where codigo_campeonato=p_codigo and codigo_fase='RG' and posicion=4 order by codigo_grupo limit 1;
    select id_equipo into v_4b from public.clasificaciones
    where codigo_campeonato=p_codigo and codigo_fase='RG' and posicion=4 order by codigo_grupo offset 1 limit 1;

    v_g_c1 := public.equipo_resultado_cuadro(p_codigo || '-MM-CUA-P01', false);
    v_p_c1 := public.equipo_resultado_cuadro(p_codigo || '-MM-CUA-P01', true);
    v_g_c2 := public.equipo_resultado_cuadro(p_codigo || '-MM-CUA-P02', false);
    v_p_c2 := public.equipo_resultado_cuadro(p_codigo || '-MM-CUA-P02', true);

    if public.insertar_partido_cuadro(p_codigo,'MM','SEM',1,v_1a,v_g_c1) then v_creados:=v_creados+1; end if;
    if public.insertar_partido_cuadro(p_codigo,'MM','SEM',2,v_1b,v_g_c2) then v_creados:=v_creados+1; end if;

    -- La primera ronda de Palas queda congelada en cuanto se crea.
    -- Guardar resultados posteriores nunca debe volver a cambiar sus participantes.
    if v_hay_palas
       and v_4a is not null and v_4b is not null
       and v_p_c1 is not null and v_p_c2 is not null
       and not exists (
         select 1 from public.partidos
         where codigo_campeonato=p_codigo
           and codigo_fase='PP'
           and codigo_ronda='SEM'
       ) then
        v_equipos_pp := array[v_4a,v_p_c2,v_4b,v_p_c1];
        v_creados := v_creados + public.emparejar_palas_desde_lista(p_codigo,'SEM',v_equipos_pp,2);
    end if;

    v_g_s1 := public.equipo_resultado_cuadro(p_codigo || '-MM-SEM-P01', false);
    v_g_s2 := public.equipo_resultado_cuadro(p_codigo || '-MM-SEM-P02', false);
    if public.insertar_partido_cuadro(p_codigo,'MM','FIN',1,v_g_s1,v_g_s2) then v_creados:=v_creados+1; end if;

    if v_hay_palas then
        v_g_ps1 := public.equipo_resultado_cuadro(p_codigo || '-PP-SEM-P01', false);
        v_g_ps2 := public.equipo_resultado_cuadro(p_codigo || '-PP-SEM-P02', false);
        if public.insertar_partido_cuadro(p_codigo,'PP','FIN',1,v_g_ps1,v_g_ps2) then v_creados:=v_creados+1; end if;
    end if;

    return jsonb_build_object('ok', true, 'partidos_creados', v_creados);
end;
$function$;
