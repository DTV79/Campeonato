-- Baremo editable del Ranking Histórico por campeonato.
-- Palas de Playa permanece excluida del Ranking Histórico y del ISP oficial.

alter table public.config_ranking_campeonato
  add column if not exists maximo_puntos_edicion integer not null default 800;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'config_ranking_maximo_edicion_positivo'
      and conrelid = 'public.config_ranking_campeonato'::regclass
  ) then
    alter table public.config_ranking_campeonato
      add constraint config_ranking_maximo_edicion_positivo
      check (maximo_puntos_edicion > 0);
  end if;
end $$;

create or replace function public.admin_obtener_baremo_ranking(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cerrado boolean;
  v_baremo jsonb;
begin
  if not public.es_administrador() then
    raise exception 'No autorizado';
  end if;

  if not exists (select 1 from public.campeonatos where codigo_campeonato = p_codigo) then
    return jsonb_build_object('ok', false, 'error', 'El campeonato no existe.');
  end if;

  select coalesce(cc.estado = 'cerrado', false) or c.estado = 'finalizado'
    into v_cerrado
  from public.campeonatos c
  left join public.cierres_campeonato cc using (codigo_campeonato)
  where c.codigo_campeonato = p_codigo;

  select jsonb_build_object(
    'puntos_participacion', coalesce(cfg.puntos_participacion, 50),
    'puntos_campeon', coalesce(max(r.puntos) filter (where r.codigo_resultado = 'campeon'), 600),
    'puntos_subcampeon', coalesce(max(r.puntos) filter (where r.codigo_resultado = 'subcampeon'), 450),
    'puntos_semifinalista', coalesce(max(r.puntos) filter (where r.codigo_resultado = 'semifinalista'), 350),
    'puntos_cuartos', coalesce(max(r.puntos) filter (where r.codigo_resultado = 'cuartos'), 250),
    'puntos_octavos', coalesce(max(r.puntos) filter (where r.codigo_resultado = 'octavos'), 150),
    'max_bonus_victorias', coalesce(cfg.factor_victorias, 100),
    'max_bonus_sets', coalesce(cfg.factor_sets, 50),
    'maximo_puntos_edicion', coalesce(cfg.maximo_puntos_edicion, 800),
    'palas_playa_suma_ranking', false
  ) into v_baremo
  from (select p_codigo as codigo_campeonato) base
  left join public.config_ranking_campeonato cfg using (codigo_campeonato)
  left join public.reglas_ranking_resultado r using (codigo_campeonato)
  group by cfg.puntos_participacion, cfg.factor_victorias, cfg.factor_sets,
           cfg.maximo_puntos_edicion;

  return jsonb_build_object('ok', true, 'cerrado', v_cerrado, 'baremo', v_baremo);
end;
$$;

create or replace function public.admin_guardar_baremo_ranking(p_codigo text, p_baremo jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_participacion integer;
  v_campeon integer;
  v_subcampeon integer;
  v_semifinalista integer;
  v_cuartos integer;
  v_octavos integer;
  v_bonus_victorias integer;
  v_bonus_sets integer;
  v_maximo integer;
begin
  if not public.es_administrador() then
    raise exception 'No autorizado';
  end if;

  perform pg_advisory_xact_lock(hashtext('baremo-ranking:' || p_codigo));

  if not exists (select 1 from public.campeonatos where codigo_campeonato = p_codigo) then
    return jsonb_build_object('ok', false, 'error', 'El campeonato no existe.');
  end if;

  if exists (
    select 1 from public.campeonatos c
    left join public.cierres_campeonato cc using (codigo_campeonato)
    where c.codigo_campeonato = p_codigo
      and (c.estado = 'finalizado' or cc.estado = 'cerrado')
  ) then
    return jsonb_build_object('ok', false, 'error', 'Reabre el campeonato antes de modificar su baremo.');
  end if;

  begin
    v_participacion := (p_baremo ->> 'puntos_participacion')::integer;
    v_campeon := (p_baremo ->> 'puntos_campeon')::integer;
    v_subcampeon := (p_baremo ->> 'puntos_subcampeon')::integer;
    v_semifinalista := (p_baremo ->> 'puntos_semifinalista')::integer;
    v_cuartos := (p_baremo ->> 'puntos_cuartos')::integer;
    v_octavos := (p_baremo ->> 'puntos_octavos')::integer;
    v_bonus_victorias := (p_baremo ->> 'max_bonus_victorias')::integer;
    v_bonus_sets := (p_baremo ->> 'max_bonus_sets')::integer;
    v_maximo := (p_baremo ->> 'maximo_puntos_edicion')::integer;
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'Todos los valores del baremo deben ser números enteros.');
  end;

  if v_participacion < 0 or v_campeon < 0 or v_subcampeon < 0
     or v_semifinalista < 0 or v_cuartos < 0 or v_octavos < 0
     or v_bonus_victorias < 0 or v_bonus_sets < 0 or v_maximo < 1 then
    return jsonb_build_object('ok', false, 'error', 'Los valores no pueden ser negativos y el máximo debe ser mayor que cero.');
  end if;

  insert into public.config_ranking_campeonato (
    codigo_campeonato, puntos_participacion, factor_victorias, factor_sets,
    palas_playa_suma_ranking, maximo_puntos_edicion, updated_at
  ) values (
    p_codigo, v_participacion, v_bonus_victorias, v_bonus_sets,
    false, v_maximo, now()
  )
  on conflict (codigo_campeonato) do update set
    puntos_participacion = excluded.puntos_participacion,
    factor_victorias = excluded.factor_victorias,
    factor_sets = excluded.factor_sets,
    palas_playa_suma_ranking = false,
    maximo_puntos_edicion = excluded.maximo_puntos_edicion,
    updated_at = now();

  insert into public.reglas_ranking_resultado
    (codigo_campeonato, codigo_resultado, nombre, puntos, orden, updated_at)
  values
    (p_codigo, 'campeon', 'Campeón', v_campeon, 1, now()),
    (p_codigo, 'subcampeon', 'Subcampeón', v_subcampeon, 2, now()),
    (p_codigo, 'semifinalista', 'Semifinalista', v_semifinalista, 3, now()),
    (p_codigo, 'cuartos', 'Cuartos', v_cuartos, 4, now()),
    (p_codigo, 'octavos', 'Octavos', v_octavos, 5, now()),
    (p_codigo, 'palas_playa', 'Palas de Playa', 0, 6, now()),
    (p_codigo, 'ultimo_palas_playa', 'Último - Palas de Playa', 0, 7, now())
  on conflict (codigo_campeonato, codigo_resultado) do update set
    nombre = excluded.nombre,
    puntos = excluded.puntos,
    orden = excluded.orden,
    updated_at = now();

  return public.admin_obtener_baremo_ranking(p_codigo);
end;
$$;

-- Protección independiente del algoritmo de cierre: limita tanto los puntos de
-- la edición como el acumulado correspondiente, sin cambiar el resto del cálculo.
create or replace function public.aplicar_maximo_ranking_edicion()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_maximo integer;
  v_exceso integer;
begin
  select maximo_puntos_edicion into v_maximo
  from public.config_ranking_campeonato
  where codigo_campeonato = new.codigo_campeonato;

  v_maximo := coalesce(v_maximo, 800);
  if new.puntos_edicion > v_maximo then
    v_exceso := new.puntos_edicion - v_maximo;
    new.puntos_edicion := v_maximo;
    new.puntos_acumulados := greatest(0, new.puntos_acumulados - v_exceso);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_aplicar_maximo_ranking_edicion on public.ranking_jugadores_edicion;
create trigger trg_aplicar_maximo_ranking_edicion
before insert or update of puntos_edicion, puntos_acumulados
on public.ranking_jugadores_edicion
for each row execute function public.aplicar_maximo_ranking_edicion();

revoke all on function public.admin_obtener_baremo_ranking(text) from public, anon;
revoke all on function public.admin_guardar_baremo_ranking(text, jsonb) from public, anon;
grant execute on function public.admin_obtener_baremo_ranking(text) to authenticated;
grant execute on function public.admin_guardar_baremo_ranking(text, jsonb) to authenticated;

