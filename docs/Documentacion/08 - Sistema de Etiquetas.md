# 08 - Sistema de Etiquetas de Equipos

## Objetivo

El sistema de etiquetas destaca méritos positivos y curiosidades deportivas de cada equipo. Las etiquetas se calculan exclusivamente con los partidos de la competición principal; **Palas de Playa queda excluida**.

## Presentación en la web

- Se muestran como máximo **4 etiquetas** inicialmente.
- Las restantes se abren con **“+N más”** y se vuelven a ocultar con **“Ver menos”**.
- El orden visible sigue la prioridad definida más abajo.
- Un único botón de información **ℹ️**, destacado en color naranja/dorado, abre el panel con todos los criterios.
- Los empates solo comparten etiqueta después de aplicar los desempates específicos.
- Una etiqueta no aparece cuando nadie alcanza su requisito mínimo.

## Prioridad

1. 🏆 Más victorias
2. 📊 Mejor porcentaje
3. 👑 Invictos
4. ⚡ Mejor ataque
5. 🛡️ Mejor defensa
6. 📈 Mejor balance de sets
7. ➕ Mejor balance de puntos
8. 💥 Más contundentes
9. 🧠 Reyes del decisivo
10. 🔄 Remontadores
11. 🔥 Mejor racha
12. 🐉 Mata-gigantes
13. 🧹 Más victorias limpias
14. 🚀 Mejor arranque
15. 🔒 Mejor cierre
16. ⚔️ Más luchadores
17. 🎯 Más dominante
18. 😅 Partidos de infarto

## Criterios definitivos

### 🏆 Más victorias
Mayor número total de partidos ganados en la competición principal.

### 📊 Mejor porcentaje
Victorias divididas entre partidos disputados. Mínimo 3 partidos. Desempates: más victorias y después más partidos.

### 👑 Invictos
Sin derrotas y con un mínimo de 3 partidos.

### ⚡ Mejor ataque
Mayor media de puntos anotados por set. Se utiliza el set como unidad para comparar justamente partidos de dos y tres sets. Mínimo 3 partidos.

### 🛡️ Mejor defensa
Menor media de puntos recibidos por set. Gana el valor más bajo. Mínimo 3 partidos.

### 📈 Mejor balance de sets
Sets ganados menos sets perdidos.

### ➕ Mejor balance de puntos
Puntos anotados menos puntos recibidos.

### 💥 Más contundentes
Mayor porcentaje de victorias sin ceder set sobre las victorias totales. Cuenta 3-0, 2-0 o formato equivalente. Mínimo 3 victorias. Desempates: más victorias limpias y mejor diferencia de sets.

### 🧠 Reyes del decisivo
Mejor porcentaje en partidos que llegaron 1-1 tras los dos primeros sets. Mínimo 2 partidos decisivos.

### 🔄 Remontadores
Más victorias después de perder el primer set. Mínimo 2 remontadas.

### 🔥 Mejor racha
Mayor secuencia de victorias consecutivas siguiendo el orden deportivo: fases, jornadas y rondas. Mínimo 2 victorias seguidas.

### 🐉 Mata-gigantes
Más victorias contra al menos 2 rivales distintos del top 3 que terminaron como mínimo 2 posiciones por encima. Mínimo 2 victorias válidas. Usa `posicion_final` de `HIST_EQUIPOS`.

### 🧹 Más victorias limpias
Mayor número absoluto de victorias sin ceder set. A diferencia de “Más contundentes”, aquí importa la cantidad, no el porcentaje.

### 🚀 Mejor arranque
Mayor porcentaje de primeros sets ganados. Mínimo 3 partidos. Desempate: más primeros sets ganados.

### 🔒 Mejor cierre
Mayor porcentaje de victorias entre los partidos en los que se ganó el primer set. Mínimo 3 primeros sets ganados.

### ⚔️ Más luchadores
Mayor porcentaje de partidos en los que ambos equipos ganaron al menos un set. Mínimo 2 partidos de ese tipo.

### 🎯 Más dominante
Mayor porcentaje de puntos ganados sobre todos los puntos disputados:

`puntos a favor / (puntos a favor + puntos en contra)`

Mide el dominio global de los marcadores, no solamente el número de victorias. Mínimo 3 partidos.

### 😅 Partidos de infarto
Mayor número de partidos con un margen medio de 2 puntos o menos por set. Mínimo 2 partidos así.

## Orden deportivo para las rachas

1. Liguilla o Grupos
2. ReGrupos
3. Octavos
4. Cuartos
5. Semifinales
6. Final

Dentro de cada fase se ordena por jornada y orden del partido.

## Archivos implicados

- `mod_Estadisticas_Web_V3`: genera los datos y criterios del JSON.
- `estadisticas.js`: calcula, prioriza y muestra las etiquetas.
- `style.css`: presentación, desplegable y modal de información.
- `estadisticas.html`: no requiere cambios.
- `app.js`: no requiere cambios.
