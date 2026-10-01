
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

    if v_cap_a is null or v_cap_b is null then
        raise exception 'Elige primero los dos capitanes';
    end if;

    select count(*) into v_total
      from public.teams_elegibles
     where team_id=p_team_id
       and estado='elegible';

    if v_total <> v_objetivo*2 then
        raise exception 'Para sortear deben estar apuntados exactamente % jugadores; ahora hay %',
          v_objetivo*2,v_total;
    end if;

    select array_agg(id_jugador order by random())
      into v_restantes
      from public.teams_elegibles
     where team_id=p_team_id
       and estado='elegible'
       and id_jugador not in (v_cap_a,v_cap_b);

    delete from public.teams_miembros
     where team_id=p_team_id;

    insert into public.teams_miembros(
        team_id,equipo_id,id_jugador,es_capitan,es_reserva
    )
    values
      (p_team_id,v_a,v_cap_a,true,false),
      (p_team_id,v_b,v_cap_b,true,false);

    foreach v_jugador in array coalesce(v_restantes,array[]::text[])
    loop
        v_i := v_i + 1;

        insert into public.teams_miembros(
            team_id,equipo_id,id_jugador,es_capitan,es_reserva
        )
        values(
            p_team_id,
            case when v_i <= v_objetivo-1 then v_a else v_b end,
            v_jugador,
            false,
            false
        );
    end loop;

    return jsonb_build_object(
        'equipo_a', (
            select coalesce(jsonb_agg(id_jugador order by es_capitan desc,id_jugador),'[]'::jsonb)
            from public.teams_miembros
            where team_id=p_team_id and equipo_id=v_a
        ),
        'equipo_b', (
            select coalesce(jsonb_agg(id_jugador order by es_capitan desc,id_jugador),'[]'::jsonb)
            from public.teams_miembros
            where team_id=p_team_id and equipo_id=v_b
        )
    );
end
$$;

revoke all on function public.admin_teams_sortear_formacion(uuid) from public,anon;
grant execute on function public.admin_teams_sortear_formacion(uuid) to authenticated;
