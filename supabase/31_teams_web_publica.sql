-- Teams · Web pública modular
-- Funciones de solo lectura para la página pública docs/teams.html.

create or replace function public.web_teams_ediciones_publicas()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'nombre', t.nombre,
                'estado', t.estado,
                'fecha_inicio', t.fecha_inicio,
                'fecha_fin', t.fecha_fin,
                'numero_partidos', t.numero_partidos
            )
            order by
                case when t.estado = 'en_curso' then 0 else 1 end,
                t.fecha_inicio desc nulls last,
                t.created_at desc
        ),
        '[]'::jsonb
    )
    from public.teams t
    where t.estado in ('en_curso', 'finalizado');
$$;

revoke all on function public.web_teams_ediciones_publicas() from public;
grant execute on function public.web_teams_ediciones_publicas() to anon, authenticated;

create or replace function public.web_teams_detalle_publico(p_team_id uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with elegido as (
    select t.*
    from public.teams t
    where t.estado in ('en_curso', 'finalizado')
      and (p_team_id is null or t.id = p_team_id)
    order by
        case when t.estado = 'en_curso' then 0 else 1 end,
        t.fecha_inicio desc nulls last,
        t.created_at desc
    limit 1
)
select coalesce(
    (
        select jsonb_build_object(
            'id', t.id,
            'nombre', t.nombre,
            'estado', t.estado,
            'fecha_inicio', t.fecha_inicio,
            'fecha_fin', t.fecha_fin,
            'modalidad', t.modalidad,
            'numero_partidos', t.numero_partidos,
            'puntos_por_victoria', t.puntos_por_victoria,
            'jugados_confirmados', (
                select count(*)
                from public.teams_partidos p
                where p.team_id = t.id
                  and p.estado = 'finalizado'
            ),
            'victorias', (
                select coalesce(
                    jsonb_object_agg(x.equipo_id, x.total),
                    '{}'::jsonb
                )
                from (
                    select
                        p.equipo_ganador_id::text as equipo_id,
                        count(*) as total
                    from public.teams_partidos p
                    where p.team_id = t.id
                      and p.estado = 'finalizado'
                      and p.equipo_ganador_id is not null
                    group by p.equipo_ganador_id
                ) x
            ),
            'equipos', (
                select coalesce(
                    jsonb_agg(
                        jsonb_build_object(
                            'id', e.id,
                            'lado', e.lado,
                            'nombre', e.nombre,
                            'color', e.color,
                            'capitan', (
                                select jsonb_build_object(
                                    'id_jugador', j.id_jugador,
                                    'nombre', coalesce(nullif(j.alias, ''), j.nombre_oficial)
                                )
                                from public.teams_miembros m
                                join public.jugadores j
                                  on j.id_jugador = m.id_jugador
                                where m.team_id = t.id
                                  and m.equipo_id = e.id
                                  and m.es_capitan = true
                                limit 1
                            ),
                            'miembros', (
                                select coalesce(
                                    jsonb_agg(
                                        jsonb_build_object(
                                            'id_jugador', j.id_jugador,
                                            'nombre', coalesce(nullif(j.alias, ''), j.nombre_oficial),
                                            'es_capitan', m.es_capitan,
                                            'es_reserva', m.es_reserva
                                        )
                                        order by
                                            m.es_capitan desc,
                                            m.es_reserva asc,
                                            coalesce(nullif(j.alias, ''), j.nombre_oficial)
                                    ),
                                    '[]'::jsonb
                                )
                                from public.teams_miembros m
                                join public.jugadores j
                                  on j.id_jugador = m.id_jugador
                                where m.team_id = t.id
                                  and m.equipo_id = e.id
                            )
                        )
                        order by e.lado
                    ),
                    '[]'::jsonb
                )
                from public.teams_equipos e
                where e.team_id = t.id
            ),
            'partidos', (
                select coalesce(
                    jsonb_agg(
                        jsonb_build_object(
                            'id', p.id,
                            'numero', p.numero,
                            'estado', p.estado,
                            'fecha_hora', p.fecha_hora,
                            'pista', p.pista,
                            'duracion_min', p.duracion_min,
                            'finalizacion', p.finalizacion,
                            'equipo_ganador_id', p.equipo_ganador_id,
                            'alineaciones_publicadas_at', p.alineaciones_publicadas_at,
                            'resultado_bloqueado', p.resultado_bloqueado,
                            'impugnado', exists (
                                select 1
                                from public.teams_incidencias i
                                where i.partido_id = p.id
                                  and i.tipo = 'resultado_impugnado'
                                  and i.estado = 'pendiente'
                            ),
                            'alineaciones',
                                case
                                    when p.alineaciones_publicadas_at is null then '[]'::jsonb
                                    else (
                                        select coalesce(
                                            jsonb_agg(
                                                jsonb_build_object(
                                                    'equipo_id', pj.equipo_id,
                                                    'lado', e.lado,
                                                    'id_jugador', j.id_jugador,
                                                    'jugador', coalesce(nullif(j.alias, ''), j.nombre_oficial),
                                                    'orden', pj.orden
                                                )
                                                order by e.lado, pj.orden
                                            ),
                                            '[]'::jsonb
                                        )
                                        from public.teams_partido_jugadores pj
                                        join public.teams_equipos e
                                          on e.id = pj.equipo_id
                                        join public.jugadores j
                                          on j.id_jugador = pj.id_jugador
                                        where pj.partido_id = p.id
                                    )
                                end,
                            'sets', (
                                select coalesce(
                                    jsonb_agg(
                                        jsonb_build_object(
                                            'numero', s.numero,
                                            'puntos_a', s.puntos_a,
                                            'puntos_b', s.puntos_b,
                                            'tiebreak_a', s.tiebreak_a,
                                            'tiebreak_b', s.tiebreak_b
                                        )
                                        order by s.numero
                                    ),
                                    '[]'::jsonb
                                )
                                from public.teams_sets s
                                where s.partido_id = p.id
                            )
                        )
                        order by p.numero
                    ),
                    '[]'::jsonb
                )
                from public.teams_partidos p
                where p.team_id = t.id
            )
        )
        from elegido t
    ),
    'null'::jsonb
);
$$;

revoke all on function public.web_teams_detalle_publico(uuid) from public;
grant execute on function public.web_teams_detalle_publico(uuid) to anon, authenticated;
