
alter table public.teams
  drop constraint if exists teams_metodo_formacion_check;

alter table public.teams
  add constraint teams_metodo_formacion_check
  check (metodo_formacion = any(array['manual'::text,'draft'::text,'sorteo'::text,'predeterminado'::text]));

create table if not exists public.teams_preasignaciones (
    team_id uuid not null references public.teams(id) on delete cascade,
    id_jugador text not null references public.jugadores(id_jugador) on delete cascade,
    equipo_id uuid not null references public.teams_equipos(id) on delete cascade,
    origen text not null default 'admin',
    updated_at timestamptz not null default now(),
    primary key (team_id,id_jugador),
    constraint teams_preasignaciones_origen_check
      check (origen in ('admin','web'))
);

alter table public.teams_preasignaciones enable row level security;

create or replace function public.admin_teams_guardar_equipos_base(
    p_team_id uuid,
    p_nombre_a text,
    p_nombre_b text,
    p_color_a text default null,
    p_color_b text default null
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

    if not exists(
        select 1 from public.teams
        where id=p_team_id
          and estado in ('preparacion','convocatoria','draft')
    ) then
        raise exception 'Los equipos ya no se pueden modificar';
    end if;

    update public.teams_equipos
       set nombre = coalesce(nullif(btrim(p_nombre_a),''),'Equipo A'),
           color = coalesce(nullif(p_color_a,''),color)
     where team_id=p_team_id and lado='A';

    update public.teams_equipos
       set nombre = coalesce(nullif(btrim(p_nombre_b),''),'Equipo B'),
           color = coalesce(nullif(p_color_b,''),color)
     where team_id=p_team_id and lado='B';
end
$$;

create or replace function public.admin_teams_preasignaciones(p_team_id uuid)
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
        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id_jugador', p.id_jugador,
                    'equipo_id', p.equipo_id,
                    'lado', e.lado,
                    'equipo', e.nombre,
                    'origen', p.origen
                )
                order by e.lado, p.id_jugador
            ),
            '[]'::jsonb
        )
        from public.teams_preasignaciones p
        join public.teams_equipos e on e.id=p.equipo_id
        where p.team_id=p_team_id
    );
end
$$;

create or replace function public.admin_teams_guardar_preasignaciones(
    p_team_id uuid,
    p_asignaciones jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item jsonb;
    v_jugador text;
    v_equipo uuid;
    v_count integer := 0;
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    if not exists(
        select 1 from public.teams
        where id=p_team_id
          and estado in ('preparacion','convocatoria','draft')
          and metodo_formacion='predeterminado'
    ) then
        raise exception 'Este Teams no usa equipos predeterminados o ya no es editable';
    end if;

    delete from public.teams_preasignaciones
     where team_id=p_team_id
       and origen='admin';

    for v_item in
        select * from jsonb_array_elements(coalesce(p_asignaciones,'[]'::jsonb))
    loop
        v_jugador := nullif(v_item->>'id_jugador','');
        v_equipo := nullif(v_item->>'equipo_id','')::uuid;

        if v_jugador is null or v_equipo is null then
            continue;
        end if;

        if not exists(
            select 1 from public.jugadores
            where id_jugador=v_jugador and activo
        ) then
            raise exception 'Jugador inexistente o inactivo: %',v_jugador;
        end if;

        if not exists(
            select 1 from public.teams_equipos
            where id=v_equipo and team_id=p_team_id
        ) then
            raise exception 'El equipo indicado no pertenece a este Teams';
        end if;

        insert into public.teams_preasignaciones(
            team_id,id_jugador,equipo_id,origen,updated_at
        )
        values(
            p_team_id,v_jugador,v_equipo,'admin',now()
        )
        on conflict(team_id,id_jugador) do update
           set equipo_id=excluded.equipo_id,
               origen='admin',
               updated_at=now();

        v_count := v_count + 1;
    end loop;

    return v_count;
end
$$;

create or replace function public.admin_teams_configurar_equipos(
    p_team_id uuid,
    p_nombre_a text,
    p_capitan_a text,
    p_nombre_b text,
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
    v_metodo text;
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    if p_capitan_a=p_capitan_b then
        raise exception 'Los dos equipos no pueden tener el mismo capitán';
    end if;

    if not exists(
        select 1 from public.teams_elegibles
        where team_id=p_team_id and id_jugador=p_capitan_a and estado='elegible'
    ) or not exists(
        select 1 from public.teams_elegibles
        where team_id=p_team_id and id_jugador=p_capitan_b and estado='elegible'
    ) then
        raise exception 'Los capitanes deben estar entre los jugadores elegibles';
    end if;

    select metodo_formacion into v_metodo
      from public.teams
     where id=p_team_id;

    select id into v_a
      from public.teams_equipos
     where team_id=p_team_id and lado='A';

    select id into v_b
      from public.teams_equipos
     where team_id=p_team_id and lado='B';

    if v_metodo='predeterminado' then
        if not exists(
            select 1 from public.teams_preasignaciones
            where team_id=p_team_id
              and id_jugador=p_capitan_a
              and equipo_id=v_a
        ) then
            raise exception 'El capitán del Equipo A debe pertenecer al Equipo A';
        end if;

        if not exists(
            select 1 from public.teams_preasignaciones
            where team_id=p_team_id
              and id_jugador=p_capitan_b
              and equipo_id=v_b
        ) then
            raise exception 'El capitán del Equipo B debe pertenecer al Equipo B';
        end if;
    end if;

    update public.teams_equipos
       set nombre=coalesce(nullif(btrim(p_nombre_a),''),'Equipo A'),
           id_capitan=p_capitan_a
     where id=v_a;

    update public.teams_equipos
       set nombre=coalesce(nullif(btrim(p_nombre_b),''),'Equipo B'),
           id_capitan=p_capitan_b
     where id=v_b;

    delete from public.teams_miembros
     where team_id=p_team_id and es_capitan;

    insert into public.teams_miembros(
        team_id,equipo_id,id_jugador,es_capitan
    )
    values
      (p_team_id,v_a,p_capitan_a,true),
      (p_team_id,v_b,p_capitan_b,true)
    on conflict(team_id,id_jugador) do update
       set equipo_id=excluded.equipo_id,
           es_capitan=true,
           es_reserva=false;
end
$$;

drop function if exists public.web_teams_responder_convocatoria(text,uuid,text);

create or replace function public.web_teams_responder_convocatoria(
    p_token text,
    p_team_id uuid,
    p_estado text,
    p_equipo_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
    v_nombre text;
    v_metodo text;
    v_asignacion text;
    v_equipo uuid;
begin
    jid := public._teams_jugador_token(p_token);

    if p_estado not in ('elegible','no_disponible','pendiente') then
        raise exception 'Respuesta de convocatoria no válida';
    end if;

    select
        nombre,
        metodo_formacion,
        coalesce(configuracion->>'asignacion_predeterminada','admin')
      into v_nombre,v_metodo,v_asignacion
      from public.teams
     where id=p_team_id
       and estado in ('preparacion','convocatoria')
       and not plantillas_cerradas
     for update;

    if v_nombre is null then
        raise exception 'La convocatoria ya no está abierta';
    end if;

    if v_metodo='predeterminado' then
        if v_asignacion='admin' then
            select equipo_id into v_equipo
              from public.teams_preasignaciones
             where team_id=p_team_id
               and id_jugador=jid;

            if p_estado='elegible' and v_equipo is null then
                raise exception 'Todavía no tienes equipo asignado. Consulta con el administrador';
            end if;
        else
            v_equipo := p_equipo_id;

            if p_estado='elegible' and v_equipo is null then
                raise exception 'Elige el equipo con el que participas';
            end if;

            if v_equipo is not null and not exists(
                select 1 from public.teams_equipos
                where id=v_equipo and team_id=p_team_id
            ) then
                raise exception 'Equipo no válido';
            end if;

            if v_equipo is not null then
                insert into public.teams_preasignaciones(
                    team_id,id_jugador,equipo_id,origen,updated_at
                )
                values(
                    p_team_id,jid,v_equipo,'web',now()
                )
                on conflict(team_id,id_jugador) do update
                   set equipo_id=excluded.equipo_id,
                       origen='web',
                       updated_at=now();
            elsif p_estado='no_disponible' then
                delete from public.teams_preasignaciones
                 where team_id=p_team_id
                   and id_jugador=jid
                   and origen='web';
            end if;
        end if;
    end if;

    insert into public.teams_elegibles(
        team_id,id_jugador,estado,origen,es_reserva_general
    )
    values(
        p_team_id,jid,p_estado,'web',false
    )
    on conflict(team_id,id_jugador) do update
       set estado=excluded.estado,
           origen='web',
           es_reserva_general=false;

    return jsonb_build_object(
        'team_id',p_team_id,
        'nombre',v_nombre,
        'estado',p_estado,
        'origen','web',
        'equipo_id',v_equipo
    );
end
$$;

create or replace function public.web_teams_convocatorias(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
begin
    jid := public._teams_jugador_token(p_token);

    return (
        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'nombre', t.nombre,
                    'fecha_inicio', t.fecha_inicio,
                    'jugadores_por_equipo', t.jugadores_por_equipo,
                    'reservas_por_equipo', t.reservas_por_equipo,
                    'metodo_formacion', t.metodo_formacion,
                    'asignacion_predeterminada',
                        coalesce(t.configuracion->>'asignacion_predeterminada','admin'),
                    'respuesta', te.estado,
                    'origen', te.origen,
                    'equipos', (
                        select coalesce(
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',e.id,
                                    'lado',e.lado,
                                    'nombre',e.nombre,
                                    'color',e.color
                                )
                                order by e.lado
                            ),
                            '[]'::jsonb
                        )
                        from public.teams_equipos e
                        where e.team_id=t.id
                    ),
                    'equipo_preasignado', (
                        select jsonb_build_object(
                            'id',e.id,
                            'lado',e.lado,
                            'nombre',e.nombre
                        )
                        from public.teams_preasignaciones p
                        join public.teams_equipos e on e.id=p.equipo_id
                        where p.team_id=t.id
                          and p.id_jugador=jid
                        limit 1
                    )
                )
                order by t.fecha_inicio nulls last,t.created_at
            ),
            '[]'::jsonb
        )
        from public.teams t
        left join public.teams_elegibles te
          on te.team_id=t.id
         and te.id_jugador=jid
        where t.estado in ('preparacion','convocatoria')
          and not t.plantillas_cerradas
    );
end
$$;

create or replace function public.web_teams_convocatoria_publica(p_team_id uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with elegido as (
    select t.id
    from public.teams t
    where t.estado in ('preparacion','convocatoria','draft','en_curso','finalizado')
      and (p_team_id is null or t.id=p_team_id)
    order by
      case t.estado
        when 'en_curso' then 0
        when 'convocatoria' then 1
        when 'preparacion' then 2
        when 'draft' then 3
        when 'finalizado' then 4
        else 9
      end,
      t.fecha_inicio desc nulls last,
      t.created_at desc
    limit 1
)
select coalesce(
    jsonb_agg(
        jsonb_build_object(
            'id_jugador',j.id_jugador,
            'nombre',coalesce(nullif(j.alias,''),j.nombre_oficial),
            'estado',te.estado,
            'equipo_id',p.equipo_id,
            'equipo_lado',e.lado,
            'equipo_nombre',e.nombre
        )
        order by
          case te.estado
            when 'elegible' then 0
            when 'pendiente' then 1
            when 'no_disponible' then 2
            else 9
          end,
          coalesce(nullif(j.alias,''),j.nombre_oficial)
    ),
    '[]'::jsonb
)
from elegido x
join public.teams_elegibles te on te.team_id=x.id
join public.jugadores j on j.id_jugador=te.id_jugador
left join public.teams_preasignaciones p
  on p.team_id=x.id and p.id_jugador=te.id_jugador
left join public.teams_equipos e on e.id=p.equipo_id
where te.estado in ('elegible','pendiente','no_disponible');
$$;

revoke all on function public.admin_teams_guardar_equipos_base(uuid,text,text,text,text) from public,anon;
revoke all on function public.admin_teams_preasignaciones(uuid) from public,anon;
revoke all on function public.admin_teams_guardar_preasignaciones(uuid,jsonb) from public,anon;

grant execute on function public.admin_teams_guardar_equipos_base(uuid,text,text,text,text) to authenticated;
grant execute on function public.admin_teams_preasignaciones(uuid) to authenticated;
grant execute on function public.admin_teams_guardar_preasignaciones(uuid,jsonb) to authenticated;

grant execute on function public.web_teams_responder_convocatoria(text,uuid,text,uuid) to anon,authenticated;
grant execute on function public.web_teams_convocatorias(text) to anon,authenticated;
grant execute on function public.web_teams_convocatoria_publica(uuid) to anon,authenticated;
