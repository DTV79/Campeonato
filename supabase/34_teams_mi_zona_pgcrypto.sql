
create or replace function public._teams_jugador_token(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_jugador text;
begin
    if nullif(trim(coalesce(p_token,'')),'') is null then
        raise exception 'Sesión no válida';
    end if;

    select s.id_jugador
      into v_jugador
      from public.jugadores_sesiones s
     where s.token_hash = encode(extensions.digest(p_token,'sha256'),'hex')
       and s.expira_at > now();

    if v_jugador is null then
        raise exception 'Sesión caducada';
    end if;

    update public.jugadores_sesiones
       set ultimo_uso_at = now()
     where token_hash = encode(extensions.digest(p_token,'sha256'),'hex');

    return v_jugador;
end
$$;

revoke all on function public._teams_jugador_token(text) from public, anon, authenticated;

create or replace function public.web_teams_login(p_id_jugador text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    a public.jugadores_acceso%rowtype;
    tok text;
    nom text;
begin
    select *
      into a
      from public.jugadores_acceso
     where id_jugador = p_id_jugador
       and activo
     for update;

    if not found then
        raise exception 'Acceso no configurado para este jugador';
    end if;

    if a.bloqueado_hasta is not null and a.bloqueado_hasta > now() then
        raise exception 'Acceso bloqueado temporalmente. Inténtalo más tarde';
    end if;

    if a.pin_hash <> extensions.crypt(p_pin,a.pin_hash) then
        update public.jugadores_acceso
           set intentos_fallidos = intentos_fallidos + 1,
               bloqueado_hasta = case
                   when intentos_fallidos + 1 >= 5 then now() + interval '15 minutes'
                   else null
               end,
               updated_at = now()
         where id_jugador = p_id_jugador;

        raise exception 'PIN incorrecto';
    end if;

    update public.jugadores_acceso
       set intentos_fallidos = 0,
           bloqueado_hasta = null,
           ultimo_acceso_at = now(),
           updated_at = now()
     where id_jugador = p_id_jugador;

    tok := encode(extensions.gen_random_bytes(32),'hex');

    insert into public.jugadores_sesiones(id_jugador,token_hash)
    values(
        p_id_jugador,
        encode(extensions.digest(tok,'sha256'),'hex')
    );

    select coalesce(nullif(alias,''),nombre_oficial)
      into nom
      from public.jugadores
     where id_jugador = p_id_jugador;

    return jsonb_build_object(
        'token', tok,
        'jugador', jsonb_build_object('id',p_id_jugador,'nombre',nom),
        'expira_en_dias', 30
    );
end
$$;

create or replace function public.web_teams_logout(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.jugadores_sesiones
     where token_hash = encode(extensions.digest(p_token,'sha256'),'hex');
end
$$;

create or replace function public.admin_teams_establecer_pin(
    p_id_jugador text,
    p_pin text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    if p_pin !~ '^[0-9]{4,8}$' then
        raise exception 'El PIN debe tener entre 4 y 8 cifras';
    end if;

    insert into public.jugadores_acceso(
        id_jugador,pin_hash,activo,intentos_fallidos,bloqueado_hasta,updated_at
    )
    values(
        p_id_jugador,
        extensions.crypt(p_pin,extensions.gen_salt('bf')),
        true,0,null,now()
    )
    on conflict(id_jugador) do update
       set pin_hash = excluded.pin_hash,
           activo = true,
           intentos_fallidos = 0,
           bloqueado_hasta = null,
           updated_at = now();

    delete from public.jugadores_sesiones
     where id_jugador = p_id_jugador;
end
$$;

grant execute on function public.web_teams_login(text,text) to anon, authenticated;
grant execute on function public.web_teams_logout(text) to anon, authenticated;
