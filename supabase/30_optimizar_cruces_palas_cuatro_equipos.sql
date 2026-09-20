-- Optimiza el criterio "No Enfrentados" de Palas de Playa con cuatro equipos.
-- Compara las tres combinaciones completas y elige la de menor número de cruces repetidos.
-- La final de Palas sigue recibiendo a los perdedores de semifinales.

create or replace function public.emparejar_palas_desde_lista(
  p_codigo text,
  p_ronda text,
  p_equipos text[],
  p_partidos integer
)
returns integer
language plpgsql
set search_path to 'public'
as $function$
declare
  v_lista text[] := p_equipos;
  v_ordenados text[];
  v_a text;
  v_b text;
  v_j integer;
  v_i integer;
  v_creados integer := 0;
  v_criterio text;
  v_equipos_que_juegan integer;
  v_coste_1 integer;
  v_coste_2 integer;
  v_coste_3 integer;
begin
  select coalesce(nullif(configuracion ->> 'criterio_palas_playa',''),'Por Clasificación')
    into v_criterio
  from public.campeonatos
  where codigo_campeonato = p_codigo;

  if lower(v_criterio) not like '%no enfrent%' then
    select array_agg(
      u.id_equipo
      order by coalesce(r.posicion,32767), coalesce(r.prioridad_fase,9),
               coalesce(r.codigo_grupo,''), u.orden_original
    )
    into v_ordenados
    from unnest(p_equipos) with ordinality as u(id_equipo,orden_original)
    left join lateral (
      select c.posicion,c.codigo_grupo,
             case c.codigo_fase when 'RG' then 0 when 'GR' then 1 else 2 end prioridad_fase
      from public.clasificaciones c
      where c.codigo_campeonato=p_codigo
        and c.id_equipo=u.id_equipo
        and c.codigo_fase in ('RG','GR')
      order by case c.codigo_fase when 'RG' then 0 when 'GR' then 1 else 2 end,
               c.posicion,c.codigo_grupo
      limit 1
    ) r on true;

    v_lista := coalesce(v_ordenados,p_equipos);
    v_equipos_que_juegan := least(coalesce(array_length(v_lista,1),0),greatest(p_partidos,0)*2);

    for v_i in 1..p_partidos loop
      exit when v_i > v_equipos_que_juegan/2;
      v_a := v_lista[v_i];
      v_b := v_lista[v_equipos_que_juegan+1-v_i];
      if public.insertar_partido_cuadro(p_codigo,'PP',p_ronda,v_i,v_a,v_b) then
        v_creados := v_creados+1;
      end if;
    end loop;
    return v_creados;
  end if;

  if coalesce(array_length(v_lista,1),0)=4 and p_partidos=2 then
    select count(*)::integer into v_coste_1 from public.partidos p
    where p.codigo_campeonato=p_codigo and (
      (p.id_equipo_1=v_lista[1] and p.id_equipo_2=v_lista[2]) or
      (p.id_equipo_1=v_lista[2] and p.id_equipo_2=v_lista[1]) or
      (p.id_equipo_1=v_lista[3] and p.id_equipo_2=v_lista[4]) or
      (p.id_equipo_1=v_lista[4] and p.id_equipo_2=v_lista[3])
    );
    select count(*)::integer into v_coste_2 from public.partidos p
    where p.codigo_campeonato=p_codigo and (
      (p.id_equipo_1=v_lista[1] and p.id_equipo_2=v_lista[3]) or
      (p.id_equipo_1=v_lista[3] and p.id_equipo_2=v_lista[1]) or
      (p.id_equipo_1=v_lista[2] and p.id_equipo_2=v_lista[4]) or
      (p.id_equipo_1=v_lista[4] and p.id_equipo_2=v_lista[2])
    );
    select count(*)::integer into v_coste_3 from public.partidos p
    where p.codigo_campeonato=p_codigo and (
      (p.id_equipo_1=v_lista[1] and p.id_equipo_2=v_lista[4]) or
      (p.id_equipo_1=v_lista[4] and p.id_equipo_2=v_lista[1]) or
      (p.id_equipo_1=v_lista[2] and p.id_equipo_2=v_lista[3]) or
      (p.id_equipo_1=v_lista[3] and p.id_equipo_2=v_lista[2])
    );

    if v_coste_1<=v_coste_2 and v_coste_1<=v_coste_3 then
      if public.insertar_partido_cuadro(p_codigo,'PP',p_ronda,1,v_lista[1],v_lista[2]) then v_creados:=v_creados+1; end if;
      if public.insertar_partido_cuadro(p_codigo,'PP',p_ronda,2,v_lista[3],v_lista[4]) then v_creados:=v_creados+1; end if;
    elsif v_coste_2<=v_coste_3 then
      if public.insertar_partido_cuadro(p_codigo,'PP',p_ronda,1,v_lista[1],v_lista[3]) then v_creados:=v_creados+1; end if;
      if public.insertar_partido_cuadro(p_codigo,'PP',p_ronda,2,v_lista[2],v_lista[4]) then v_creados:=v_creados+1; end if;
    else
      if public.insertar_partido_cuadro(p_codigo,'PP',p_ronda,1,v_lista[1],v_lista[4]) then v_creados:=v_creados+1; end if;
      if public.insertar_partido_cuadro(p_codigo,'PP',p_ronda,2,v_lista[2],v_lista[3]) then v_creados:=v_creados+1; end if;
    end if;
    return v_creados;
  end if;

  for v_i in 1..p_partidos loop
    exit when coalesce(array_length(v_lista,1),0)<2;
    v_a:=v_lista[1];
    v_j:=2;
    for k in 2..array_length(v_lista,1) loop
      if not exists (
        select 1 from public.partidos p
        where p.codigo_campeonato=p_codigo and (
          (p.id_equipo_1=v_a and p.id_equipo_2=v_lista[k]) or
          (p.id_equipo_1=v_lista[k] and p.id_equipo_2=v_a)
        )
      ) then
        v_j:=k;
        exit;
      end if;
    end loop;
    v_b:=v_lista[v_j];
    if public.insertar_partido_cuadro(p_codigo,'PP',p_ronda,v_i,v_a,v_b) then
      v_creados:=v_creados+1;
    end if;
    v_lista:=array_remove(array_remove(v_lista,v_a),v_b);
  end loop;
  return v_creados;
end;
$function$;
