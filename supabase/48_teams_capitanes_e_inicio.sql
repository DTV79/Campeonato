
create table if not exists public.teams_capitan_votos (
    team_id uuid not null references public.teams(id) on delete cascade,
    equipo_id uuid not null references public.teams_equipos(id) on delete cascade,
    votante_id text not null references public.jugadores(id_jugador) on delete cascade,
    candidato_id text not null references public.jugadores(id_jugador) on delete cascade,
    updated_at timestamptz not null default now(),
    primary key (team_id,votante_id)
);

alter table public.teams_capitan_votos enable row level security;

create table if not exists public.teams_inicio_confirmaciones (
    team_id uuid not null references public.teams(id) on delete cascade,
    equipo_id uuid not null references public.teams_equipos(id) on delete cascade,
    id_capitan text not null references public.jugadores(id_jugador) on delete cascade,
    listo boolean not null default false,
    updated_at timestamptz not null default now(),
    primary key (team_id,equipo_id)
);

alter table public.teams_inicio_confirmaciones enable row level security;

create or replace function public._teams_asignar_capitanes(
    p_team_id uuid,
    p_capitan_a text,
    p_capitan_b text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_a uuid;
    v_b uuid;
begin
    if p_capitan_a is null or p_capitan_b is null then
        raise exception 'Debes indicar los dos capitanes';
    end if;

    if p_capitan_a = p_capitan_b then
        raise exception 'Los capitanes deben ser jugadores distintos';
    end if;

    select id into v_a
      from public.teams_equipos
     where team_id=p_team_id and lado='A';

    select id into v_b
      from public.teams_equipos
     where team_id=p_team_id and lado='B';

    if not exists(
        select 1 from public.teams_miembros
        where team_id=p_team_id
          and equipo_id=v_a
          and id_jugador=p_capitan_a
          and not es_reserva
    ) then
        raise exception 'El capitán del Equipo A debe pertenecer a su equipo';
    end if;

    if not exists(
        select 1 from public.teams_miembros
        where team_id=p_team_id
          and equipo_id=v_b
          and id_jugador=p_capitan_b
          and not es_reserva
    ) then
        raise exception 'El capitán del Equipo B debe pertenecer a su equipo';
    end if;

    update public.teams_miembros
       set es_capitan=false
     where team_id=p_team_id;

    update public.teams_miembros
       set es_capitan=true
     where team_id=p_team_id
       and (
         (equipo_id=v_a and id_jugador=p_capitan_a)
         or
         (equipo_id=v_b and id_jugador=p_capitan_b)
       );

    update public.teams_equipos
       set id_capitan=case
           when lado='A' then p_capitan_a
           when lado='B' then p_capitan_b
           else id_capitan
       end
     where team_id=p_team_id
       and lado in ('A','B');

    delete from public.teams_inicio_confirmaciones
     where team_id=p_team_id;
end
$$;

revoke all on function public._teams_asignar_capitanes(uuid,text,text)
from public,anon,authenticated;

create or replace function public.admin_teams_sortear_capitanes(p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_modo text;
    v_metodo text;
    v_a uuid;
    v_b uuid;
    v_cap_a text;
    v_cap_b text;
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    select
        coalesce(configuracion->>'modo_designacion_capitanes','administrador'),
        metodo_formacion
      into v_modo,v_metodo
      from public.teams
     where id=p_team_id
       and estado in ('preparacion','convocatoria','draft');

    if v_modo <> 'sorteo' then
        raise exception 'Este Teams no tiene configurado el sorteo de capitanes';
    end if;

    if v_metodo='draft' then
        raise exception 'En un draft los capitanes deben estar definidos antes de formar los equipos';
    end if;

    select id into v_a from public.teams_equipos where team_id=p_team_id and lado='A';
    select id into v_b from public.teams_equipos where team_id=p_team_id and lado='B';

    select id_jugador into v_cap_a
      from public.teams_miembros
     where team_id=p_team_id and equipo_id=v_a and not es_reserva
     order by random()
     limit 1;

    select id_jugador into v_cap_b
      from public.teams_miembros
     where team_id=p_team_id and equipo_id=v_b and not es_reserva
     order by random()
     limit 1;

    if v_cap_a is null or v_cap_b is null then
        raise exception 'Primero debes completar los dos equipos';
    end if;

    perform public._teams_asignar_capitanes(p_team_id,v_cap_a,v_cap_b);

    return jsonb_build_object(
        'capitan_a',v_cap_a,
        'capitan_b',v_cap_b
    );
end
$$;

create or replace function public.web_teams_votar_capitan(
    p_token text,
    p_team_id uuid,
    p_candidato_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
    v_equipo uuid;
    v_modo text;
begin
    jid := public._teams_jugador_token(p_token);

    select equipo_id into v_equipo
      from public.teams_miembros
     where team_id=p_team_id
       and id_jugador=jid
       and not es_reserva;

    if v_equipo is null then
        raise exception 'No formas parte de un equipo de este Teams';
    end if;

    select coalesce(configuracion->>'modo_designacion_capitanes','administrador')
      into v_modo
      from public.teams
     where id=p_team_id
       and estado in ('preparacion','convocatoria','draft')
       and not plantillas_cerradas;

    if v_modo <> 'eleccion_equipo' then
        raise exception 'Este Teams no utiliza elección de capitán por el equipo';
    end if;

    if not exists(
        select 1
        from public.teams_miembros
        where team_id=p_team_id
          and equipo_id=v_equipo
          and id_jugador=p_candidato_id
          and not es_reserva
    ) then
        raise exception 'Solo puedes votar a un jugador de tu equipo';
    end if;

    insert into public.teams_capitan_votos(
        team_id,equipo_id,votante_id,candidato_id,updated_at
    )
    values(
        p_team_id,v_equipo,jid,p_candidato_id,now()
    )
    on conflict(team_id,votante_id) do update
       set equipo_id=excluded.equipo_id,
           candidato_id=excluded.candidato_id,
           updated_at=now();

    return jsonb_build_object(
        'team_id',p_team_id,
        'equipo_id',v_equipo,
        'voto',p_candidato_id
    );
end
$$;

create or replace function public.admin_teams_votacion_capitanes(p_team_id uuid)
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
        select jsonb_build_object(
            'equipos',coalesce(jsonb_agg(
                jsonb_build_object(
                    'equipo_id',e.id,
                    'lado',e.lado,
                    'nombre',e.nombre,
                    'capitan_actual',e.id_capitan,
                    'votantes',(
                        select count(*)
                        from public.teams_miembros m
                        where m.team_id=p_team_id
                          and m.equipo_id=e.id
                          and not m.es_reserva
                    ),
                    'votos_emitidos',(
                        select count(*)
                        from public.teams_capitan_votos v
                        where v.team_id=p_team_id
                          and v.equipo_id=e.id
                    ),
                    'resultados',(
                        select coalesce(jsonb_agg(
                            jsonb_build_object(
                                'id_jugador',x.id_jugador,
                                'nombre',x.nombre,
                                'votos',x.votos
                            )
                            order by x.votos desc,x.nombre
                        ),'[]'::jsonb)
                        from (
                            select
                                m.id_jugador,
                                coalesce(nullif(j.alias,''),j.nombre_oficial) nombre,
                                count(v.votante_id)::integer votos
                            from public.teams_miembros m
                            join public.jugadores j on j.id_jugador=m.id_jugador
                            left join public.teams_capitan_votos v
                              on v.team_id=m.team_id
                             and v.equipo_id=m.equipo_id
                             and v.candidato_id=m.id_jugador
                            where m.team_id=p_team_id
                              and m.equipo_id=e.id
                              and not m.es_reserva
                            group by m.id_jugador,j.alias,j.nombre_oficial
                        ) x
                    )
                )
                order by e.lado
            ),'[]'::jsonb)
        )
        from public.teams_equipos e
        where e.team_id=p_team_id
    );
end
$$;

create or replace function public.admin_teams_aplicar_votacion_capitanes(
    p_team_id uuid,
    p_capitan_a text default null,
    p_capitan_b text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_a uuid;
    v_b uuid;
    v_cap_a text;
    v_cap_b text;
    v_top_a integer;
    v_top_b integer;
    v_ties_a integer;
    v_ties_b integer;
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    if coalesce(
        (select configuracion->>'modo_designacion_capitanes'
           from public.teams where id=p_team_id),
        'administrador'
    ) <> 'eleccion_equipo' then
        raise exception 'Este Teams no utiliza elección de capitán por el equipo';
    end if;

    select id into v_a from public.teams_equipos where team_id=p_team_id and lado='A';
    select id into v_b from public.teams_equipos where team_id=p_team_id and lado='B';

    if p_capitan_a is null then
        select max(votos) into v_top_a
        from (
            select count(*)::integer votos
            from public.teams_capitan_votos
            where team_id=p_team_id and equipo_id=v_a
            group by candidato_id
        ) q;

        if coalesce(v_top_a,0)=0 then
            raise exception 'El Equipo A todavía no tiene votos';
        end if;

        select count(*),min(candidato_id)
          into v_ties_a,v_cap_a
          from (
              select candidato_id,count(*)::integer votos
              from public.teams_capitan_votos
              where team_id=p_team_id and equipo_id=v_a
              group by candidato_id
          ) q
         where votos=v_top_a;

        if v_ties_a>1 then
            raise exception 'Hay empate en el Equipo A. El administrador debe elegir entre los empatados';
        end if;
    else
        v_cap_a:=p_capitan_a;
    end if;

    if p_capitan_b is null then
        select max(votos) into v_top_b
        from (
            select count(*)::integer votos
            from public.teams_capitan_votos
            where team_id=p_team_id and equipo_id=v_b
            group by candidato_id
        ) q;

        if coalesce(v_top_b,0)=0 then
            raise exception 'El Equipo B todavía no tiene votos';
        end if;

        select count(*),min(candidato_id)
          into v_ties_b,v_cap_b
          from (
              select candidato_id,count(*)::integer votos
              from public.teams_capitan_votos
              where team_id=p_team_id and equipo_id=v_b
              group by candidato_id
          ) q
         where votos=v_top_b;

        if v_ties_b>1 then
            raise exception 'Hay empate en el Equipo B. El administrador debe elegir entre los empatados';
        end if;
    else
        v_cap_b:=p_capitan_b;
    end if;

    perform public._teams_asignar_capitanes(p_team_id,v_cap_a,v_cap_b);

    return jsonb_build_object(
        'capitan_a',v_cap_a,
        'capitan_b',v_cap_b
    );
end
$$;

create or replace function public._teams_iniciar_interno(p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_t public.teams%rowtype;
    v_partido uuid;
    v_presentador uuid;
    v_a uuid;
    v_b uuid;
begin
    select * into v_t
      from public.teams
     where id=p_team_id
     for update;

    if not found then
        raise exception 'Teams no existe';
    end if;

    if v_t.estado='en_curso' then
        select id into v_partido
          from public.teams_partidos
         where team_id=p_team_id and numero=1;
        return v_partido;
    end if;

    if v_t.estado not in ('preparacion','convocatoria','draft') then
        raise exception 'El Teams no se puede iniciar desde su estado actual';
    end if;

    if not v_t.plantillas_cerradas then
        raise exception 'Debes cerrar las plantillas antes de iniciar';
    end if;

    if not v_t.reglas_revisadas then
        raise exception 'Debes revisar y confirmar las reglas antes de iniciar';
    end if;

    select id into v_a
      from public.teams_equipos
     where team_id=p_team_id and lado='A' and id_capitan is not null;

    select id into v_b
      from public.teams_equipos
     where team_id=p_team_id and lado='B' and id_capitan is not null;

    if v_a is null or v_b is null then
        raise exception 'Faltan los dos capitanes';
    end if;

    if v_t.sistema_eleccion_parejas <> 'secreto' then
        if v_t.primer_presentador='equipo_a' then
            v_presentador:=v_a;
        elsif v_t.primer_presentador='equipo_b' then
            v_presentador:=v_b;
        else
            v_presentador:=case when random()<0.5 then v_a else v_b end;
        end if;
    end if;

    update public.teams
       set estado='en_curso',
           fecha_inicio=coalesce(fecha_inicio,current_date)
     where id=p_team_id;

    insert into public.teams_partidos(
        team_id,numero,estado,presenta_primero_equipo_id
    )
    values(
        p_team_id,1,'pendiente_alineaciones',v_presentador
    )
    on conflict(team_id,numero) do update
       set presenta_primero_equipo_id=
           coalesce(public.teams_partidos.presenta_primero_equipo_id,
                    excluded.presenta_primero_equipo_id)
    returning id into v_partido;

    return v_partido;
end
$$;

revoke all on function public._teams_iniciar_interno(uuid)
from public,anon,authenticated;

create or replace function public.admin_teams_iniciar(p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    return public._teams_iniciar_interno(p_team_id);
end
$$;

create or replace function public.web_teams_capitan_listo(
    p_token text,
    p_team_id uuid,
    p_listo boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
    v_equipo uuid;
    v_modo text;
    v_listos integer;
    v_partido uuid;
begin
    jid:=public._teams_jugador_token(p_token);

    select e.id into v_equipo
      from public.teams_equipos e
     where e.team_id=p_team_id
       and e.id_capitan=jid;

    if v_equipo is null then
        raise exception 'Solo el capitán puede marcar a su equipo como preparado';
    end if;

    select coalesce(configuracion->>'modo_inicio_teams','administrador')
      into v_modo
      from public.teams
     where id=p_team_id
       and estado in ('preparacion','convocatoria','draft');

    if v_modo <> 'capitanes' then
        raise exception 'Este Teams no se inicia por confirmación de capitanes';
    end if;

    insert into public.teams_inicio_confirmaciones(
        team_id,equipo_id,id_capitan,listo,updated_at
    )
    values(
        p_team_id,v_equipo,jid,p_listo,now()
    )
    on conflict(team_id,equipo_id) do update
       set id_capitan=excluded.id_capitan,
           listo=excluded.listo,
           updated_at=now();

    select count(*) into v_listos
      from public.teams_inicio_confirmaciones c
      join public.teams_equipos e on e.id=c.equipo_id
     where c.team_id=p_team_id
       and c.listo
       and e.id_capitan=c.id_capitan;

    if v_listos=2 then
        v_partido:=public._teams_iniciar_interno(p_team_id);
    end if;

    return jsonb_build_object(
        'listos',v_listos,
        'iniciado',v_partido is not null
    );
end
$$;

create or replace function public.web_teams_preparacion(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
begin
    jid:=public._teams_jugador_token(p_token);

    return (
        select coalesce(jsonb_agg(
            jsonb_build_object(
                'id',t.id,
                'nombre',t.nombre,
                'estado',t.estado,
                'modo_designacion_capitanes',
                    coalesce(t.configuracion->>'modo_designacion_capitanes','administrador'),
                'modo_inicio_teams',
                    coalesce(t.configuracion->>'modo_inicio_teams','administrador'),
                'inicio_programado_at',
                    t.configuracion->>'inicio_programado_at',
                'plantillas_cerradas',t.plantillas_cerradas,
                'reglas_revisadas',t.reglas_revisadas,
                'equipo',jsonb_build_object(
                    'id',e.id,
                    'nombre',e.nombre,
                    'lado',e.lado,
                    'es_capitan',(e.id_capitan=jid),
                    'capitan_id',e.id_capitan
                ),
                'candidatos',(
                    select coalesce(jsonb_agg(
                        jsonb_build_object(
                            'id',m2.id_jugador,
                            'nombre',coalesce(nullif(j2.alias,''),j2.nombre_oficial)
                        )
                        order by coalesce(nullif(j2.alias,''),j2.nombre_oficial)
                    ),'[]'::jsonb)
                    from public.teams_miembros m2
                    join public.jugadores j2 on j2.id_jugador=m2.id_jugador
                    where m2.team_id=t.id
                      and m2.equipo_id=e.id
                      and not m2.es_reserva
                ),
                'mi_voto',(
                    select candidato_id
                    from public.teams_capitan_votos v
                    where v.team_id=t.id and v.votante_id=jid
                ),
                'capitanes_listos',(
                    select coalesce(jsonb_agg(
                        jsonb_build_object(
                            'equipo_id',ee.id,
                            'equipo',ee.nombre,
                            'capitan_id',ee.id_capitan,
                            'listo',coalesce(c.listo,false)
                        )
                        order by ee.lado
                    ),'[]'::jsonb)
                    from public.teams_equipos ee
                    left join public.teams_inicio_confirmaciones c
                      on c.team_id=t.id
                     and c.equipo_id=ee.id
                     and c.id_capitan=ee.id_capitan
                    where ee.team_id=t.id
                )
            )
            order by t.created_at desc
        ),'[]'::jsonb)
        from public.teams_miembros m
        join public.teams t on t.id=m.team_id
        join public.teams_equipos e on e.id=m.equipo_id
        where m.id_jugador=jid
          and t.estado in ('preparacion','convocatoria','draft')
    );
end
$$;

create or replace function public._teams_iniciar_programados()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    r record;
    v_count integer:=0;
begin
    for r in
        select id
        from public.teams
        where estado in ('preparacion','convocatoria','draft')
          and coalesce(configuracion->>'modo_inicio_teams','administrador')='programado'
          and nullif(configuracion->>'inicio_programado_at','') is not null
          and (configuracion->>'inicio_programado_at')::timestamptz <= now()
    loop
        begin
            perform public._teams_iniciar_interno(r.id);
            v_count:=v_count+1;
        exception when others then
            null;
        end;
    end loop;

    return v_count;
end
$$;

revoke all on function public._teams_iniciar_programados()
from public,anon,authenticated;

revoke all on function public.admin_teams_sortear_capitanes(uuid)
from public,anon;
revoke all on function public.admin_teams_votacion_capitanes(uuid)
from public,anon;
revoke all on function public.admin_teams_aplicar_votacion_capitanes(uuid,text,text)
from public,anon;

grant execute on function public.admin_teams_sortear_capitanes(uuid) to authenticated;
grant execute on function public.admin_teams_votacion_capitanes(uuid) to authenticated;
grant execute on function public.admin_teams_aplicar_votacion_capitanes(uuid,text,text) to authenticated;

grant execute on function public.web_teams_votar_capitan(text,uuid,text) to anon,authenticated;
grant execute on function public.web_teams_capitan_listo(text,uuid,boolean) to anon,authenticated;
grant execute on function public.web_teams_preparacion(text) to anon,authenticated;

create extension if not exists pg_cron;

do $$
begin
    if not exists(
        select 1 from cron.job where jobname='teams-inicio-programado'
    ) then
        perform cron.schedule(
            'teams-inicio-programado',
            '* * * * *',
            'select public._teams_iniciar_programados();'
        );
    end if;
end
$$;
