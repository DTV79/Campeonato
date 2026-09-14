-- Corrige las acciones urgentes de mantenimiento del campeonato.
-- Conserva los jugadores generales y sus identificadores Jxxx.

CREATE OR REPLACE FUNCTION public.admin_vaciar_datos_deportivos(p_codigo text, p_confirmacion text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_partidos integer;
  v_equipos integer;
begin
  if not public.es_administrador() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if btrim(coalesce(p_confirmacion, '')) <> p_codigo then
    raise exception 'La confirmación no coincide con el código del campeonato';
  end if;
  if not exists (select 1 from public.campeonatos where codigo_campeonato = p_codigo) then
    raise exception 'El campeonato no existe';
  end if;

  perform pg_advisory_xact_lock(hashtext('mantenimiento-campeonato:' || p_codigo));

  select count(*) into v_partidos from public.partidos where codigo_campeonato = p_codigo;
  select count(*) into v_equipos from public.equipos where codigo_campeonato = p_codigo;

  delete from public.ranking_jugadores_edicion where codigo_campeonato = p_codigo;
  delete from public.cierres_campeonato where codigo_campeonato = p_codigo;
  delete from public.resultados_campeonato where codigo_campeonato = p_codigo;

  delete from public.isp_partidos i
  using public.partidos p
  where i.id_partido = p.id_partido
    and p.codigo_campeonato = p_codigo;

  delete from public.participantes_partido pp
  using public.partidos p
  where pp.id_partido = p.id_partido
    and p.codigo_campeonato = p_codigo;

  delete from public.sets_partido s
  using public.partidos p
  where s.id_partido = p.id_partido
    and p.codigo_campeonato = p_codigo;

  delete from public.partidos_clasificacion where codigo_campeonato = p_codigo;
  delete from public.partidos where codigo_campeonato = p_codigo;
  delete from public.clasificaciones where codigo_campeonato = p_codigo;
  delete from public.equipos_grupo_fase where codigo_campeonato = p_codigo;
  delete from public.rondas_fase where codigo_campeonato = p_codigo;
  delete from public.grupos_fase where codigo_campeonato = p_codigo;
  delete from public.fases_campeonato where codigo_campeonato = p_codigo;
  delete from public.equipos where codigo_campeonato = p_codigo;
  delete from public.sync_ejecuciones where codigo_campeonato = p_codigo;
  delete from public.auditoria_campeonato where codigo_campeonato = p_codigo;

  update public.campeonatos
  set estado = 'inscripciones',
      fecha_fin = null,
      configuracion = coalesce(configuracion, '{}'::jsonb)
        || jsonb_build_object('estado_torneo', 'Inscripciones'),
      updated_at = now()
  where codigo_campeonato = p_codigo;

  perform public.recalcular_isp();

  return jsonb_build_object(
    'ok', true,
    'codigo_campeonato', p_codigo,
    'partidos_eliminados', v_partidos,
    'equipos_eliminados', v_equipos,
    'campeonato_conservado', true,
    'configuracion_conservada', true,
    'inscripciones_conservadas', true
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_eliminar_campeonato_definitivamente(p_codigo text, p_confirmacion text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.es_administrador() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if btrim(coalesce(p_confirmacion, '')) <> p_codigo then
    raise exception 'La confirmación no coincide con el código del campeonato';
  end if;
  if not exists (select 1 from public.campeonatos where codigo_campeonato = p_codigo) then
    raise exception 'El campeonato no existe';
  end if;

  perform pg_advisory_xact_lock(hashtext('mantenimiento-campeonato:' || p_codigo));

  delete from public.ranking_jugadores_edicion where codigo_campeonato = p_codigo;
  delete from public.cierres_campeonato where codigo_campeonato = p_codigo;
  delete from public.resultados_campeonato where codigo_campeonato = p_codigo;

  delete from public.isp_partidos i
  using public.partidos p
  where i.id_partido = p.id_partido
    and p.codigo_campeonato = p_codigo;

  delete from public.participantes_partido pp
  using public.partidos p
  where pp.id_partido = p.id_partido
    and p.codigo_campeonato = p_codigo;

  delete from public.sets_partido s
  using public.partidos p
  where s.id_partido = p.id_partido
    and p.codigo_campeonato = p_codigo;

  delete from public.partidos_clasificacion where codigo_campeonato = p_codigo;
  delete from public.partidos where codigo_campeonato = p_codigo;
  delete from public.clasificaciones where codigo_campeonato = p_codigo;
  delete from public.equipos_grupo_fase where codigo_campeonato = p_codigo;
  delete from public.rondas_fase where codigo_campeonato = p_codigo;
  delete from public.grupos_fase where codigo_campeonato = p_codigo;
  delete from public.fases_campeonato where codigo_campeonato = p_codigo;
  delete from public.equipos where codigo_campeonato = p_codigo;

  delete from public.sync_ejecuciones where codigo_campeonato = p_codigo;
  delete from public.auditoria_campeonato where codigo_campeonato = p_codigo;
  delete from public.reglas_ranking_resultado where codigo_campeonato = p_codigo;
  delete from public.config_ranking_campeonato where codigo_campeonato = p_codigo;
  delete from public.config_web_campeonato where codigo_campeonato = p_codigo;
  delete from public.config_torneo where codigo_campeonato = p_codigo;
  delete from public.solicitudes_inscripcion where codigo_campeonato = p_codigo;
  delete from public.inscripciones_campeonato where codigo_campeonato = p_codigo;

  delete from public.campeonatos where codigo_campeonato = p_codigo;

  perform public.recalcular_isp();

  return jsonb_build_object(
    'ok', true,
    'codigo_campeonato', p_codigo,
    'campeonato_eliminado', true,
    'jugadores_conservados', true
  );
end;
$function$;

revoke all on function public.admin_vaciar_datos_deportivos(text, text) from public, anon;
revoke all on function public.admin_eliminar_campeonato_definitivamente(text, text) from public, anon;
grant execute on function public.admin_vaciar_datos_deportivos(text, text) to authenticated;
grant execute on function public.admin_eliminar_campeonato_definitivamente(text, text) to authenticated;
