
create or replace function public.admin_teams_eliminar(
    p_team_id uuid,
    p_nombre_confirmacion text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_nombre text;
begin
    if not public.es_administrador() then
        raise exception 'Acceso no autorizado';
    end if;

    select nombre
      into v_nombre
      from public.teams
     where id = p_team_id;

    if v_nombre is null then
        raise exception 'Teams no encontrado';
    end if;

    if trim(coalesce(p_nombre_confirmacion,'')) <> v_nombre then
        raise exception 'Escribe exactamente el nombre del Teams para confirmar';
    end if;

    -- Los partidos mantienen referencias a los equipos (ganador, primer presentador
    -- y jugadores alineados). Se eliminan primero para no chocar con esas FK.
    delete from public.teams_partidos
     where team_id = p_team_id;

    -- El resto de tablas dependientes de Teams/Equipos tienen ON DELETE CASCADE.
    delete from public.teams
     where id = p_team_id;
end
$$;
