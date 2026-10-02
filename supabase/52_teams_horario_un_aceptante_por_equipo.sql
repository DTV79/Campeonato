
create or replace function public.web_teams_responder_horario(
    p_token text,
    p_propuesta_id uuid,
    p_disponible boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
    v_partido uuid;
    v_fecha timestamptz;
    v_pista text;
    v_total_equipos int;
    v_ok_equipos int;
    v_programado boolean := false;
begin
    jid := public._teams_jugador_token(p_token);

    select ph.partido_id, ph.fecha_hora, ph.pista
      into v_partido, v_fecha, v_pista
      from public.teams_propuestas_horario ph
     where ph.id = p_propuesta_id
       and ph.estado = 'propuesta'
     for update;

    if v_partido is null then
        raise exception 'Propuesta no válida';
    end if;

    if not exists(
        select 1
        from public.teams_partido_jugadores a
        where a.partido_id = v_partido
          and a.id_jugador = jid
    ) then
        raise exception 'No formas parte de este partido';
    end if;

    insert into public.teams_horario_respuestas(
        propuesta_id,id_jugador,disponible
    )
    values(p_propuesta_id,jid,p_disponible)
    on conflict(propuesta_id,id_jugador)
    do update
       set disponible=excluded.disponible,
           updated_at=now();

    select count(distinct a.equipo_id)
      into v_total_equipos
      from public.teams_partido_jugadores a
     where a.partido_id=v_partido;

    select count(distinct a.equipo_id)
      into v_ok_equipos
      from public.teams_horario_respuestas r
      join public.teams_partido_jugadores a
        on a.partido_id=v_partido
       and a.id_jugador=r.id_jugador
     where r.propuesta_id=p_propuesta_id
       and r.disponible=true;

    if v_total_equipos=2 and v_ok_equipos=2 then
        update public.teams_propuestas_horario
           set estado=case
               when id=p_propuesta_id then 'aceptada'
               else 'rechazada'
           end
         where partido_id=v_partido
           and estado='propuesta';

        update public.teams_partidos
           set fecha_hora=v_fecha,
               pista=v_pista,
               estado='programado'
         where id=v_partido;

        v_programado:=true;
    end if;

    return jsonb_build_object(
        'programado',v_programado,
        'equipos_confirmados',v_ok_equipos,
        'equipos',v_total_equipos,
        'respuestas_favorables',v_ok_equipos,
        'jugadores',v_total_equipos
    );
end
$$;

grant execute on function public.web_teams_responder_horario(text,uuid,boolean)
to anon,authenticated;

create or replace function public.web_teams_horarios_publicos(
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
select coalesce(
    jsonb_agg(
        jsonb_build_object(
            'partido_id',p.id,
            'numero',p.numero,
            'propuestas',(
                select coalesce(
                    jsonb_agg(
                        jsonb_build_object(
                            'id',ph.id,
                            'fecha_hora',ph.fecha_hora,
                            'pista',ph.pista,
                            'estado',ph.estado,
                            'acepta_a',exists(
                                select 1
                                from public.teams_horario_respuestas r
                                join public.teams_partido_jugadores pj
                                  on pj.partido_id=p.id
                                 and pj.id_jugador=r.id_jugador
                                join public.teams_equipos e
                                  on e.id=pj.equipo_id
                                where r.propuesta_id=ph.id
                                  and r.disponible=true
                                  and e.lado='A'
                            ),
                            'acepta_b',exists(
                                select 1
                                from public.teams_horario_respuestas r
                                join public.teams_partido_jugadores pj
                                  on pj.partido_id=p.id
                                 and pj.id_jugador=r.id_jugador
                                join public.teams_equipos e
                                  on e.id=pj.equipo_id
                                where r.propuesta_id=ph.id
                                  and r.disponible=true
                                  and e.lado='B'
                            )
                        )
                        order by
                          case ph.estado when 'propuesta' then 0 when 'aceptada' then 1 else 2 end,
                          ph.created_at desc
                    ),
                    '[]'::jsonb
                )
                from public.teams_propuestas_horario ph
                where ph.partido_id=p.id
                  and ph.estado in ('propuesta','aceptada')
            )
        )
        order by p.numero
    ),
    '[]'::jsonb
)
from elegido t
join public.teams_partidos p on p.team_id=t.id;
$$;

grant execute on function public.web_teams_horarios_publicos(uuid)
to anon,authenticated;

with elegibles as (
    select
        ph.id as propuesta_id,
        ph.partido_id,
        ph.fecha_hora,
        ph.pista,
        row_number() over (
            partition by ph.partido_id
            order by ph.created_at desc
        ) as rn
    from public.teams_propuestas_horario ph
    where ph.estado='propuesta'
      and (
          select count(distinct pj.equipo_id)
          from public.teams_horario_respuestas r
          join public.teams_partido_jugadores pj
            on pj.partido_id=ph.partido_id
           and pj.id_jugador=r.id_jugador
          where r.propuesta_id=ph.id
            and r.disponible=true
      ) >= 2
),
ganadoras as (
    select *
    from elegibles
    where rn=1
),
marcar as (
    update public.teams_propuestas_horario ph
       set estado=case
           when exists(
               select 1 from ganadoras g
               where g.propuesta_id=ph.id
           ) then 'aceptada'
           else 'rechazada'
       end
     where ph.estado='propuesta'
       and exists(
           select 1 from ganadoras g
           where g.partido_id=ph.partido_id
       )
    returning ph.id
)
update public.teams_partidos p
   set fecha_hora=g.fecha_hora,
       pista=g.pista,
       estado='programado'
  from ganadoras g
 where p.id=g.partido_id
   and p.estado in ('revelado','concertando');
