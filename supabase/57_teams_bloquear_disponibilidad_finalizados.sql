
create or replace function public.web_teams_cambiar_disponibilidad(
    p_token text,
    p_team_id uuid,
    p_id_jugador text,
    p_disponible boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
    v_equipo uuid;
    v_capitan boolean;
    v_estado text;
begin
    jid := public._teams_jugador_token(p_token);

    select m.equipo_id, m.es_capitan, t.estado
      into v_equipo, v_capitan, v_estado
      from public.teams_miembros m
      join public.teams t on t.id = m.team_id
     where m.team_id = p_team_id
       and m.id_jugador = jid;

    if v_equipo is null then
        raise exception 'No perteneces a este Teams';
    end if;

    if v_estado <> 'en_curso' then
        raise exception 'La disponibilidad solo puede modificarse mientras el Teams está en curso';
    end if;

    if p_id_jugador <> jid and not v_capitan then
        raise exception 'Solo el capitán puede cambiar la disponibilidad de otro jugador';
    end if;

    update public.teams_miembros
       set disponible = p_disponible
     where team_id = p_team_id
       and equipo_id = v_equipo
       and id_jugador = p_id_jugador;

    if not found then
        raise exception 'Jugador no encontrado en tu equipo';
    end if;
end
$$;

grant execute on function public.web_teams_cambiar_disponibilidad(
    text, uuid, text, boolean
) to anon, authenticated;
