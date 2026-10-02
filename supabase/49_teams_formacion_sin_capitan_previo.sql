
alter table public.teams
  drop constraint if exists teams_capitanes_draft_check;

alter table public.teams
  add constraint teams_capitanes_draft_check
  check (
    metodo_formacion <> 'draft'
    or coalesce(configuracion->>'modo_designacion_capitanes','administrador')
       in ('administrador','predefinidos')
  );

create or replace function public.admin_teams_sortear_formacion(p_team_id uuid)
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
    v_objetivo integer;
    v_total integer;
    v_restantes text[];
    v_jugador text;
    v_i integer := 0;
    v_plazas_a integer;
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    select jugadores_por_equipo
      into v_objetivo
      from public.teams
     where id=p_team_id
       and estado in ('preparacion','convocatoria','draft')
       and metodo_formacion='sorteo';

    if v_objetivo is null then
        raise exception 'Este Teams no admite sorteo editable';
    end if;

    select id,id_capitan into v_a,v_cap_a
      from public.teams_equipos
     where team_id=p_team_id and lado='A';

    select id,id_capitan into v_b,v_cap_b
      from public.teams_equipos
     where team_id=p_team_id and lado='B';

    select count(*) into v_total
      from public.teams_elegibles
     where team_id=p_team_id
       and estado='elegible';

    if v_total <> v_objetivo*2 then
        raise exception 'Para sortear deben estar apuntados exactamente % jugadores; ahora hay %',
          v_objetivo*2,v_total;
    end if;

    if v_cap_a is not null and not exists(
        select 1 from public.teams_elegibles
        where team_id=p_team_id and id_jugador=v_cap_a and estado='elegible'
    ) then
        raise exception 'El capitán del Equipo A ya no está disponible';
    end if;

    if v_cap_b is not null and not exists(
        select 1 from public.teams_elegibles
        where team_id=p_team_id and id_jugador=v_cap_b and estado='elegible'
    ) then
        raise exception 'El capitán del Equipo B ya no está disponible';
    end if;

    if v_cap_a is not null and v_cap_b is not null and v_cap_a=v_cap_b then
        raise exception 'Los capitanes deben ser distintos';
    end if;

    select array_agg(id_jugador order by random())
      into v_restantes
      from public.teams_elegibles
     where team_id=p_team_id
       and estado='elegible'
       and (v_cap_a is null or id_jugador<>v_cap_a)
       and (v_cap_b is null or id_jugador<>v_cap_b);

    delete from public.teams_miembros
     where team_id=p_team_id;

    if v_cap_a is not null then
        insert into public.teams_miembros(
            team_id,equipo_id,id_jugador,es_capitan,es_reserva
        )
        values(p_team_id,v_a,v_cap_a,true,false);
    end if;

    if v_cap_b is not null then
        insert into public.teams_miembros(
            team_id,equipo_id,id_jugador,es_capitan,es_reserva
        )
        values(p_team_id,v_b,v_cap_b,true,false);
    end if;

    v_plazas_a:=v_objetivo-case when v_cap_a is null then 0 else 1 end;

    foreach v_jugador in array coalesce(v_restantes,array[]::text[])
    loop
        v_i:=v_i+1;

        insert into public.teams_miembros(
            team_id,equipo_id,id_jugador,es_capitan,es_reserva
        )
        values(
            p_team_id,
            case when v_i<=v_plazas_a then v_a else v_b end,
            v_jugador,
            false,
            false
        );
    end loop;

    return jsonb_build_object(
        'equipo_a',(
            select coalesce(jsonb_agg(id_jugador order by es_capitan desc,id_jugador),'[]'::jsonb)
            from public.teams_miembros
            where team_id=p_team_id and equipo_id=v_a
        ),
        'equipo_b',(
            select coalesce(jsonb_agg(id_jugador order by es_capitan desc,id_jugador),'[]'::jsonb)
            from public.teams_miembros
            where team_id=p_team_id and equipo_id=v_b
        )
    );
end
$$;

grant execute on function public.admin_teams_sortear_formacion(uuid) to authenticated;
