-- Evita acceder a campos propios de sets_partido cuando el mismo trigger
-- se ejecuta sobre participantes_partido (y viceversa).
create or replace function public.registrar_cambio_auditoria_campeonato()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_antes jsonb;
  v_despues jsonb;
  v_codigo text;
  v_entidad_id text;
  v_accion text;
  v_id_partido text;
begin
  if auth.uid() is null or not public.es_administrador() then
    return coalesce(new, old);
  end if;

  v_antes := case when tg_op <> 'INSERT' then to_jsonb(old) else null end;
  v_despues := case when tg_op <> 'DELETE' then to_jsonb(new) else null end;

  if v_antes is not null then
    v_antes := v_antes - 'created_at' - 'updated_at'
      - 'configuracion_gestionada_admin_at'
      - 'resultado_gestionado_admin_at'
      - 'sustituciones_gestionadas_admin_at';
  end if;
  if v_despues is not null then
    v_despues := v_despues - 'created_at' - 'updated_at'
      - 'configuracion_gestionada_admin_at'
      - 'resultado_gestionado_admin_at'
      - 'sustituciones_gestionadas_admin_at';
  end if;

  if tg_op = 'UPDATE' and v_antes = v_despues then
    return new;
  end if;

  if tg_table_name = 'campeonatos' then
    v_codigo := coalesce(new.codigo_campeonato, old.codigo_campeonato);
    v_entidad_id := v_codigo;
    if tg_op = 'UPDATE'
       and (v_antes - 'estado' - 'activo') = (v_despues - 'estado' - 'activo') then
      return new;
    end if;
  elsif tg_table_name = 'equipos' then
    v_codigo := coalesce(new.codigo_campeonato, old.codigo_campeonato);
    v_entidad_id := coalesce(new.id_equipo, old.id_equipo);
  elsif tg_table_name = 'fases_campeonato' then
    v_codigo := coalesce(new.codigo_campeonato, old.codigo_campeonato);
    v_entidad_id := coalesce(new.codigo_fase, old.codigo_fase);
  elsif tg_table_name = 'partidos' then
    v_codigo := coalesce(new.codigo_campeonato, old.codigo_campeonato);
    v_entidad_id := coalesce(new.id_partido, old.id_partido);
  elsif tg_table_name in ('sets_partido', 'participantes_partido') then
    v_id_partido := coalesce(
      v_despues ->> 'id_partido',
      v_antes ->> 'id_partido'
    );
    select p.codigo_campeonato into v_codigo
    from public.partidos p
    where p.id_partido = v_id_partido;

    if tg_table_name = 'sets_partido' then
      v_entidad_id := v_id_partido || ':set-' || coalesce(
        v_despues ->> 'numero_set',
        v_antes ->> 'numero_set'
      );
    else
      v_entidad_id := v_id_partido || ':lado-' || coalesce(
        v_despues ->> 'lado',
        v_antes ->> 'lado'
      ) || ':pos-' || coalesce(
        v_despues ->> 'posicion',
        v_antes ->> 'posicion'
      );
    end if;
  end if;

  if v_codigo is null then
    return coalesce(new, old);
  end if;

  v_accion := case tg_op
    when 'INSERT' then 'CREAR_' || upper(tg_table_name)
    when 'UPDATE' then 'MODIFICAR_' || upper(tg_table_name)
    when 'DELETE' then 'ELIMINAR_' || upper(tg_table_name)
  end;

  insert into public.auditoria_campeonato(
    codigo_campeonato,
    accion,
    entidad,
    entidad_id,
    datos_antes,
    datos_despues,
    usuario_id
  ) values (
    v_codigo,
    v_accion,
    tg_table_name,
    v_entidad_id,
    v_antes,
    v_despues,
    auth.uid()
  );

  return coalesce(new, old);
end;
$function$;
