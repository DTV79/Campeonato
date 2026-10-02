
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
    v_a uuid;
    v_b uuid;
    v_miembros_a integer;
    v_miembros_b integer;
    v_votos_a integer;
    v_votos_b integer;
    v_top_a integer;
    v_top_b integer;
    v_empates_a integer;
    v_empates_b integer;
    v_cap_a text;
    v_cap_b text;
    v_resuelto boolean:=false;
begin
    jid:=public._teams_jugador_token(p_token);

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

    select id into v_a
      from public.teams_equipos
     where team_id=p_team_id and lado='A';

    select id into v_b
      from public.teams_equipos
     where team_id=p_team_id and lado='B';

    select count(*) into v_miembros_a
      from public.teams_miembros
     where team_id=p_team_id and equipo_id=v_a and not es_reserva;

    select count(*) into v_miembros_b
      from public.teams_miembros
     where team_id=p_team_id and equipo_id=v_b and not es_reserva;

    select count(*) into v_votos_a
      from public.teams_capitan_votos
     where team_id=p_team_id and equipo_id=v_a;

    select count(*) into v_votos_b
      from public.teams_capitan_votos
     where team_id=p_team_id and equipo_id=v_b;

    if v_miembros_a>0 and v_miembros_b>0
       and v_votos_a=v_miembros_a
       and v_votos_b=v_miembros_b then

        select max(votos) into v_top_a
        from (
            select candidato_id,count(*)::integer votos
            from public.teams_capitan_votos
            where team_id=p_team_id and equipo_id=v_a
            group by candidato_id
        ) q;

        select max(votos) into v_top_b
        from (
            select candidato_id,count(*)::integer votos
            from public.teams_capitan_votos
            where team_id=p_team_id and equipo_id=v_b
            group by candidato_id
        ) q;

        select count(*),min(candidato_id)
          into v_empates_a,v_cap_a
          from (
              select candidato_id,count(*)::integer votos
              from public.teams_capitan_votos
              where team_id=p_team_id and equipo_id=v_a
              group by candidato_id
          ) q
         where votos=v_top_a;

        select count(*),min(candidato_id)
          into v_empates_b,v_cap_b
          from (
              select candidato_id,count(*)::integer votos
              from public.teams_capitan_votos
              where team_id=p_team_id and equipo_id=v_b
              group by candidato_id
          ) q
         where votos=v_top_b;

        if v_empates_a=1 and v_empates_b=1 then
            perform public._teams_asignar_capitanes(
                p_team_id,
                v_cap_a,
                v_cap_b
            );
            v_resuelto:=true;
        end if;
    end if;

    return jsonb_build_object(
        'team_id',p_team_id,
        'equipo_id',v_equipo,
        'voto',p_candidato_id,
        'resuelto',v_resuelto,
        'todos_han_votado',
            (v_votos_a=v_miembros_a and v_votos_b=v_miembros_b),
        'empate',
            (v_empates_a>1 or v_empates_b>1)
    );
end
$$;

grant execute on function public.web_teams_votar_capitan(text,uuid,text)
to anon,authenticated;
