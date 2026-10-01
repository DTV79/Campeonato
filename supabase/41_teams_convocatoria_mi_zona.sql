
create or replace function public.web_teams_convocatorias(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    jid text;
begin
    jid := public._teams_jugador_token(p_token);

    return (
        select coalesce(jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'nombre', t.nombre,
                'fecha_inicio', t.fecha_inicio,
                'jugadores_por_equipo', t.jugadores_por_equipo,
                'reservas_por_equipo', t.reservas_por_equipo,
                'respuesta', e.estado,
                'origen', e.origen
            )
            order by t.fecha_inicio nulls last, t.created_at
        ), '[]'::jsonb)
        from public.teams t
        left join public.teams_elegibles e
          on e.team_id = t.id
         and e.id_jugador = jid
        where t.estado = 'preparacion'
          and not t.plantillas_cerradas
    );
end
$$;

create or replace function public.web_teams_responder_convocatoria(
    p_token text,
    p_team_id uuid,
    p_estado text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
    v_nombre text;
begin
    jid := public._teams_jugador_token(p_token);

    if p_estado not in ('elegible','no_disponible','pendiente') then
        raise exception 'Respuesta de convocatoria no válida';
    end if;

    select nombre
      into v_nombre
      from public.teams
     where id = p_team_id
       and estado = 'preparacion'
       and not plantillas_cerradas
     for update;

    if v_nombre is null then
        raise exception 'La convocatoria ya no está abierta';
    end if;

    insert into public.teams_elegibles(
        team_id,id_jugador,estado,origen,es_reserva_general
    )
    values(
        p_team_id,jid,p_estado,'web',false
    )
    on conflict(team_id,id_jugador) do update
       set estado = excluded.estado,
           origen = 'web',
           es_reserva_general = false;

    return jsonb_build_object(
        'team_id',p_team_id,
        'nombre',v_nombre,
        'estado',p_estado,
        'origen','web'
    );
end
$$;

grant execute on function public.web_teams_convocatorias(text) to anon, authenticated;
grant execute on function public.web_teams_responder_convocatoria(text,uuid,text) to anon, authenticated;
