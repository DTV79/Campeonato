create or replace function public.admin_teams_generar_codigo_alta(p_id_jugador text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_bytes bytea;
    v_num bigint;
    v_codigo text;
    v_expira timestamptz := now() + interval '48 hours';
    v_nombre text;
    v_tipo text;
begin
    if not public.es_administrador() then raise exception 'Acceso no autorizado'; end if;

    select coalesce(nullif(alias,''),nombre_oficial)
      into v_nombre
      from public.jugadores
     where id_jugador = p_id_jugador and activo;

    if v_nombre is null then raise exception 'Jugador no encontrado o inactivo'; end if;

    v_tipo := case
        when exists(select 1 from public.jugadores_acceso where id_jugador = p_id_jugador)
        then 'restablecimiento'
        else 'alta'
    end;

    v_bytes := extensions.gen_random_bytes(4);
    v_num :=
        get_byte(v_bytes,0)::bigint * 16777216 +
        get_byte(v_bytes,1)::bigint * 65536 +
        get_byte(v_bytes,2)::bigint * 256 +
        get_byte(v_bytes,3)::bigint;
    v_codigo := lpad((v_num % 1000000)::text, 6, '0');

    insert into public.jugadores_codigos_alta(
        id_jugador,codigo_hash,expira_at,intentos_fallidos,bloqueado_hasta,created_at
    )
    values(
        p_id_jugador,
        encode(extensions.digest(v_codigo,'sha256'),'hex'),
        v_expira,0,null,now()
    )
    on conflict(id_jugador) do update
       set codigo_hash=excluded.codigo_hash,
           expira_at=excluded.expira_at,
           intentos_fallidos=0,
           bloqueado_hasta=null,
           created_at=now();

    update public.jugadores_acceso
       set activo=false,intentos_fallidos=0,bloqueado_hasta=null,updated_at=now()
     where id_jugador=p_id_jugador;

    delete from public.jugadores_sesiones where id_jugador=p_id_jugador;

    return jsonb_build_object(
        'id_jugador',p_id_jugador,
        'nombre',v_nombre,
        'codigo',v_codigo,
        'expira_at',v_expira,
        'tipo',v_tipo
    );
end
$$;

create or replace function public.admin_teams_estado_accesos()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if not public.es_administrador() then raise exception 'Acceso no autorizado'; end if;

    return (
        select coalesce(jsonb_agg(
            jsonb_build_object(
                'id_jugador',j.id_jugador,
                'tiene_acceso',coalesce(a.activo,false),
                'acceso_creado',(a.id_jugador is not null),
                'codigo_pendiente',(c.id_jugador is not null and c.expira_at > now()),
                'codigo_expira_at',c.expira_at,
                'ultimo_acceso_at',a.ultimo_acceso_at
            )
            order by coalesce(nullif(j.alias,''),j.nombre_oficial)
        ),'[]'::jsonb)
        from public.jugadores j
        left join public.jugadores_acceso a on a.id_jugador=j.id_jugador
        left join public.jugadores_codigos_alta c on c.id_jugador=j.id_jugador
        where j.activo
    );
end
$$;

revoke all on function public.admin_teams_generar_codigo_alta(text) from public, anon;
revoke all on function public.admin_teams_estado_accesos() from public, anon;
grant execute on function public.admin_teams_generar_codigo_alta(text) to authenticated;
grant execute on function public.admin_teams_estado_accesos() to authenticated;
