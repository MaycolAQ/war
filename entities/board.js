// entities/board.js
class Board {
  constructor(cols = 8, rows = 8) {
    this.cols = cols;
    this.rows = rows;
    this.squares = []; // { col, row, x, y, size, color }
  }

  // Calcula las dimensiones de cada casilla según el tamaño del canvas
  layout(canvasWidth, canvasHeight) {
    // Dejamos un margen para que el tablero no toque los bordes
    const margin = 20;
    const boardSize = Math.min(canvasWidth - margin * 2, canvasHeight - margin * 2);
    const squareSize = boardSize / this.cols;
    const offsetX = (canvasWidth - boardSize) / 2;
    const offsetY = (canvasHeight - boardSize) / 2;

    this.squares = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.squares.push({
          col,
          row,
          x: offsetX + col * squareSize,
          y: offsetY + row * squareSize,
          size: squareSize,
          // Colores alternos tipo ajedrez (verde oliva y un tono más claro)
          color: (col + row) % 2 === 0 ? '#4a5d3a' : '#5c7048'
        });
      }
    }
  }

  draw(ctx, canvasWidth, canvasHeight) {
    this.layout(canvasWidth, canvasHeight);
    for (const sq of this.squares) {
      ctx.fillStyle = sq.color;
      ctx.fillRect(sq.x, sq.y, sq.size, sq.size);
      
      // Línea de cuadrícula fina para un look táctico
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sq.x + 0.5, sq.y + 0.5, sq.size - 1, sq.size - 1);
    }
  }

  // Convierte coordenadas de píxeles a una casilla {col, row}
  getSquareAt(px, py) {
    for (const sq of this.squares) {
      if (px >= sq.x && px < sq.x + sq.size && py >= sq.y && py < sq.y + sq.size) {
        return sq;
      }
    }
    return null;
  }
}