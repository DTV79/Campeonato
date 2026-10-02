
create or replace function public.web_teams_portal()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with elegido as (
    select t.*
    from public.teams t
    where t.estado in (
        'preparacion','convocatoria','draft','en_curso','finalizado'
    )
    order by
        case t.estado
            when 'en_curso' then 1
            when 'draft' then 2
            when 'convocatoria' then 3
            when 'preparacion' then 4
            when 'finalizado' then 5
            else 9
        end,
        t.fecha_inicio desc nulls last,
        t.created_at desc
    limit 1
)
select coalesce((
    select jsonb_build_object(
        'id', t.id,
        'nombre', t.nombre,
        'estado', t.estado,
        'numero_partidos', t.numero_partidos,
        'plantillas_cerradas', t.plantillas_cerradas,
        'equipos', (
            select coalesce(
                jsonb_agg(
                    jsonb_build_object(
                        'id', e.id,
                        'nombre', e.nombre,
                        'color', e.color,
                        'lado', e.lado
                    )
                    order by e.lado
                ),
                '[]'::jsonb
            )
            from public.teams_equipos e
            where e.team_id = t.id
        ),
        'jugados', (
            select count(*)
            from public.teams_partidos p
            where p.team_id = t.id
              and p.estado = 'finalizado'
        ),
        'apuntados', (
            select count(*)
            from public.teams_elegibles te
            where te.team_id = t.id
              and te.estado = 'elegible'
        ),
        'respuestas', (
            select count(*)
            from public.teams_elegibles te
            where te.team_id = t.id
              and te.estado in ('elegible','no_disponible','pendiente')
        ),
        'victorias', (
            select coalesce(
                jsonb_object_agg(x.equipo_id,x.n),
                '{}'::jsonb
            )
            from (
                select
                    p.equipo_ganador_id::text equipo_id,
                    count(*) n
                from public.teams_partidos p
                where p.team_id = t.id
                  and p.estado = 'finalizado'
                  and p.equipo_ganador_id is not null
                group by p.equipo_ganador_id
            ) x
        ),
        'proximo_partido', (
            select jsonb_build_object(
                'id', p.id,
                'numero', p.numero,
                'estado', p.estado,
                'fecha_hora', p.fecha_hora,
                'pista', p.pista,
                'fecha_propuesta', (
                    select ph.fecha_hora
                    from public.teams_propuestas_horario ph
                    where ph.partido_id=p.id
                      and ph.estado='propuesta'
                    order by ph.created_at desc
                    limit 1
                ),
                'pista_propuesta', (
                    select ph.pista
                    from public.teams_propuestas_horario ph
                    where ph.partido_id=p.id
                      and ph.estado='propuesta'
                    order by ph.created_at desc
                    limit 1
                ),
                'parejas', case
                    when p.alineaciones_publicadas_at is null
                        then '[]'::jsonb
                    else (
                        select coalesce(
                            jsonb_agg(
                                jsonb_build_object(
                                    'equipo_id', x.equipo_id,
                                    'equipo', e.nombre,
                                    'lado', e.lado,
                                    'pareja', x.pareja
                                )
                                order by e.lado
                            ),
                            '[]'::jsonb
                        )
                        from (
                            select
                                pj.equipo_id,
                                string_agg(
                                    coalesce(
                                        nullif(j.alias,''),
                                        j.nombre_oficial
                                    ),
                                    ' / '
                                    order by pj.orden
                                ) pareja
                            from public.teams_partido_jugadores pj
                            join public.jugadores j
                              on j.id_jugador=pj.id_jugador
                            where pj.partido_id=p.id
                            group by pj.equipo_id
                        ) x
                        join public.teams_equipos e
                          on e.id=x.equipo_id
                    )
                end
            )
            from public.teams_partidos p
            where p.team_id=t.id
              and p.estado <> 'finalizado'
            order by p.numero
            limit 1
        )
    )
    from elegido t
), 'null'::jsonb)
$$;

grant execute on function public.web_teams_portal()
to anon,authenticated;
