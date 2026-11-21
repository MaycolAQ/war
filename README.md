# war
The battle is tough, but we must fight. 
war/
├── index.html              # Pantalla principal (Canvas, controles táctiles y grabador de video)
├── README.md               # Portada del proyecto con vista previa, historia y enlace en vivo
├── LICENSE                 # Licencia MIT (permite que otros colaboren o citen tu código)
│
├── css/
│   └── style.css           # Estilos responsivos (optimizado para vertical 9:16 y horizontal)
│
├── js/
│   ├── main.js             # Bucle principal (Game Loop), control de cámara y grabación MP4/WebM
│   ├── engine.js           # Física de proyectiles, penetración de blindaje, humo y explosiones
│   ├── audio.js            # Efectos de sonido procedurales (motores, orugas, disparos) sin MP3
│   └── entities/
│       ├── tank.js         # Clase base de tanque (movimiento, rotación de torreta, retroceso)
│       └── terrain.js      # Generación procedural de la estepa rusa (Prokhorovka, trincheras, barro)
│
├── data/
│   └── kursk-units.json    # Fichas históricas y estadísticas (T-34/76, KV-1, Tiger I, Panther, Ferdinand)
│
└── assets/
    └── preview.gif         # Animación corta de la batalla para mostrar en el README.md
