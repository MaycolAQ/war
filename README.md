# 🛡️ Battle of Kursk 1943 — Armored Combat Simulation

[![Live Demo](https://shields.io)](https://github.io)
![Zero Dependencies](https://shields.io)
![Pure JavaScript](https://shields.io)
![License: MIT](https://shields.io)

A real-time, zero-dependency 2D ballistic and armored warfare simulation set during the **Battle of Kursk (Prokhorovka Sector, July 1943)** — the largest tank battle in history. Built 100% with pure **HTML5 Canvas, CSS3, Web Audio API, and Vanilla JavaScript**.

![Battle of Kursk 1943 Simulation](assets/preview.gif)

---

## ✨ Key Features

* **🎯 Historical Ballistics & Sloped Armor Physics (`js/engine.js`):** Calculates effective armor thickness (\(T_{eff} = T / \cos\theta\)), distance penetration falloff, spalling damage, and dynamic **ricochets** off angled hulls like the Soviet T-34.
* **🔊 100% Procedural Web Audio Synthesizer (`js/audio.js`):** Generates diesel engine rumbles, steel caterpillar track clanks, 76mm vs. 88mm cannon blasts, explosions, and metallic ricochet whines in real time — **zero external MP3/WAV files**.
* **🌾 Procedural Russian Steppe (`entities/terrain.js`):** Dynamically renders undulating terrain, Soviet defensive trenches, Czech anti-tank hedgehogs, mud patches, horizon smoke plumes, and persistent artillery craters.
* **🎥 Built-in Social Media Video Recorder (`js/main.js`):** Capture and export battle clips directly from your mobile or desktop browser (`MP4` / `WebM`) in **9:16 vertical** or **16:9 landscape** format with one tap.
* **📊 Data-Driven Historical Roster (`data/kursk-units.json`):** Decoupled JSON database featuring real WWII specifications for Soviet and German armored vehicles.

---

## 🚜 Historical Armored Units (`data/kursk-units.json`)

| Unit | Faction | Main Armament | Frontal Armor | Slope | Role |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **T-34/76 Model 1943** | 🟥 USSR | 76.2 mm F-34 | 45 mm | 60° | Fast Medium Tank |
| **KV-1S** | 🟥 USSR | 76.2 mm ZiS-5 | 75 mm | 30° | Heavy Breakthrough Tank |
| **Pz.Kpfw. VI Tiger I** | ⬛ GER | 8.8 cm KwK 36 L/56 | 100 mm | 10° | Heavy Tank |
| **Pz.Kpfw. V Panther D** | ⬛ GER | 7.5 cm KwK 42 L/70 | 80 mm | 55° | Medium Tank |
| **Ferdinand (Elefant)** | ⬛ GER | 8.8 cm PaK 43/2 L/71 | 200 mm | 15° | Heavy Tank Destroyer |

---

## 📂 Repository Architecture

```text
war/
├── index.html              # Main viewport, tactical HUD, and mobile controls
├── README.md               # Project documentation & live preview
├── LICENSE                 # MIT Open Source License
├── css/
│   └── style.css           # Responsive layout (9:16 Portrait & 16:9 Landscape)
├── js/
│   ├── main.js             # Game loop, dynamic camera (zoom/shake), and video recorder
│   ├── engine.js           # Projectile ballistics, armor penetration, and particle physics
│   └── audio.js            # Procedural Web Audio API sound effects
├── entities/
│   ├── tank.js             # Tank base class (Christie/interleaved wheels, dual recoil, aiming)
│   └── terrain.js          # Procedural Prokhorovka steppe generator
├── data/
│   └── kursk-units.json    # Historical specs and engine combat parameters
└── assets/
    └── preview.gif         # Recorded gameplay preview
```

---

## 🤝 Contributing

Contributions are welcome! You can easily expand the simulation without touching core engine code:
1. **Add new WWII vehicles** (e.g., *SU-152*, *Panzer IV Ausf. H*, *Churchill Mk IV*) by adding an entry to `data/kursk-units.json`.
2. **Add weather & time-of-day presets** (night tracers, rain, dust storms) in `entities/terrain.js`.
3. Fork the repository, commit your changes, and open a **Pull Request**.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
