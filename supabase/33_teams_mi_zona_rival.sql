
create or replace function public.web_teams_mi_zona(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
    jugador jsonb;
    competiciones jsonb;
begin
    jid := public._teams_jugador_token(p_token);

    update public.teams_partidos p
       set estado = 'revelado',
           alineaciones_publicadas_at = coalesce(p.alineaciones_publicadas_at, now())
      from public.teams t
     where t.id = p.team_id
       and t.modo_publicacion = 'programada'
       and t.publicar_at is not null
       and t.publicar_at <= now()
       and p.estado = 'alineaciones_cerradas'
       and (select count(distinct a.equipo_id)
              from public.teams_partido_jugadores a
             where a.partido_id = p.id) = 2;

    select jsonb_build_object(
        'id', j.id_jugador,
        'nombre', coalesce(nullif(j.alias,''), j.nombre_oficial)
    )
      into jugador
      from public.jugadores j
     where j.id_jugador = jid;

    select coalesce(jsonb_agg(z order by (z->>'fecha_inicio') desc nulls last),'[]'::jsonb)
      into competiciones
      from (
        select jsonb_build_object(
            'id', t.id,
            'nombre', t.nombre,
            'estado', t.estado,
            'fecha_inicio', t.fecha_inicio,
            'fecha_fin', t.fecha_fin,
            'sistema_eleccion_parejas', t.sistema_eleccion_parejas,
            'segundo_ve_pareja', t.segundo_ve_pareja,
            'modo_publicacion', t.modo_publicacion,
            'publicar_at', t.publicar_at,
            'repetir_jugadores', t.repetir_jugadores,
            'max_partidos_jugador', t.max_partidos_jugador,
            'repetir_pareja', t.repetir_pareja,
            'todos_antes_repetir', t.todos_antes_repetir,
            'equipo', jsonb_build_object(
                'id', e.id,
                'nombre', e.nombre,
                'color', e.color,
                'lado', e.lado,
                'es_capitan', (e.id_capitan = jid)
            ),
            'rival', (
                select jsonb_build_object(
                    'id', er.id,
                    'nombre', er.nombre,
                    'color', er.color,
                    'lado', er.lado
                )
                from public.teams_equipos er
                where er.team_id = t.id
                  and er.id <> e.id
                order by er.lado
                limit 1
            ),
            'companeros', (
                select coalesce(jsonb_agg(
                    jsonb_build_object(
                        'id', j2.id_jugador,
                        'nombre', coalesce(nullif(j2.alias,''), j2.nombre_oficial),
                        'capitan', mm.es_capitan,
                        'reserva', mm.es_reserva,
                        'disponible', mm.disponible
                    )
                    order by mm.es_capitan desc, mm.es_reserva, coalesce(nullif(j2.alias,''), j2.nombre_oficial)
                ), '[]'::jsonb)
                from public.teams_miembros mm
                join public.jugadores j2 on j2.id_jugador = mm.id_jugador
                where mm.team_id = t.id
                  and mm.equipo_id = e.id
            ),
            'partidos', (
                select coalesce(jsonb_agg(
                    jsonb_build_object(
                        'id', p.id,
                        'numero', p.numero,
                        'estado', p.estado,
                        'presenta_primero_equipo_id', p.presenta_primero_equipo_id,
                        'alineaciones_publicadas_at', p.alineaciones_publicadas_at,
                        'fecha_hora', p.fecha_hora,
                        'pista', p.pista,
                        'duracion_min', p.duracion_min,
                        'finalizacion', p.finalizacion,
                        'equipo_ganador_id', p.equipo_ganador_id,
                        'resultado_bloqueado', p.resultado_bloqueado,
                        'resultado_introducido_por', p.resultado_introducido_por,
                        'resultado_confirmado_por', p.resultado_confirmado_por,
                        'yo_juego', exists(
                            select 1
                            from public.teams_partido_jugadores ya
                            where ya.partido_id = p.id
                              and ya.id_jugador = jid
                        ),
                        'mi_alineacion', (
                            select coalesce(jsonb_agg(
                                jsonb_build_object(
                                    'id', jj.id_jugador,
                                    'nombre', coalesce(nullif(jj.alias,''),jj.nombre_oficial),
                                    'orden', aa.orden
                                )
                                order by aa.orden
                            ), '[]'::jsonb)
                            from public.teams_partido_jugadores aa
                            join public.jugadores jj on jj.id_jugador = aa.id_jugador
                            where aa.partido_id = p.id
                              and aa.equipo_id = e.id
                        ),
                        'alineacion_rival', (
                            case
                                when p.alineaciones_publicadas_at is not null
                                  or (
                                      t.sistema_eleccion_parejas <> 'secreto'
                                      and t.segundo_ve_pareja
                                      and p.presenta_primero_equipo_id is not null
                                      and e.id <> p.presenta_primero_equipo_id
                                      and exists(
                                          select 1
                                          from public.teams_partido_jugadores ax
                                          where ax.partido_id = p.id
                                            and ax.equipo_id = p.presenta_primero_equipo_id
                                      )
                                  )
                                then (
                                    select coalesce(jsonb_agg(
                                        jsonb_build_object(
                                            'id', jr.id_jugador,
                                            'nombre', coalesce(nullif(jr.alias,''),jr.nombre_oficial),
                                            'orden', ar.orden,
                                            'equipo_id', ar.equipo_id
                                        )
                                        order by ar.orden
                                    ), '[]'::jsonb)
                                    from public.teams_partido_jugadores ar
                                    join public.jugadores jr on jr.id_jugador = ar.id_jugador
                                    where ar.partido_id = p.id
                                      and ar.equipo_id <> e.id
                                )
                                else '[]'::jsonb
                            end
                        ),
                        'sets', (
                            select coalesce(jsonb_agg(
                                jsonb_build_object(
                                    'numero', s.numero,
                                    'a', s.puntos_a,
                                    'b', s.puntos_b,
                                    'tiebreak_a', s.tiebreak_a,
                                    'tiebreak_b', s.tiebreak_b
                                )
                                order by s.numero
                            ), '[]'::jsonb)
                            from public.teams_sets s
                            where s.partido_id = p.id
                        ),
                        'propuestas', (
                            select coalesce(jsonb_agg(
                                jsonb_build_object(
                                    'id', ph.id,
                                    'fecha_hora', ph.fecha_hora,
                                    'pista', ph.pista,
                                    'estado', ph.estado,
                                    'propuesta_por', ph.propuesta_por,
                                    'propuesta_por_nombre', coalesce(nullif(jp.alias,''),jp.nombre_oficial),
                                    'respuestas', (
                                        select coalesce(jsonb_agg(
                                            jsonb_build_object(
                                                'id_jugador', rr.id_jugador,
                                                'nombre', coalesce(nullif(jr2.alias,''),jr2.nombre_oficial),
                                                'disponible', rr.disponible
                                            )
                                            order by coalesce(nullif(jr2.alias,''),jr2.nombre_oficial)
                                        ), '[]'::jsonb)
                                        from public.teams_horario_respuestas rr
                                        join public.jugadores jr2 on jr2.id_jugador = rr.id_jugador
                                        where rr.propuesta_id = ph.id
                                    )
                                )
                                order by ph.created_at desc
                            ), '[]'::jsonb)
                            from public.teams_propuestas_horario ph
                            left join public.jugadores jp on jp.id_jugador = ph.propuesta_por
                            where ph.partido_id = p.id
                        ),
                        'impugnado', exists(
                            select 1
                            from public.teams_incidencias ii
                            where ii.partido_id = p.id
                              and ii.tipo = 'resultado_impugnado'
                              and ii.estado = 'pendiente'
                        )
                    )
                    order by p.numero
                ), '[]'::jsonb)
                from public.teams_partidos p
                where p.team_id = t.id
            )
        ) z
        from public.teams_miembros m
        join public.teams t on t.id = m.team_id
        join public.teams_equipos e on e.id = m.equipo_id
        where m.id_jugador = jid
          and t.estado in ('en_curso','finalizado')
      ) q;

    return jsonb_build_object('jugador', jugador, 'teams', competiciones);
end
$$;

grant execute on function public.web_teams_mi_zona(text) to anon, authenticated;
