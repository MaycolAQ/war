# KURSK 1943 — Operaciones Blindadas

**KURSK 1943** es un juego táctico de tanques para navegador, inspirado en la campaña de Kursk de 1943. Combina una interfaz de mando estratégica, misiones progresivas y combates por turnos sobre un tablero táctico tipo ajedrez.

**Demo:** [maycolaq.github.io/war](https://maycolaq.github.io/war/)

![Battle of Kursk 1943 gameplay preview](assets/preview.gif)

> Proyecto educativo: las estadísticas y el comportamiento de combate están simplificados y no constituyen una reconstrucción histórica completa.

## Características

- **Campaña estratégica:** tres misiones desbloqueables desde el mapa de operaciones.
- **Combate por turnos:** movimiento y ataque por casillas con selección visual.
- **Unidades históricas:** T-34/76, T-34-85 e IS-2 frente a Tiger I, Panther y Jagdtiger.
- **Progreso persistente:** misiones completadas y sectores desbloqueados mediante `localStorage`.
- **Diseño responsive:** interfaz adaptada a escritorio y dispositivos móviles.
- **Motor visual:** batallas renderizadas en Canvas con efectos, partículas y audio procedural.
- **Tecnología nativa:** HTML, CSS y JavaScript, sin framework ni dependencias de ejecución.

## Misiones

| N.º | Operación | Unidad soviética | Unidad enemiga | Objetivo |
|---|---|---|---|---|
| 01 | El puesto avanzado | T-34/76 | Tiger I | Destruir la patrulla blindada |
| 02 | Cruce del Psel | T-34-85 | Panther | Asegurar el cruce del río |
| 03 | Camino a Prokhorovka | IS-2 | Jagdtiger | Abrir la ruta hacia Prokhorovka |

Las misiones se desbloquean progresivamente al conseguir una victoria soviética.

## Controles

- **Tocar una unidad:** seleccionar el tanque activo.
- **Casilla azul:** mover la unidad seleccionada.
- **Casilla roja:** atacar al enemigo disponible.
- **Pasar turno:** entregar la acción al enemigo.
- **Reiniciar:** volver a configurar la batalla actual.
- **Volver al mapa:** regresar al centro de mando de campaña.

## Ejecución local

El proyecto utiliza archivos estáticos. Desde la raíz del repositorio, inicia un servidor HTTP:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` en el navegador.

## Tecnologías

- HTML5
- CSS3
- JavaScript ES6
- Canvas 2D
- Web Audio API
- Local Storage

## Estructura principal

```text
war/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── campaign.js
│   ├── campaign-config.js
│   ├── main.js
│   ├── engine.js
│   └── audio.js
├── entities/
│   ├── board.js
│   └── units.js
├── data/
│   └── kursk-units.json
└── assets/
```

## Autor

Desarrollado por **MaycolAQ**.

## Licencia

Consulta el archivo `LICENSE` para conocer los términos de uso del proyecto.
