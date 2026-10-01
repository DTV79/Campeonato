create or replace function public.web_teams_jugadores_acceso()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(jsonb_agg(
        jsonb_build_object(
            'id',j.id_jugador,
            'nombre',coalesce(nullif(j.alias,''),j.nombre_oficial)
        )
        order by coalesce(nullif(j.alias,''),j.nombre_oficial)
    ),'[]'::jsonb)
    from public.jugadores j
    where j.activo
$$;

create or replace function public.web_teams_activar_acceso(
    p_id_jugador text,
    p_codigo text,
    p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    c public.jugadores_codigos_alta%rowtype;
    v_codigo_hash text;
    v_token text;
    v_nombre text;
begin
    if p_pin !~ '^[0-9]{4,8}$' then raise exception 'El PIN debe tener entre 4 y 8 cifras'; end if;
    if p_codigo !~ '^[0-9]{6}$' then raise exception 'El código de alta debe tener 6 cifras'; end if;

    select * into c
      from public.jugadores_codigos_alta
     where id_jugador=p_id_jugador
     for update;

    if c.id_jugador is null then raise exception 'No hay ningún código de alta pendiente para este jugador'; end if;
    if c.expira_at <= now() then raise exception 'El código de alta ha caducado. Solicita uno nuevo al administrador'; end if;
    if c.bloqueado_hasta is not null and c.bloqueado_hasta > now() then
        raise exception 'Demasiados intentos. Inténtalo más tarde';
    end if;

    v_codigo_hash := encode(extensions.digest(p_codigo,'sha256'),'hex');

    if v_codigo_hash <> c.codigo_hash then
        update public.jugadores_codigos_alta
           set intentos_fallidos=intentos_fallidos+1,
               bloqueado_hasta=case
                   when intentos_fallidos+1 >= 5 then now()+interval '15 minutes'
                   else null
               end
         where id_jugador=p_id_jugador;
        raise exception 'Código de alta incorrecto';
    end if;

    select coalesce(nullif(alias,''),nombre_oficial)
      into v_nombre
      from public.jugadores
     where id_jugador=p_id_jugador and activo;

    if v_nombre is null then raise exception 'Jugador no encontrado o inactivo'; end if;

    insert into public.jugadores_acceso(
        id_jugador,pin_hash,activo,intentos_fallidos,bloqueado_hasta,updated_at
    )
    values(
        p_id_jugador,
        extensions.crypt(p_pin,extensions.gen_salt('bf')),
        true,0,null,now()
    )
    on conflict(id_jugador) do update
       set pin_hash=excluded.pin_hash,
           activo=true,
           intentos_fallidos=0,
           bloqueado_hasta=null,
           updated_at=now();

    delete from public.jugadores_sesiones where id_jugador=p_id_jugador;
    delete from public.jugadores_codigos_alta where id_jugador=p_id_jugador;

    v_token := encode(extensions.gen_random_bytes(32),'hex');

    insert into public.jugadores_sesiones(id_jugador,token_hash)
    values(p_id_jugador,encode(extensions.digest(v_token,'sha256'),'hex'));

    return jsonb_build_object(
        'token',v_token,
        'jugador',jsonb_build_object('id',p_id_jugador,'nombre',v_nombre),
        'expira_en_dias',30
    );
end
$$;

create or replace function public.web_teams_cambiar_pin(
    p_token text,
    p_pin_actual text,
    p_pin_nuevo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
    a public.jugadores_acceso%rowtype;
    v_token_hash text;
begin
    jid := public._teams_jugador_token(p_token);

    if p_pin_nuevo !~ '^[0-9]{4,8}$' then raise exception 'El nuevo PIN debe tener entre 4 y 8 cifras'; end if;
    if p_pin_actual=p_pin_nuevo then raise exception 'El nuevo PIN debe ser distinto del actual'; end if;

    select * into a
      from public.jugadores_acceso
     where id_jugador=jid and activo
     for update;

    if a.id_jugador is null then raise exception 'Acceso no configurado'; end if;
    if a.pin_hash <> extensions.crypt(p_pin_actual,a.pin_hash) then
        raise exception 'El PIN actual no es correcto';
    end if;

    update public.jugadores_acceso
       set pin_hash=extensions.crypt(p_pin_nuevo,extensions.gen_salt('bf')),
           intentos_fallidos=0,
           bloqueado_hasta=null,
           updated_at=now()
     where id_jugador=jid;

    v_token_hash := encode(extensions.digest(p_token,'sha256'),'hex');

    delete from public.jugadores_sesiones
     where id_jugador=jid and token_hash<>v_token_hash;
end
$$;

grant execute on function public.web_teams_jugadores_acceso() to anon, authenticated;
grant execute on function public.web_teams_activar_acceso(text,text,text) to anon, authenticated;
grant execute on function public.web_teams_cambiar_pin(text,text,text) to anon, authenticated;
