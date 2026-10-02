
create or replace function public.web_teams_estado_parejas_publico(
    p_team_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with elegido as (
    select t.id
    from public.teams t
    where t.estado in ('preparacion','convocatoria','draft','en_curso','finalizado')
      and (p_team_id is null or t.id = p_team_id)
    order by
        case t.estado
            when 'en_curso' then 0
            when 'convocatoria' then 1
            when 'preparacion' then 2
            when 'draft' then 3
            when 'finalizado' then 4
            else 9
        end,
        t.fecha_inicio desc nulls last,
        t.created_at desc
    limit 1
)
select coalesce(
    jsonb_agg(
        jsonb_build_object(
            'partido_id', p.id,
            'presenta_primero_equipo_id', p.presenta_primero_equipo_id,
            'equipos', (
                select coalesce(
                    jsonb_agg(
                        jsonb_build_object(
                            'equipo_id', e.id,
                            'lado', e.lado,
                            'presentada', (
                                select count(*) >= 2
                                from public.teams_partido_jugadores pj
                                where pj.partido_id = p.id
                                  and pj.equipo_id = e.id
                            )
                        )
                        order by e.lado
                    ),
                    '[]'::jsonb
                )
                from public.teams_equipos e
                where e.team_id = p.team_id
            )
        )
        order by p.numero
    ),
    '[]'::jsonb
)
from public.teams_partidos p
where p.team_id = (select id from elegido);
$$;

grant execute on function public.web_teams_estado_parejas_publico(uuid)
to anon, authenticated;
