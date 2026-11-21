# Battle of Kursk 1943 — Armored Combat Simulation

A browser-based 2D armored combat simulation inspired by the Battle of Kursk. It uses HTML Canvas, CSS, Web Audio, and vanilla JavaScript, with no runtime framework dependencies.

**Play the demo:** [maycolaq.github.io/war](https://maycolaq.github.io/war/)

![Battle of Kursk 1943 gameplay preview](assets/preview.gif)

> This is an educational game simulation. Its simplified physics and unit data are not a complete historical reconstruction.

## Features

- **Canvas battlefield:** procedurally rendered steppe terrain, trenches, anti-tank obstacles, smoke, and persistent shell craters.
- **Armored combat:** projectile trajectories, distance-based penetration, sloped-armor calculations, damage, and ricochets.
- **Historical vehicle roster:** unit specifications and simulation parameters are kept in `data/kursk-units.json`.
- **Procedural sound:** engine, cannon, explosion, and ricochet sounds are generated with the Web Audio API.
- **Mobile-friendly layout:** responsive controls for portrait and landscape screens.
- **Battle recording:** where the browser supports it, capture the Canvas and save a battle clip in a supported video format.

## Controls

- **FIRE T-34:** fire the Soviet T-34/76 cannon.
- **FIRE TIGER:** fire the German Tiger I cannon.
- **REC VIDEO:** start or stop recording the battlefield. Browser support determines the exported format.
- **RESET SECTOR:** restart the battle.
- **Tap the battlefield:** toggle the camera zoom.

The simulation currently fires both tanks automatically during an active battle. The two fire buttons let you trigger additional shots.

## Run locally

The project uses plain static files. From the repository root, start a local web server so the browser can load the JSON roster:

```bash
python3 -m http.server 8000
war/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── audio.js
│   ├── engine.js
│   └── main.js
├── entities/
│   ├── tank.js
│   └── terrain.js
├── data/
│   └── kursk-units.json
└── assets/
    └── preview.gif
