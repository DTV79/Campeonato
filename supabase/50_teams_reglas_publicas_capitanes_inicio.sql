
create or replace function public.web_teams_convocatoria_publica(p_team_id uuid default null)
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
      and (p_team_id is null or t.id=p_team_id)
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
select coalesce((
    select jsonb_build_object(
        'team_id',t.id,
        'metodo_formacion',t.metodo_formacion,
        'asignacion_predeterminada',
          coalesce(t.configuracion->>'asignacion_predeterminada','admin'),
        'modo_designacion_capitanes',
          coalesce(t.configuracion->>'modo_designacion_capitanes','administrador'),
        'modo_inicio_teams',
          coalesce(t.configuracion->>'modo_inicio_teams','administrador'),
        'inicio_programado_at',
          t.configuracion->>'inicio_programado_at',
        'personas',(
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'id_jugador',j.id_jugador,
                'nombre',coalesce(nullif(j.alias,''),j.nombre_oficial),
                'estado',te.estado,
                'equipo_id',p.equipo_id,
                'equipo_lado',e.lado,
                'equipo_nombre',e.nombre
              )
              order by
                case te.estado
                  when 'elegible' then 0
                  when 'pendiente' then 1
                  when 'no_disponible' then 2
                  else 9
                end,
                e.lado nulls last,
                coalesce(nullif(j.alias,''),j.nombre_oficial)
            ),
            '[]'::jsonb
          )
          from public.teams_elegibles te
          join public.jugadores j on j.id_jugador=te.id_jugador
          left join public.teams_preasignaciones p
            on p.team_id=t.id and p.id_jugador=te.id_jugador
          left join public.teams_equipos e on e.id=p.equipo_id
          where te.team_id=t.id
            and te.estado in ('elegible','pendiente','no_disponible')
        )
    )
    from elegido t
), jsonb_build_object(
    'team_id',null,
    'metodo_formacion',null,
    'asignacion_predeterminada',null,
    'modo_designacion_capitanes','administrador',
    'modo_inicio_teams','administrador',
    'inicio_programado_at',null,
    'personas','[]'::jsonb
));
$$;

grant execute on function public.web_teams_convocatoria_publica(uuid) to anon,authenticated;
