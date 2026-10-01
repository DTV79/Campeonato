
create or replace function public.admin_teams_guardar_preasignaciones(
    p_team_id uuid,
    p_asignaciones jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item jsonb;
    v_jugador text;
    v_equipo uuid;
    v_count integer := 0;
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    if not exists(
        select 1 from public.teams
        where id=p_team_id
          and estado in ('preparacion','convocatoria','draft')
          and metodo_formacion='predeterminado'
    ) then
        raise exception 'Este Teams no usa equipos predeterminados o ya no es editable';
    end if;

    delete from public.teams_preasignaciones
     where team_id=p_team_id
       and origen='admin';

    for v_item in
        select * from jsonb_array_elements(coalesce(p_asignaciones,'[]'::jsonb))
    loop
        v_jugador := nullif(v_item->>'id_jugador','');
        v_equipo := nullif(v_item->>'equipo_id','')::uuid;

        if v_jugador is null or v_equipo is null then
            continue;
        end if;

        if not exists(
            select 1 from public.jugadores
            where id_jugador=v_jugador and activo
        ) then
            raise exception 'Jugador inexistente o inactivo: %',v_jugador;
        end if;

        if not exists(
            select 1 from public.teams_equipos
            where id=v_equipo and team_id=p_team_id
        ) then
            raise exception 'El equipo indicado no pertenece a este Teams';
        end if;

        insert into public.teams_preasignaciones(
            team_id,id_jugador,equipo_id,origen,updated_at
        )
        values(
            p_team_id,v_jugador,v_equipo,'admin',now()
        )
        on conflict(team_id,id_jugador) do update
           set equipo_id=excluded.equipo_id,
               origen=case
                   when public.teams_preasignaciones.origen='web'
                    and public.teams_preasignaciones.equipo_id=excluded.equipo_id
                   then 'web'
                   else 'admin'
               end,
               updated_at=now();

        v_count := v_count + 1;
    end loop;

    return v_count;
end
$$;

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
    'personas','[]'::jsonb
));
$$;

grant execute on function public.web_teams_convocatoria_publica(uuid) to anon,authenticated;
