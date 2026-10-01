create table if not exists public.teams_horario_respuestas (
    propuesta_id uuid not null references public.teams_propuestas_horario(id) on delete cascade,
    id_jugador text not null references public.jugadores(id_jugador) on delete cascade,
    disponible boolean not null,
    updated_at timestamptz not null default now(),
    primary key (propuesta_id, id_jugador)
);

alter table public.teams_horario_respuestas enable row level security;

create or replace function public._teams_jugador_token(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_jugador text;
begin
    if nullif(trim(coalesce(p_token,'')),'') is null then
        raise exception 'Sesión no válida';
    end if;

    select s.id_jugador
      into v_jugador
      from public.jugadores_sesiones s
     where s.token_hash = encode(digest(p_token,'sha256'),'hex')
       and s.expira_at > now();

    if v_jugador is null then
        raise exception 'Sesión caducada';
    end if;

    update public.jugadores_sesiones
       set ultimo_uso_at = now()
     where token_hash = encode(digest(p_token,'sha256'),'hex');

    return v_jugador;
end
$$;

revoke all on function public._teams_jugador_token(text) from public, anon, authenticated;

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

create or replace function public.web_teams_cambiar_disponibilidad(p_token text,p_team_id uuid,p_id_jugador text,p_disponible boolean)
returns void language plpgsql security definer set search_path=public as $$
declare jid text; v_equipo uuid; v_capitan boolean;
begin
 jid:=public._teams_jugador_token(p_token);
 select m.equipo_id,m.es_capitan into v_equipo,v_capitan from public.teams_miembros m where m.team_id=p_team_id and m.id_jugador=jid;
 if v_equipo is null then raise exception 'No perteneces a este Teams'; end if;
 if p_id_jugador<>jid and not v_capitan then raise exception 'Solo el capitán puede cambiar la disponibilidad de otro jugador'; end if;
 update public.teams_miembros set disponible=p_disponible where team_id=p_team_id and equipo_id=v_equipo and id_jugador=p_id_jugador;
 if not found then raise exception 'Jugador no encontrado en tu equipo'; end if;
end $$;

create or replace function public.web_teams_guardar_alineacion(p_token text,p_partido_id uuid,p_jugador_1 text,p_jugador_2 text)
returns void language plpgsql security definer set search_path=public as $$
declare jid text; p public.teams_partidos%rowtype; t public.teams%rowtype; v_equipo uuid; v_capitan boolean; v_sin_jugar int; v_u1 int; v_u2 int; v_n int;
begin
 jid:=public._teams_jugador_token(p_token);
 select * into p from public.teams_partidos where id=p_partido_id for update;
 if p.id is null then raise exception 'Partido no existe'; end if;
 select * into t from public.teams where id=p.team_id;
 select m.equipo_id,m.es_capitan into v_equipo,v_capitan from public.teams_miembros m where m.team_id=p.team_id and m.id_jugador=jid;
 if v_equipo is null or not v_capitan then raise exception 'Solo el capitán puede presentar la pareja'; end if;
 if p.estado not in ('pendiente_alineaciones','alineaciones_cerradas') then raise exception 'Las alineaciones ya no son editables'; end if;
 if p_jugador_1=p_jugador_2 then raise exception 'Selecciona dos jugadores distintos'; end if;
 if t.sistema_eleccion_parejas<>'secreto' and p.presenta_primero_equipo_id is not null and v_equipo<>p.presenta_primero_equipo_id and
    (select count(*) from public.teams_partido_jugadores ax where ax.partido_id=p.id and ax.equipo_id=p.presenta_primero_equipo_id)<2
 then raise exception 'Debe presentar primero la pareja el otro equipo'; end if;
 if not exists(select 1 from public.teams_miembros where team_id=p.team_id and equipo_id=v_equipo and id_jugador=p_jugador_1 and disponible and not es_reserva)
 or not exists(select 1 from public.teams_miembros where team_id=p.team_id and equipo_id=v_equipo and id_jugador=p_jugador_2 and disponible and not es_reserva)
 then raise exception 'Jugador no disponible para este equipo'; end if;
 select count(*) into v_sin_jugar from public.teams_miembros m where m.team_id=p.team_id and m.equipo_id=v_equipo and m.disponible and not m.es_reserva and not exists(
   select 1 from public.teams_partido_jugadores a join public.teams_partidos x on x.id=a.partido_id where x.team_id=p.team_id and x.numero<p.numero and x.estado='finalizado' and a.equipo_id=v_equipo and a.id_jugador=m.id_jugador);
 select count(*) filter(where a.id_jugador=p_jugador_1),count(*) filter(where a.id_jugador=p_jugador_2) into v_u1,v_u2 from public.teams_partido_jugadores a join public.teams_partidos x on x.id=a.partido_id where x.team_id=p.team_id and x.numero<p.numero and x.estado='finalizado' and a.equipo_id=v_equipo;
 if t.todos_antes_repetir and v_sin_jugar>=2 and (v_u1>0 or v_u2>0) then raise exception 'Deben jugar primero dos jugadores que todavía no hayan participado'; end if;
 if t.todos_antes_repetir and v_sin_jugar=1 and v_u1>0 and v_u2>0 then raise exception 'Debe jugar el jugador que todavía no haya participado'; end if;
 if t.repetir_jugadores='no' and (v_u1>0 or v_u2>0) then raise exception 'No está permitido repetir jugadores'; end if;
 if t.repetir_jugadores='maximo' and t.max_partidos_jugador is not null and (v_u1>=t.max_partidos_jugador or v_u2>=t.max_partidos_jugador) then raise exception 'Se alcanzó el máximo de partidos por jugador'; end if;
 if not t.repetir_pareja and exists(select 1 from public.teams_partidos x where x.team_id=p.team_id and x.numero<p.numero and x.estado='finalizado' and
   (select count(*) from public.teams_partido_jugadores a where a.partido_id=x.id and a.equipo_id=v_equipo and a.id_jugador in(p_jugador_1,p_jugador_2))=2)
 then raise exception 'No está permitido repetir la misma pareja'; end if;
 delete from public.teams_partido_jugadores where partido_id=p_partido_id and equipo_id=v_equipo;
 insert into public.teams_partido_jugadores(partido_id,equipo_id,id_jugador,orden,confirmado,presentado_at)
 values(p_partido_id,v_equipo,p_jugador_1,1,true,now()),(p_partido_id,v_equipo,p_jugador_2,2,true,now());
 select count(distinct equipo_id) into v_n from public.teams_partido_jugadores where partido_id=p_partido_id;
 if v_n=2 then
   if t.modo_publicacion='inmediata' or (t.modo_publicacion='programada' and t.publicar_at is not null and t.publicar_at<=now()) then
     update public.teams_partidos set estado='revelado',alineaciones_publicadas_at=now() where id=p_partido_id;
   else update public.teams_partidos set estado='alineaciones_cerradas' where id=p_partido_id;
   end if;
 else update public.teams_partidos set estado='pendiente_alineaciones' where id=p_partido_id;
 end if;
end $$;

create or replace function public.web_teams_proponer_horario(p_token text,p_partido_id uuid,p_fecha_hora timestamptz,p_pista text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare jid text; v_id uuid; v_team uuid;
begin
 jid:=public._teams_jugador_token(p_token);
 if p_fecha_hora is null then raise exception 'Indica fecha y hora'; end if;
 select p.team_id into v_team from public.teams_partidos p where p.id=p_partido_id and p.estado in('revelado','concertando');
 if v_team is null then raise exception 'El partido no está pendiente de concertar'; end if;
 if not exists(select 1 from public.teams_partido_jugadores a where a.partido_id=p_partido_id and a.id_jugador=jid) then raise exception 'Solo los cuatro jugadores del partido pueden proponer fecha'; end if;
 insert into public.teams_propuestas_horario(partido_id,propuesta_por,fecha_hora,pista,estado)
 values(p_partido_id,jid,p_fecha_hora,nullif(trim(coalesce(p_pista,'')),''),'propuesta') returning id into v_id;
 insert into public.teams_horario_respuestas(propuesta_id,id_jugador,disponible) values(v_id,jid,true)
 on conflict(propuesta_id,id_jugador) do update set disponible=excluded.disponible,updated_at=now();
 update public.teams_partidos set estado='concertando' where id=p_partido_id;
 return v_id;
end $$;

create or replace function public.web_teams_responder_horario(p_token text,p_propuesta_id uuid,p_disponible boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare jid text; v_partido uuid; v_fecha timestamptz; v_pista text; v_total int; v_ok int; v_programado boolean:=false;
begin
 jid:=public._teams_jugador_token(p_token);
 select ph.partido_id,ph.fecha_hora,ph.pista into v_partido,v_fecha,v_pista from public.teams_propuestas_horario ph where ph.id=p_propuesta_id and ph.estado='propuesta' for update;
 if v_partido is null then raise exception 'Propuesta no válida'; end if;
 if not exists(select 1 from public.teams_partido_jugadores a where a.partido_id=v_partido and a.id_jugador=jid) then raise exception 'No formas parte de este partido'; end if;
 insert into public.teams_horario_respuestas(propuesta_id,id_jugador,disponible) values(p_propuesta_id,jid,p_disponible)
 on conflict(propuesta_id,id_jugador) do update set disponible=excluded.disponible,updated_at=now();
 select count(distinct id_jugador) into v_total from public.teams_partido_jugadores where partido_id=v_partido;
 select count(*) into v_ok from public.teams_horario_respuestas r where r.propuesta_id=p_propuesta_id and r.disponible=true and exists(select 1 from public.teams_partido_jugadores a where a.partido_id=v_partido and a.id_jugador=r.id_jugador);
 if v_total=4 and v_ok=4 then
   update public.teams_propuestas_horario set estado=case when id=p_propuesta_id then 'aceptada' else 'rechazada' end where partido_id=v_partido and estado='propuesta';
   update public.teams_partidos set fecha_hora=v_fecha,pista=v_pista,estado='programado' where id=v_partido;
   v_programado:=true;
 end if;
 return jsonb_build_object('programado',v_programado,'respuestas_favorables',v_ok,'jugadores',v_total);
end $$;

create or replace function public.web_teams_reprogramar_horario(p_token text,p_partido_id uuid,p_fecha_hora timestamptz,p_pista text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare jid text; v_id uuid;
begin
 jid:=public._teams_jugador_token(p_token);
 if p_fecha_hora is null then raise exception 'Indica fecha y hora'; end if;
 if not exists(select 1 from public.teams_partidos p join public.teams_partido_jugadores a on a.partido_id=p.id where p.id=p_partido_id and p.estado='programado' and a.id_jugador=jid) then raise exception 'No puedes modificar la fecha de este partido'; end if;
 update public.teams_propuestas_horario set estado='rechazada' where partido_id=p_partido_id and estado='propuesta';
 update public.teams_partidos set fecha_hora=null,pista=null,estado='concertando' where id=p_partido_id;
 insert into public.teams_propuestas_horario(partido_id,propuesta_por,fecha_hora,pista,estado)
 values(p_partido_id,jid,p_fecha_hora,nullif(trim(coalesce(p_pista,'')),''),'propuesta') returning id into v_id;
 insert into public.teams_horario_respuestas(propuesta_id,id_jugador,disponible) values(v_id,jid,true);
 return v_id;
end $$;

create or replace function public.web_teams_quitar_horario(p_token text,p_partido_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare jid text;
begin
 jid:=public._teams_jugador_token(p_token);
 if not exists(select 1 from public.teams_partidos p join public.teams_partido_jugadores a on a.partido_id=p.id where p.id=p_partido_id and p.estado='programado' and a.id_jugador=jid) then raise exception 'No puedes eliminar la fecha de este partido'; end if;
 update public.teams_propuestas_horario set estado='rechazada' where partido_id=p_partido_id and estado='propuesta';
 update public.teams_partidos set fecha_hora=null,pista=null,estado='concertando' where id=p_partido_id;
end $$;

create or replace function public.web_teams_actualizar_pista(p_token text,p_partido_id uuid,p_pista text default null)
returns void language plpgsql security definer set search_path=public as $$
declare jid text;
begin
 jid:=public._teams_jugador_token(p_token);
 if not exists(select 1 from public.teams_partidos p join public.teams_partido_jugadores a on a.partido_id=p.id where p.id=p_partido_id and p.estado='programado' and a.id_jugador=jid) then raise exception 'No puedes modificar el club/pista de este partido'; end if;
 update public.teams_partidos set pista=nullif(trim(coalesce(p_pista,'')),'') where id=p_partido_id;
end $$;

create or replace function public.web_teams_guardar_resultado(p_token text,p_partido_id uuid,p_sets jsonb,p_finalizacion text default 'normal',p_ganador uuid default null,p_duracion integer default null,p_pista text default null,p_observaciones text default null)
returns void language plpgsql security definer set search_path=public as $$
declare jid text; v_team uuid; v_estado text; v_a uuid; v_b uuid; v_sa int:=0; v_sb int:=0; r jsonb; v_ta int; v_tb int; v_ga int; v_gb int;
begin
 jid:=public._teams_jugador_token(p_token);
 select team_id,estado into v_team,v_estado from public.teams_partidos where id=p_partido_id for update;
 if v_team is null then raise exception 'Partido no existe'; end if;
 if v_estado not in('programado','pendiente_resultado') then raise exception 'No se puede introducir resultado en este estado'; end if;
 if not exists(select 1 from public.teams_partido_jugadores a where a.partido_id=p_partido_id and a.id_jugador=jid) then raise exception 'Solo los jugadores del partido pueden introducir el resultado'; end if;
 if p_finalizacion not in('normal','wo','retirada','suspendido','no_finalizado') then raise exception 'Tipo de finalización no válido'; end if;
 select id into v_a from public.teams_equipos where team_id=v_team and lado='A';
 select id into v_b from public.teams_equipos where team_id=v_team and lado='B';
 delete from public.teams_sets where partido_id=p_partido_id;
 if p_sets is not null then
  for r in select * from jsonb_array_elements(p_sets) loop
   v_ga:=(r->>'a')::int; v_gb:=(r->>'b')::int;
   if v_ga<0 or v_gb<0 then raise exception 'Puntuación no válida'; end if;
   v_ta:=nullif(r->>'tiebreak_a','')::int; v_tb:=nullif(r->>'tiebreak_b','')::int;
   if (v_ta is null)<>(v_tb is null) then raise exception 'Indica los dos resultados del tie-break'; end if;
   if v_ta is not null and (v_ta<0 or v_tb<0 or v_ta=v_tb) then raise exception 'Tie-break no válido'; end if;
   if v_ga=v_gb then
    if v_ta is null then raise exception 'Un set empatado necesita el resultado del tie-break'; end if;
    if v_ta>v_tb then v_sa:=v_sa+1; else v_sb:=v_sb+1; end if;
   else
    if v_ta is not null then raise exception 'El tie-break solo debe indicarse cuando el marcador del set queda empatado'; end if;
    if v_ga>v_gb then v_sa:=v_sa+1; else v_sb:=v_sb+1; end if;
   end if;
   insert into public.teams_sets(partido_id,numero,puntos_a,puntos_b,tiebreak_a,tiebreak_b)
   values(p_partido_id,(r->>'numero')::smallint,v_ga,v_gb,v_ta,v_tb);
  end loop;
 end if;
 if p_finalizacion='normal' then
  if v_sa<2 and v_sb<2 then raise exception 'El ganador debe haber ganado al menos 2 sets'; end if;
  p_ganador:=case when v_sa>v_sb then v_a else v_b end;
 elsif p_finalizacion in('wo','retirada') and p_ganador is null then raise exception 'Indica el equipo ganador';
 elsif p_finalizacion in('suspendido','no_finalizado') then p_ganador:=null;
 end if;
 update public.teams_partidos set finalizacion=p_finalizacion,equipo_ganador_id=p_ganador,duracion_min=p_duracion,pista=nullif(trim(coalesce(p_pista,'')),''),
 observaciones=nullif(trim(coalesce(p_observaciones,'')),''),estado=case when p_finalizacion in('suspendido','no_finalizado') then 'incidencia' else 'pendiente_confirmacion' end,
 resultado_bloqueado=false,resultado_introducido_por=jid,resultado_confirmado_por=null,confirmado_at=null where id=p_partido_id;
 if p_finalizacion in('suspendido','no_finalizado') then
  insert into public.teams_incidencias(team_id,partido_id,tipo,detalle,estado,creada_por)
  values(v_team,p_partido_id,p_finalizacion,nullif(trim(coalesce(p_observaciones,'')),''),'pendiente',jid);
 end if;
end $$;

create or replace function public.web_teams_confirmar_resultado(p_token text,p_partido_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare jid text; v_team uuid; v_num int; v_ganador uuid; v_intro text; v_equipo_intro uuid; v_equipo_confirma uuid; v_modalidad text; v_total int; v_pa numeric; v_a uuid; v_b uuid; v_pts_a numeric; v_pts_b numeric; v_fin boolean:=false; v_sig uuid; v_presentador uuid; v_sistema text; v_primero text;
begin
 jid:=public._teams_jugador_token(p_token);
 select team_id,numero,equipo_ganador_id,resultado_introducido_por into v_team,v_num,v_ganador,v_intro from public.teams_partidos where id=p_partido_id and estado='pendiente_confirmacion' for update;
 if v_team is null then raise exception 'El resultado no está pendiente de confirmación'; end if;
 if v_intro is null or v_ganador is null then raise exception 'El resultado no es confirmable'; end if;
 select equipo_id into v_equipo_intro from public.teams_partido_jugadores where partido_id=p_partido_id and id_jugador=v_intro limit 1;
 select equipo_id into v_equipo_confirma from public.teams_partido_jugadores where partido_id=p_partido_id and id_jugador=jid limit 1;
 if v_equipo_confirma is null then raise exception 'No formas parte de este partido'; end if;
 if v_equipo_confirma=v_equipo_intro then raise exception 'Debe confirmar un jugador del equipo rival'; end if;
 update public.teams_partidos set estado='finalizado',resultado_bloqueado=true,resultado_confirmado_por=jid,confirmado_at=now() where id=p_partido_id;
 select modalidad,numero_partidos,puntos_por_victoria,sistema_eleccion_parejas,primer_presentador into v_modalidad,v_total,v_pa,v_sistema,v_primero from public.teams where id=v_team;
 select id into v_a from public.teams_equipos where team_id=v_team and lado='A';
 select id into v_b from public.teams_equipos where team_id=v_team and lado='B';
 select coalesce(sum(case when equipo_ganador_id=v_a then v_pa else 0 end),0),coalesce(sum(case when equipo_ganador_id=v_b then v_pa else 0 end),0)
 into v_pts_a,v_pts_b from public.teams_partidos where team_id=v_team and estado='finalizado';
 if v_num>=v_total then v_fin:=true;
 elsif v_modalidad='mejor_de' and greatest(v_pts_a,v_pts_b)>(v_total*v_pa)/2 then v_fin:=true;
 end if;
 if v_fin then update public.teams set estado='finalizado',fecha_fin=current_date where id=v_team; return; end if;
 if v_sistema<>'secreto' then
  if v_sistema='ganador_primero' then v_presentador:=v_ganador;
  elsif v_sistema='alterno' then
   select presenta_primero_equipo_id into v_presentador from public.teams_partidos where team_id=v_team and numero=v_num;
   v_presentador:=case when v_presentador=v_a then v_b else v_a end;
  else v_presentador:=case when v_primero='equipo_a' then v_a when v_primero='equipo_b' then v_b else null end;
  end if;
 end if;
 insert into public.teams_partidos(team_id,numero,estado,presenta_primero_equipo_id)
 values(v_team,v_num+1,'pendiente_alineaciones',v_presentador) on conflict(team_id,numero) do nothing returning id into v_sig;
end $$;

create or replace function public.web_teams_impugnar_resultado(p_token text,p_partido_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path=public as $$
declare jid text; v_team uuid; v_intro text; v_equipo_intro uuid; v_equipo_impugna uuid;
begin
 jid:=public._teams_jugador_token(p_token);
 if nullif(trim(coalesce(p_motivo,'')),'') is null then raise exception 'Indica el motivo de la impugnación'; end if;
 select team_id,resultado_introducido_por into v_team,v_intro from public.teams_partidos where id=p_partido_id and estado='pendiente_confirmacion' for update;
 if v_team is null then raise exception 'El resultado no está pendiente de confirmación'; end if;
 select equipo_id into v_equipo_intro from public.teams_partido_jugadores where partido_id=p_partido_id and id_jugador=v_intro limit 1;
 select equipo_id into v_equipo_impugna from public.teams_partido_jugadores where partido_id=p_partido_id and id_jugador=jid limit 1;
 if v_equipo_impugna is null then raise exception 'No formas parte de este partido'; end if;
 if v_equipo_impugna=v_equipo_intro then raise exception 'Solo el equipo rival puede impugnar el resultado'; end if;
 update public.teams_partidos set estado='incidencia',resultado_bloqueado=false where id=p_partido_id;
 insert into public.teams_incidencias(team_id,partido_id,tipo,detalle,estado,creada_por)
 values(v_team,p_partido_id,'resultado_impugnado',trim(p_motivo),'pendiente',jid);
end $$;

grant execute on function public.web_teams_mi_zona(text) to anon, authenticated;
grant execute on function public.web_teams_cambiar_disponibilidad(text,uuid,text,boolean) to anon, authenticated;
grant execute on function public.web_teams_guardar_alineacion(text,uuid,text,text) to anon, authenticated;
grant execute on function public.web_teams_proponer_horario(text,uuid,timestamptz,text) to anon, authenticated;
grant execute on function public.web_teams_responder_horario(text,uuid,boolean) to anon, authenticated;
grant execute on function public.web_teams_reprogramar_horario(text,uuid,timestamptz,text) to anon, authenticated;
grant execute on function public.web_teams_quitar_horario(text,uuid) to anon, authenticated;
grant execute on function public.web_teams_actualizar_pista(text,uuid,text) to anon, authenticated;
grant execute on function public.web_teams_guardar_resultado(text,uuid,jsonb,text,uuid,integer,text,text) to anon, authenticated;
grant execute on function public.web_teams_confirmar_resultado(text,uuid) to anon, authenticated;
grant execute on function public.web_teams_impugnar_resultado(text,uuid,text) to anon, authenticated;
