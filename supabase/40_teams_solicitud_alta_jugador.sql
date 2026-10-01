create table if not exists public.jugadores_solicitudes_alta (
    id_jugador text primary key references public.jugadores(id_jugador) on delete cascade,
    pin_hash text not null,
    estado text not null default 'pendiente',
    solicitado_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint jugadores_solicitudes_alta_estado_chk
        check (estado in ('pendiente','completada'))
);

alter table public.jugadores_solicitudes_alta enable row level security;

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
            'alias',coalesce(nullif(j.alias,''),j.nombre_oficial),
            'nombre_oficial',j.nombre_oficial,
            'nombre',coalesce(nullif(j.alias,''),j.nombre_oficial)
        )
        order by coalesce(nullif(j.alias,''),j.nombre_oficial)
    ),'[]'::jsonb)
    from public.jugadores j
    where j.activo
$$;

create or replace function public.web_teams_solicitar_alta(
    p_id_jugador text,
    p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_alias text;
    v_nombre text;
    v_ultima timestamptz;
begin
    if p_pin !~ '^[0-9]{4,8}$' then
        return jsonb_build_object('error','El PIN debe tener entre 4 y 8 cifras');
    end if;

    select coalesce(nullif(alias,''),nombre_oficial),nombre_oficial
      into v_alias,v_nombre
      from public.jugadores
     where id_jugador=p_id_jugador
       and activo;

    if v_nombre is null then
        return jsonb_build_object('error','Jugador no encontrado o inactivo');
    end if;

    if exists(
        select 1 from public.jugadores_acceso
        where id_jugador=p_id_jugador and activo
    ) then
        return jsonb_build_object(
            'error',
            'Ya tienes Mi Zona activada. Entra con tu PIN o solicita un restablecimiento al administrador'
        );
    end if;

    select solicitado_at into v_ultima
      from public.jugadores_solicitudes_alta
     where id_jugador=p_id_jugador;

    if v_ultima is not null and v_ultima>now()-interval '30 seconds' then
        return jsonb_build_object(
            'estado','pendiente',
            'id_jugador',p_id_jugador,
            'alias',v_alias,
            'nombre_oficial',v_nombre
        );
    end if;

    insert into public.jugadores_solicitudes_alta(
        id_jugador,pin_hash,estado,solicitado_at,updated_at
    )
    values(
        p_id_jugador,
        extensions.crypt(p_pin,extensions.gen_salt('bf')),
        'pendiente',
        now(),
        now()
    )
    on conflict(id_jugador) do update
       set pin_hash=excluded.pin_hash,
           estado='pendiente',
           solicitado_at=now(),
           updated_at=now();

    delete from public.jugadores_codigos_alta
     where id_jugador=p_id_jugador;

    return jsonb_build_object(
        'estado','pendiente',
        'id_jugador',p_id_jugador,
        'alias',v_alias,
        'nombre_oficial',v_nombre
    );
end
$$;

create or replace function public.admin_teams_solicitudes_alta()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    return (
        select coalesce(jsonb_agg(
            jsonb_build_object(
                'id_jugador',s.id_jugador,
                'alias',coalesce(nullif(j.alias,''),j.nombre_oficial),
                'nombre_oficial',j.nombre_oficial,
                'solicitado_at',s.solicitado_at,
                'codigo_pendiente',(c.id_jugador is not null and c.expira_at>now()),
                'codigo_expira_at',c.expira_at
            )
            order by s.solicitado_at desc
        ),'[]'::jsonb)
        from public.jugadores_solicitudes_alta s
        join public.jugadores j on j.id_jugador=s.id_jugador
        left join public.jugadores_codigos_alta c on c.id_jugador=s.id_jugador
        where s.estado='pendiente'
    );
end
$$;

create or replace function public.web_teams_completar_alta(
    p_id_jugador text,
    p_codigo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    s public.jugadores_solicitudes_alta%rowtype;
    c public.jugadores_codigos_alta%rowtype;
    v_token text;
    v_alias text;
    v_nombre text;
begin
    if p_codigo !~ '^[0-9]{6}$' then
        return jsonb_build_object('error','El código de acceso debe tener 6 cifras');
    end if;

    select * into s
      from public.jugadores_solicitudes_alta
     where id_jugador=p_id_jugador
       and estado='pendiente'
     for update;

    if s.id_jugador is null then
        return jsonb_build_object('error','No hay ninguna solicitud de alta pendiente');
    end if;

    select * into c
      from public.jugadores_codigos_alta
     where id_jugador=p_id_jugador
     for update;

    if c.id_jugador is null then
        return jsonb_build_object(
            'error',
            'Tu solicitud ya está enviada. El administrador todavía no ha generado el código de acceso'
        );
    end if;

    if c.expira_at<=now() then
        return jsonb_build_object(
            'error',
            'El código de acceso ha caducado. Solicita uno nuevo al administrador'
        );
    end if;

    if c.bloqueado_hasta is not null and c.bloqueado_hasta>now() then
        return jsonb_build_object('error','Demasiados intentos. Inténtalo más tarde');
    end if;

    if encode(extensions.digest(p_codigo,'sha256'),'hex')<>c.codigo_hash then
        update public.jugadores_codigos_alta
           set intentos_fallidos=intentos_fallidos+1,
               bloqueado_hasta=case
                   when intentos_fallidos+1>=5 then now()+interval '15 minutes'
                   else null
               end
         where id_jugador=p_id_jugador;
        return jsonb_build_object('error','Código de acceso incorrecto');
    end if;

    select coalesce(nullif(alias,''),nombre_oficial),nombre_oficial
      into v_alias,v_nombre
      from public.jugadores
     where id_jugador=p_id_jugador
       and activo;

    if v_nombre is null then
        return jsonb_build_object('error','Jugador no encontrado o inactivo');
    end if;

    insert into public.jugadores_acceso(
        id_jugador,pin_hash,activo,intentos_fallidos,bloqueado_hasta,updated_at
    )
    values(
        p_id_jugador,s.pin_hash,true,0,null,now()
    )
    on conflict(id_jugador) do update
       set pin_hash=excluded.pin_hash,
           activo=true,
           intentos_fallidos=0,
           bloqueado_hasta=null,
           updated_at=now();

    delete from public.jugadores_sesiones where id_jugador=p_id_jugador;
    delete from public.jugadores_codigos_alta where id_jugador=p_id_jugador;
    delete from public.jugadores_solicitudes_alta where id_jugador=p_id_jugador;

    v_token:=encode(extensions.gen_random_bytes(32),'hex');

    insert into public.jugadores_sesiones(id_jugador,token_hash)
    values(p_id_jugador,encode(extensions.digest(v_token,'sha256'),'hex'));

    return jsonb_build_object(
        'token',v_token,
        'jugador',jsonb_build_object(
            'id',p_id_jugador,
            'alias',v_alias,
            'nombre',v_alias,
            'nombre_oficial',v_nombre
        ),
        'expira_en_dias',30
    );
end
$$;

grant execute on function public.web_teams_jugadores_acceso() to anon, authenticated;
grant execute on function public.web_teams_solicitar_alta(text,text) to anon, authenticated;
grant execute on function public.web_teams_completar_alta(text,text) to anon, authenticated;

revoke all on function public.admin_teams_solicitudes_alta() from public, anon;
grant execute on function public.admin_teams_solicitudes_alta() to authenticated;
