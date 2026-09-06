# Especificación funcional · Módulo Estadísticas

**Proyecto:** Campeonato Pádel  
**Versión:** 1.0  
**Estado:** Aprobada para implementación  
**Ámbito:** Excel/VBA, `estadisticas.json` y web

## 1. Objetivo

El módulo de Estadísticas analiza resultados, rendimiento, récords, parejas, rivalidades, pistas y duraciones. No concede puntos ni determina la clasificación histórica.

- **Ranking histórico:** ordena jugadores mediante el baremo oficial de puntos.
- **Estadísticas:** describen lo ocurrido en los campeonatos y partidos.

## 2. Ámbitos

### 2.1 Global

Incluye únicamente campeonatos cerrados y consolidados en las hojas `HIST_*`.

### 2.2 Por campeonato

Analiza una edición cerrada concreta. Los campeonatos en juego no se incorporan hasta su cierre.

## 3. Fuentes de datos

- `HIST_CAMPEONATOS`
- `HIST_EQUIPOS`
- `HIST_CLASIFICACIONES`
- `HIST_PARTIDOS`
- `HIST_RANKING`
- `Jugadores`

Las estadísticas de jugadores, parejas y rivalidades utilizan los IDs reales de quienes disputaron cada encuentro. Las estadísticas del equipo se atribuyen al equipo inscrito.

## 4. Formato de los partidos

### 4.1 Fases de clasificación

En liguilla, grupos y regrupos se disputan siempre tres sets. Los tres cuentan para clasificación, histórico y estadísticas, aunque una pareja gane los dos primeros.

### 4.2 Eliminatorias directas

En octavos, cuartos, semifinales, final y Copa Palas de Playa, el encuentro termina cuando una pareja gana dos sets.

- Resultado 2-0: se disputan dos sets.
- Resultado 2-1: se disputan tres sets.
- No se debe registrar un tercer set cuando el encuentro ya terminó 2-0.

El módulo estadístico cuenta únicamente los sets realmente registrados; no presupone que todos los encuentros tengan tres.

## 5. Unidad estadística

Para medir igualdad, dominio, ataque y defensa, la unidad básica es el **set**.

Las sumas completas del partido se mantienen solo para estadísticas de volumen, como puntos totales, duración total o número de sets.

## 6. Métricas de cada partido

Por cada encuentro se calculan:

- Sets disputados.
- Puntos totales.
- Margen absoluto de cada set.
- Suma de márgenes de los sets.
- Margen medio por set.
- Mayor margen de un set.
- Menor margen de un set.
- Sets ganados por la pareja perdedora.

## 7. Partido más igualado

Se selecciona mediante estos criterios, en este orden:

1. Menor margen medio por set.
2. Menor margen máximo en cualquiera de los sets.
3. Mayor número de sets disputados.
4. Mayor número de puntos totales.

Si todos los criterios empatan, se muestran todos los partidos empatados.

## 8. Partido con mayor dominio

Se selecciona mediante estos criterios, en este orden:

1. Mayor margen medio por set.
2. Mayor margen mínimo entre sus sets, para premiar el dominio constante.
3. Menor número de sets ganados por la pareja perdedora; un 2-0 precede a un 2-1 cuando lo demás empata.
4. Mayor margen máximo en un set.

Si todos los criterios empatan, se muestran todos los partidos empatados.

## 9. Estadísticas de volumen

Se calculan sobre el encuentro completo:

- Partido con más puntos totales.
- Partido con menos puntos totales.
- Sets totales disputados.
- Puntos totales disputados.
- Partidos por fase.
- Duración total.

## 10. Estadísticas de equipos

Para cada equipo:

- Partidos jugados, ganados y perdidos.
- Porcentaje de victorias: `PG / PJ`.
- Sets a favor y en contra.
- Puntos a favor y en contra.
- Diferencias acumuladas, cuando se necesiten como dato secundario.
- Duración media de sus partidos, si existe duración.

### 10.1 Mejor ataque

Mayor media de puntos anotados por set disputado.

### 10.2 Mejor defensa

Menor media de puntos recibidos por set disputado.

El divisor es el número real de sets disputados, no el número de partidos.

## 11. Parejas

Cada pareja se identifica mediante la combinación ordenada de sus dos IDs reales.

La tarjeta muestra:

- Nombre de la pareja.
- Partidos juntos.
- Partidos ganados y perdidos.
- Sets a favor y en contra.
- Porcentaje acompañado de la etiqueta **Victorias**, por ejemplo: `75 % Victorias`.

No se muestra la diferencia acumulada de puntos en la tarjeta principal.

## 12. Jugadores y rachas

- El porcentaje de victorias se calcula como `PG / PJ`.
- Las rachas cuentan partidos consecutivos ganados, no sets.
- Títulos y finales proceden del palmarés consolidado.
- Las sustituciones se asignan a los jugadores reales que disputaron cada partido.

## 13. Partidos dentro de un campeonato

La sección no muestra un calendario separado ni tarjetas por jornada.

Los partidos se agrupan en desplegables por fase:

- Grupos.
- ReGrupos.
- Octavos.
- Cuartos.
- Semifinales.
- Final.
- Palas de Playa.

Cada partido mantiene:

- Fase, grupo o ronda y jornada.
- Parejas participantes.
- Resultado.
- Ganador.
- Pista, cuando exista.
- Duración, cuando exista.

No se muestra a la derecha la suma de puntos totales del partido.

## 14. Pistas y duraciones

- Solo se incluyen partidos con pista registrada.
- Solo se calculan duraciones con valores reales mayores que cero.
- Si no existen datos, se muestra `Sin datos de duración`.
- Pista más utilizada: mayor número de partidos.
- Pista más rápida y más lenta: duración media por partido, con el mínimo de partidos definido por el módulo.
- La duración total representa carga de uso, no rapidez.

## 15. Empates en récords

Nunca se elige un único registro arbitrariamente. Cuando varios elementos cumplen exactamente los criterios del récord, se muestran todos.

## 16. Presentación web

Secciones:

1. Resumen.
2. Partidos.
3. Pistas.
4. Parejas y rivalidades.
5. Récords y curiosidades.

Las estadísticas individuales históricas detalladas permanecen en la ficha del jugador dentro del Ranking histórico.

## 17. Generación y publicación

- `estadisticas.json` se genera al cerrar el campeonato.
- Se calcula desde las hojas históricas consolidadas.
- Existe una macro pública de exportación manual para reconstruir el JSON tras una corrección histórica.
- La web muestra únicamente los ámbitos presentes en el JSON.

## 18. Evolución futura

El diseño permite añadir sin alterar las reglas actuales:

- Set más igualado y set con mayor diferencia.
- Finales decididas 2-0 o 2-1.
- Estadísticas por ronda concreta.
- Gráficas de evolución.
- Comparadores entre parejas, equipos o jugadores.
- Estadísticas avanzadas si en el futuro se registran nuevos datos.

## 19. Control de cambios

### Versión 1.0

- Separación entre estadísticas y ranking histórico.
- Dos ámbitos: global y campeonato.
- Igualdad y dominio calculados set a set.
- Ataque y defensa calculados por set.
- Eliminatorias al mejor de tres sets; finalizan al alcanzar dos sets.
- Parejas con porcentaje etiquetado como Victorias.
- Partidos agrupados por fase y sin calendario duplicado.
