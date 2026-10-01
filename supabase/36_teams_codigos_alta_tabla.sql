create table if not exists public.jugadores_codigos_alta (
    id_jugador text primary key references public.jugadores(id_jugador) on delete cascade,
    codigo_hash text not null,
    expira_at timestamptz not null,
    intentos_fallidos integer not null default 0,
    bloqueado_hasta timestamptz,
    created_at timestamptz not null default now()
);

alter table public.jugadores_codigos_alta enable row level security;
