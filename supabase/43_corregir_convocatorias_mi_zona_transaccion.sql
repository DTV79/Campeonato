
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
        where t.estado in ('preparacion','convocatoria')
          and not t.plantillas_cerradas
    );
end
$$;

grant execute on function public.web_teams_convocatorias(text) to anon, authenticated;
