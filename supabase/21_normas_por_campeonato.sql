-- Normas por campeonato en Supabase.
-- Ejecutar una vez en el SQL Editor. El ultimo bloque importa el reglamento
-- actual de CAMP-2026-01 y puede ejecutarse de nuevo sin duplicar datos.

create table if not exists public.reglamentos_campeonato (
    codigo_campeonato text primary key
        references public.campeonatos(codigo_campeonato)
        on update cascade
        on delete cascade,
    contenido jsonb not null,
    actualizado_en timestamptz not null default now(),
    constraint reglamentos_contenido_objeto
        check (jsonb_typeof(contenido) = 'object'),
    constraint reglamentos_elementos_array
        check (
            contenido ? 'elementos'
            and jsonb_typeof(contenido -> 'elementos') = 'array'
        ),
    constraint reglamentos_puntuacion_array
        check (
            not (contenido ? 'puntuacion')
            or jsonb_typeof(contenido -> 'puntuacion') = 'array'
        )
);

alter table public.reglamentos_campeonato enable row level security;

revoke all on table public.reglamentos_campeonato
from anon, authenticated;

drop policy if exists "Administradores leen reglamentos"
on public.reglamentos_campeonato;

create policy "Administradores leen reglamentos"
on public.reglamentos_campeonato
for select
to authenticated
using ((select public.es_administrador()));

create or replace function public.web_normas(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $function$
    select
        r.contenido ||
        jsonb_build_object(
            'configuracion',
            coalesce(
                public.web_obtener_configuracion(r.codigo_campeonato),
                r.contenido -> 'configuracion',
                '{}'::jsonb
            )
        )
    from public.reglamentos_campeonato r
    where r.codigo_campeonato = p_codigo;
$function$;

create or replace function public.admin_guardar_normas(
    p_codigo text,
    p_contenido jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
begin
    if not public.es_administrador() then
        return jsonb_build_object(
            'ok', false,
            'error', 'Acceso no autorizado'
        );
    end if;

    if not exists (
        select 1
        from public.campeonatos
        where codigo_campeonato = p_codigo
    ) then
        return jsonb_build_object(
            'ok', false,
            'error', 'El campeonato no existe'
        );
    end if;

    if jsonb_typeof(p_contenido) <> 'object'
       or jsonb_typeof(p_contenido -> 'elementos') <> 'array'
       or jsonb_array_length(p_contenido -> 'elementos') = 0 then
        return jsonb_build_object(
            'ok', false,
            'error', 'El reglamento no tiene un formato valido'
        );
    end if;

    insert into public.reglamentos_campeonato (
        codigo_campeonato,
        contenido,
        actualizado_en
    )
    values (
        p_codigo,
        p_contenido,
        now()
    )
    on conflict (codigo_campeonato)
    do update set
        contenido = excluded.contenido,
        actualizado_en = excluded.actualizado_en;

    return jsonb_build_object(
        'ok', true,
        'codigo_campeonato', p_codigo,
        'elementos', jsonb_array_length(p_contenido -> 'elementos')
    );
end;
$function$;

revoke all on function public.web_normas(text) from public;
revoke all on function public.admin_guardar_normas(text, jsonb) from public;

grant execute on function public.web_normas(text)
to anon, authenticated;
grant execute on function public.admin_guardar_normas(text, jsonb)
to authenticated;

insert into public.reglamentos_campeonato (
    codigo_campeonato,
    contenido,
    actualizado_en
)
values (
    'CAMP-2026-01',
    $reglas${"version":1,"generado":"2026-09-05T14:41:22","configuracion":{"id_campeonato":"II Campeonato Sprint Pádel - Tui 2026","nombre_campeonato":"II Campeonato - Sprint Pádel Tui - Año 2026","estado_torneo":"Inscripciones","tipo_campeonato":"","estructura_primera_fase":"","num_grupos_iniciales":0,"num_grupos_para_cruces":0,"equipos_por_grupo":0,"hay_regrupos":"No","equipos_pasan_a_regrupos":0,"equipos_pasan_a_cruces_por_grupo":0,"puntos_partido_arrastrado":0,"num_pistas_disponibles":4,"ronda_inicial_eliminatorias":"","criterio_generar_cruces":"","hay_copa_palas_playa":"No","criterio_palas_playa":"","posicion_inicio_palas_playa":9,"puntos_maximos_por_set":15,"sistema_puntuacion":"","ordenar_clasificacion":"","modo_generar_jornadas":"","fase_previa_cruces":"Liguilla","escenario_cruces":"Otra combinación"},"elementos":[{"id":"PAG_001","area":"Página","seccion":"Cabecera","tipo":"Texto alternativo","orden_seccion":0,"orden_elemento":1,"icono":"","texto":"II Campeonato Sprint Pádel Tui"},{"id":"PAG_002","area":"Página","seccion":"Cabecera","tipo":"Título navegador","orden_seccion":0,"orden_elemento":2,"icono":"","texto":"Reglas · II Campeonato - Sprint Pádel Tui - Año 2026"},{"id":"PAG_003","area":"Página","seccion":"Resumen superior","tipo":"Etiqueta","orden_seccion":0,"orden_elemento":3,"icono":"","texto":"FORMATO DE ESTA EDICIÓN"},{"id":"PAG_004","area":"Página","seccion":"Resumen superior","tipo":"Título dinámico","orden_seccion":0,"orden_elemento":4,"icono":"","texto":"Pendiente del número de equipos "},{"id":"PAG_005","area":"Página","seccion":"Resumen superior","tipo":"Descripción","orden_seccion":0,"orden_elemento":5,"icono":"","texto":"El formato definitivo se establecerá cuando se conozca el número total de equipos inscritos."},{"id":"REG_201","area":"Reglas","seccion":"Formato de los partidos","tipo":"Título","orden_seccion":3,"orden_elemento":1,"icono":"🎾","texto":"Formato de los partidos"},{"id":"REG_205","area":"Reglas","seccion":"Formato de los partidos","tipo":"Párrafo","orden_seccion":3,"orden_elemento":5,"icono":"","texto":"Los partidos de Mata-Mata se disputan al mejor de tres sets. El encuentro finaliza cuando una pareja consigue ganar dos sets."},{"id":"REG_207","area":"Reglas","seccion":"Formato de los partidos","tipo":"Aviso","orden_seccion":3,"orden_elemento":7,"icono":"ℹ️","texto":"Todos los sets se juegan a 10 puntos. En la primera fase siempre se disputan los tres sets, mientras que en Mata-Mata y Palas de Playa el partido finaliza en cuanto una pareja alcanza dos sets ganados."},{"id":"RES_001","area":"Regla","seccion":"Comunicación de resultados","tipo":"Título","orden_seccion":10,"orden_elemento":1,"icono":"✅","texto":"Comunicación de resultados"},{"id":"RES_002","area":"Regla","seccion":"Comunicación de resultados","tipo":"Subtítulo","orden_seccion":10,"orden_elemento":2,"icono":"","texto":"Qué hacer al terminar cada partido"},{"id":"RES_CR01","area":"Regla","seccion":"Comunicación de resultados","tipo":"Paso","orden_seccion":10,"orden_elemento":3,"icono":"","texto":"Comprobar el marcador entre las dos parejas."},{"id":"RES_CR02","area":"Regla","seccion":"Comunicación de resultados","tipo":"Paso","orden_seccion":10,"orden_elemento":4,"icono":"","texto":"Comunicar el resultado a la organización."},{"id":"RES_CR03","area":"Regla","seccion":"Comunicación de resultados","tipo":"Paso","orden_seccion":10,"orden_elemento":5,"icono":"","texto":"Revisar que el partido aparezca correctamente actualizado en la web."},{"id":"RES_CR04","area":"Regla","seccion":"Comunicación de resultados","tipo":"Paso","orden_seccion":10,"orden_elemento":6,"icono":"","texto":"Avisar cuanto antes si se detecta cualquier error de transcripción."},{"id":"CON_001","area":"Regla","seccion":"Juego limpio y convivencia","tipo":"Título","orden_seccion":11,"orden_elemento":1,"icono":"🤝","texto":"Juego limpio y convivencia"},{"id":"CON_002","area":"Regla","seccion":"Juego limpio y convivencia","tipo":"Subtítulo","orden_seccion":11,"orden_elemento":2,"icono":"","texto":"Normas generales de comportamiento"},{"id":"CON_CR01","area":"Regla","seccion":"Juego limpio y convivencia","tipo":"Viñeta","orden_seccion":11,"orden_elemento":3,"icono":"","texto":"Tratar con respeto a compañeros, rivales y organización."},{"id":"CON_CR02","area":"Regla","seccion":"Juego limpio y convivencia","tipo":"Viñeta","orden_seccion":11,"orden_elemento":4,"icono":"","texto":"Las bolas dudosas se resolverán con deportividad y exclusivamente entre las dos parejas que estén disputando el partido. El público, las parejas que estén esperando y cualquier otra persona ajena al encuentro no podrán intervenir en la decisión."},{"id":"CON_CR05","area":"Regla","seccion":"Juego limpio y convivencia","tipo":"Viñeta","orden_seccion":11,"orden_elemento":5,"icono":"","texto":"Es una muestra de deportividad y buena convivencia hacer llegar las bolas al jugador que va a sacar, entregándoselas en la mano o mediante un pase suave. Debe evitarse devolvérselas con una patada, golpeándolas a ras de suelo o de cualquier forma que dificulte recogerlas."},{"id":"CON_CR06","area":"Regla","seccion":"Juego limpio y convivencia","tipo":"Viñeta","orden_seccion":11,"orden_elemento":6,"icono":"","texto":"Antes de enviar una bola al jugador que va a sacar, se comprobará si ya dispone de dos bolas. En ese caso, no se le enviará una tercera salvo que la solicite."},{"id":"CON_CR03","area":"Regla","seccion":"Juego limpio y convivencia","tipo":"Viñeta","orden_seccion":11,"orden_elemento":7,"icono":"","texto":"Dejar libre la pista al terminar el encuentro."},{"id":"CON_CR04","area":"Regla","seccion":"Juego limpio y convivencia","tipo":"Viñeta","orden_seccion":11,"orden_elemento":8,"icono":"","texto":"Evitar conductas que retrasen o dificulten el desarrollo del campeonato."},{"id":"CONSE_001","area":"Regla","seccion":"Consejos para el día del torneo","tipo":"Título","orden_seccion":12,"orden_elemento":1,"icono":"💡","texto":"Consejos para el día del torneo"},{"id":"CONSE_002","area":"Regla","seccion":"Consejos para el día del torneo","tipo":"Subtítulo","orden_seccion":12,"orden_elemento":2,"icono":"","texto":"Pequeños detalles que ayudan a que todo fluya"},{"id":"CONSE_CR01","area":"Regla","seccion":"Consejos para el día del torneo","tipo":"Viñeta","orden_seccion":12,"orden_elemento":3,"icono":"","texto":"Consulta la web antes de cada partido."},{"id":"CONSE_CR02","area":"Regla","seccion":"Consejos para el día del torneo","tipo":"Viñeta","orden_seccion":12,"orden_elemento":4,"icono":"","texto":"Calienta con tiempo y ten preparado tu material."},{"id":"CONSE_CR04","area":"Regla","seccion":"Consejos para el día del torneo","tipo":"Viñeta","orden_seccion":12,"orden_elemento":6,"icono":"","texto":"Después de jugar, revisa cuándo podría ser tu siguiente encuentro."},{"id":"SUS_001","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Título","orden_seccion":14,"orden_elemento":1,"icono":"🩹","texto":" Bajas y sustituciones "},{"id":"SUS_002","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Subtítulo","orden_seccion":14,"orden_elemento":2,"icono":"","texto":" Sustitución de jugadores por lesión o causa de fuerza mayor "},{"id":"SUS_003","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Párrafo","orden_seccion":14,"orden_elemento":3,"icono":"","texto":" Las sustituciones estarán permitidas únicamente con autorización de la organización y deberán realizarse procurando mantener la igualdad deportiva del campeonato. "},{"id":"SUS_004","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":4,"icono":"","texto":" Antes de disputar el primer partido, un jugador podrá ser sustituido si no puede participar por lesión o causa de fuerza mayor. "},{"id":"SUS_005","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":5,"icono":"","texto":" Una vez iniciado el campeonato, las sustituciones tendrán carácter excepcional y deberán ser aprobadas expresamente por la organización. "},{"id":"SUS_006","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":6,"icono":"","texto":" El jugador sustituto podrá pertenecer a otro equipo participante en el campeonato. La sustitución deberá ser autorizada por la organización y no deberá suponer una alteración injustificada del equilibrio deportivo. "},{"id":"SUS_007","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":7,"icono":"","texto":" Los resultados obtenidos antes de la sustitución se mantendrán y el equipo conservará su clasificación, sus puntos y su posición en el campeonato. "},{"id":"SUS_008","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":8,"icono":"","texto":" Cada partido conservará los jugadores que realmente lo disputaron. Los partidos anteriores a la sustitución seguirán asociados al jugador sustituido y los posteriores quedarán asociados al sustituto. "},{"id":"SUS_009","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":9,"icono":"","texto":" Cuando un jugador participe como sustituto en otro equipo, cada partido quedará asociado al equipo con el que lo haya disputado y a su ID personal como participante real. "},{"id":"SUS_010","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":10,"icono":"","texto":" El ranking histórico se actualizará teniendo en cuenta los participantes reales registrados en cada partido. "},{"id":"SUS_011","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":11,"icono":"","texto":" Al finalizar el campeonato, las sustituciones y los participantes reales quedarán conservados en el histórico de partidos y del ranking. "},{"id":"SUS_012","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":12,"icono":"","texto":" No se permitirá cambiar de jugador durante un partido ya comenzado. Si una pareja no puede continuar, el encuentro finalizará por retirada. "},{"id":"SUS_013","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Viñeta","orden_seccion":14,"orden_elemento":13,"icono":"","texto":" En caso de retirada por lesión, se conservará el marcador registrado hasta ese momento y la pareja rival será declarada vencedora. "},{"id":"SUS_014","area":"Regla","seccion":"Bajas y sustituciones","tipo":"Destacado","orden_seccion":14,"orden_elemento":14,"icono":"","texto":" La organización resolverá cualquier situación no prevista, evitando que la sustitución suponga una mejora injustificada del nivel del equipo. "},{"id":"CAM_001","area":"Regla","seccion":"Campeones vigentes","tipo":"Título","orden_seccion":15,"orden_elemento":1,"icono":"🏆","texto":" Campeones vigentes "},{"id":"CAM_002","area":"Regla","seccion":"Campeones vigentes","tipo":"Subtítulo","orden_seccion":15,"orden_elemento":2,"icono":"","texto":" Permanencia de la pareja campeona y regreso al sorteo "},{"id":"CAM_003","area":"Regla","seccion":"Campeones vigentes","tipo":"Párrafo","orden_seccion":15,"orden_elemento":3,"icono":"","texto":" La pareja campeona conservará su composición y quedará exenta del sorteo mientras mantenga el título, pudiendo defenderlo durante un máximo de tres ediciones posteriores a aquella en la que se proclamó campeona. La edición en la que obtiene el título no cuenta dentro de esas tres ediciones. "},{"id":"CAM_004","area":"Regla","seccion":"Campeones vigentes","tipo":"Viñeta","orden_seccion":15,"orden_elemento":4,"icono":"","texto":" Si la pareja pierde el título antes de alcanzar ese límite, dejará de estar protegida y sus dos jugadores volverán individualmente al sorteo de la siguiente edición. "},{"id":"CAM_005","area":"Regla","seccion":"Campeones vigentes","tipo":"Viñeta","orden_seccion":15,"orden_elemento":5,"icono":"","texto":" Si después de disputar las tres ediciones posteriores a la obtención del título la pareja continúa siendo la campeona vigente, se disolverá igualmente y sus dos jugadores volverán individualmente al sorteo de la siguiente edición. "},{"id":"CAM_006","area":"Regla","seccion":"Campeones vigentes","tipo":"Viñeta","orden_seccion":15,"orden_elemento":6,"icono":"","texto":" Los dos jugadores podrán volver a formar pareja si el propio sorteo los empareja de nuevo. "},{"id":"CAM_007","area":"Regla","seccion":"Campeones vigentes","tipo":"Destacado","orden_seccion":15,"orden_elemento":7,"icono":"","texto":" La edición en la que la pareja consigue el título no computa dentro del límite. La pareja podrá permanecer unida durante las tres ediciones siguientes, siempre que continúe siendo la campeona vigente. "},{"id":"CAM_008","area":"Regla","seccion":"Campeones vigentes","tipo":"Ejemplo","orden_seccion":15,"orden_elemento":8,"icono":"","texto":" Si una pareja se proclama campeona en 2026, podrá mantenerse unida para defender el título en 2027, 2028 y 2029. Si al finalizar la edición de 2029 continúa siendo campeona, sus jugadores volverán por separado al sorteo de 2030. "},{"id":"SET_001","area":"Regla","seccion":"Puntuación de los sets","tipo":"Título","orden_seccion":16,"orden_elemento":1,"icono":"🎾","texto":"Puntuación de los sets"},{"id":"SET_002","area":"Regla","seccion":"Puntuación de los sets","tipo":"Subtítulo","orden_seccion":16,"orden_elemento":2,"icono":"","texto":"Objetivo, diferencia necesaria y límite máximo"},{"id":"SET_003","area":"Regla","seccion":"Puntuación de los sets","tipo":"Párrafo","orden_seccion":16,"orden_elemento":3,"icono":"","texto":"Cada set se disputará a 10 puntos. Para ganar será necesario alcanzar esa puntuación y disponer de una ventaja mínima de dos puntos sobre el equipo rival."},{"id":"SET_004","area":"Regla","seccion":"Puntuación de los sets","tipo":"Viñeta","orden_seccion":16,"orden_elemento":4,"icono":"","texto":"Si un equipo alcanza la puntuación objetivo con dos o más puntos de ventaja, el set finalizará en ese momento."},{"id":"SET_005","area":"Regla","seccion":"Puntuación de los sets","tipo":"Viñeta","orden_seccion":16,"orden_elemento":5,"icono":"","texto":"Si se alcanza la puntuación objetivo sin una diferencia de dos puntos, el set continuará hasta que uno de los equipos consiga ese margen."},{"id":"SET_006","area":"Regla","seccion":"Puntuación de los sets","tipo":"Viñeta dinámica","orden_seccion":16,"orden_elemento":6,"icono":"","texto":"La puntuación máxima será de 15 puntos. El primer equipo que alcance ese límite ganará el set, aunque únicamente tenga un punto de ventaja."},{"id":"SET_007","area":"Regla","seccion":"Puntuación de los sets","tipo":"Ejemplo","orden_seccion":16,"orden_elemento":7,"icono":"","texto":"Si el set se juega a 10 puntos, un resultado de 10-8 finaliza el set, mientras que un 10-9 obliga a continuar. También puede finalizar 12-10 o 14-12. Si se llega a 14-14, el siguiente punto decide y el resultado será 15-14."},{"id":"SET_008","area":"Regla","seccion":"Puntuación de los sets","tipo":"Destacado","orden_seccion":16,"orden_elemento":8,"icono":"","texto":"Los 15 puntos no son la puntuación habitual del set, sino el límite máximo aplicable cuando ningún equipo consigue antes una ventaja de dos puntos."}],"puntuacion":[{"sistema":"Normal","situacion":"Victoria sin ceder sets","ganador":"3","perdedor":"0"},{"sistema":"Normal","situacion":"Victoria cediendo algún set","ganador":"3","perdedor":"0"},{"sistema":"Normal","situacion":"Descanso programado","ganador":"0","perdedor":"—"},{"sistema":"Equitativo","situacion":"Victoria sin ceder sets","ganador":"3","perdedor":"0"},{"sistema":"Equitativo","situacion":"Victoria cediendo algún set","ganador":"3","perdedor":"0"},{"sistema":"Equitativo","situacion":"Descanso programado","ganador":"2","perdedor":"—"},{"sistema":"Competitivo","situacion":"Victoria sin ceder sets","ganador":"3","perdedor":"0"},{"sistema":"Competitivo","situacion":"Victoria cediendo algún set","ganador":"2","perdedor":"1"},{"sistema":"Competitivo","situacion":"Descanso programado","ganador":"2","perdedor":"—"}]}$reglas$::jsonb,
    now()
)
on conflict (codigo_campeonato)
do update set
    contenido = excluded.contenido,
    actualizado_en = excluded.actualizado_en;

-- Comprobacion esperada: 57 elementos y 9 filas de puntuacion.
select
    codigo_campeonato,
    jsonb_array_length(contenido -> 'elementos') as elementos,
    jsonb_array_length(contenido -> 'puntuacion') as puntuacion,
    actualizado_en
from public.reglamentos_campeonato
where codigo_campeonato = 'CAMP-2026-01';

