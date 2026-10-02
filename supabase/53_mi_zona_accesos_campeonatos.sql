
create or replace function public.web_mi_zona_campeonatos(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    jid text;
begin
    jid := public._teams_jugador_token(p_token);

    return (
        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'codigo',x.codigo_campeonato,
                    'nombre',x.nombre,
                    'estado',x.estado
                )
                order by x.fecha_inicio desc nulls last,x.codigo_campeonato desc
            ),
            '[]'::jsonb
        )
        from (
            select distinct
                c.codigo_campeonato,
                c.nombre,
                c.estado,
                c.fecha_inicio
            from public.campeonatos c
            join public.equipos e
              on e.codigo_campeonato=c.codigo_campeonato
             and coalesce(e.activo,true)
            where (e.id_jugador_1=jid or e.id_jugador_2=jid)
              and lower(coalesce(c.estado,'')) not in (
                  'finalizado','cancelado','cerrado'
              )
        ) x
    );
end
$$;

grant execute on function public.web_mi_zona_campeonatos(text)
to anon,authenticated;
