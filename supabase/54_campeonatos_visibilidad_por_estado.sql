
create or replace function public.web_campeonato_activo()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce((
        select jsonb_build_object(
            'codigo_campeonato', c.codigo_campeonato,
            'nombre', c.nombre,
            'anio', c.anio,
            'estado', c.estado
        )
        from public.campeonatos c
        where lower(coalesce(c.estado,'')) in (
            'pretorneo','inscripciones','en_juego','finalizado'
        )
        order by
            case lower(coalesce(c.estado,''))
                when 'en_juego' then 0
                when 'inscripciones' then 1
                when 'pretorneo' then 2
                when 'finalizado' then 3
                else 9
            end,
            c.fecha_inicio desc nulls last,
            c.created_at desc
        limit 1
    ), '{}'::jsonb);
$$;

create or replace function public.web_campeonatos_publicos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'codigo_campeonato', c.codigo_campeonato,
                'nombre', c.nombre,
                'edicion', c.edicion,
                'anio', c.anio,
                'fecha_inicio', c.fecha_inicio,
                'fecha_fin', c.fecha_fin,
                'estado', c.estado
            )
            order by
                c.anio desc nulls last,
                c.fecha_inicio desc nulls last,
                c.created_at desc
        ),
        '[]'::jsonb
    )
    from public.campeonatos c
    where lower(coalesce(c.estado,'')) in (
        'pretorneo','inscripciones','en_juego','finalizado'
    );
$$;

create or replace function public.web_campeonatos_actuales_portal()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'codigo_campeonato', c.codigo_campeonato,
                'nombre', c.nombre,
                'anio', c.anio,
                'fecha_inicio', c.fecha_inicio,
                'fecha_fin', c.fecha_fin,
                'estado', c.estado,
                'tipo_campeonato', c.tipo_campeonato,
                'estructura_primera_fase', c.estructura_primera_fase,
                'inscripciones', (
                    select count(*)
                    from public.inscripciones_campeonato i
                    where i.codigo_campeonato=c.codigo_campeonato
                ),
                'equipos', (
                    select count(*)
                    from public.equipos e
                    where e.codigo_campeonato=c.codigo_campeonato
                      and coalesce(e.activo,true)
                ),
                'partidos', (
                    select count(*)
                    from public.partidos p
                    where p.codigo_campeonato=c.codigo_campeonato
                ),
                'jugados', (
                    select count(*)
                    from public.partidos p
                    where p.codigo_campeonato=c.codigo_campeonato
                      and lower(coalesce(p.estado,''))='jugado'
                ),
                'lugar', coalesce(
                    nullif(c.configuracion->>'lugar_campeonato',''),
                    nullif(c.configuracion->>'lugar',''),
                    nullif(c.configuracion->>'ubicacion',''),
                    ''
                )
            )
            order by
                case lower(coalesce(c.estado,''))
                    when 'en_juego' then 0
                    when 'inscripciones' then 1
                    when 'pretorneo' then 2
                    else 9
                end,
                c.fecha_inicio desc nulls last,
                c.created_at desc
        ),
        '[]'::jsonb
    )
    from public.campeonatos c
    where lower(coalesce(c.estado,'')) in (
        'pretorneo','inscripciones','en_juego'
    );
$$;

create or replace function public.admin_listar_campeonatos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select case when not public.es_administrador()
        then jsonb_build_object('ok', false, 'error', 'Acceso no autorizado')
        else jsonb_build_object(
            'ok', true,
            'campeonatos', coalesce((
                select jsonb_agg(
                    jsonb_build_object(
                        'codigo_campeonato', c.codigo_campeonato,
                        'nombre', c.nombre,
                        'anio', c.anio,
                        'fecha_inicio', c.fecha_inicio,
                        'estado', c.estado,
                        'equipos', (
                            select count(*)
                            from public.equipos e
                            where e.codigo_campeonato=c.codigo_campeonato
                        ),
                        'partidos', (
                            select count(*)
                            from public.partidos p
                            where p.codigo_campeonato=c.codigo_campeonato
                        ),
                        'inscripciones', (
                            select count(*)
                            from public.inscripciones_campeonato i
                            where i.codigo_campeonato=c.codigo_campeonato
                        )
                    )
                    order by
                        case lower(coalesce(c.estado,''))
                            when 'en_juego' then 0
                            when 'inscripciones' then 1
                            when 'pretorneo' then 2
                            when 'finalizado' then 3
                            else 9
                        end,
                        c.anio desc,
                        c.fecha_inicio desc nulls last,
                        c.codigo_campeonato desc
                )
                from public.campeonatos c
            ), '[]'::jsonb)
        )
    end;
$$;

grant execute on function public.web_campeonato_activo() to anon,authenticated;
grant execute on function public.web_campeonatos_publicos() to anon,authenticated;
grant execute on function public.web_campeonatos_actuales_portal() to anon,authenticated;
grant execute on function public.admin_listar_campeonatos() to authenticated;
