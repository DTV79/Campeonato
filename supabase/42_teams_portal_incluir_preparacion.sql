
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
    where t.estado in ('preparacion','convocatoria','draft','en_curso','finalizado')
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
            select coalesce(jsonb_object_agg(x.equipo_id,x.n),'{}'::jsonb)
            from (
                select p.equipo_ganador_id::text equipo_id, count(*) n
                from public.teams_partidos p
                where p.team_id = t.id
                  and p.estado = 'finalizado'
                  and p.equipo_ganador_id is not null
                group by p.equipo_ganador_id
            ) x
        )
    )
    from elegido t
), 'null'::jsonb)
$$;
