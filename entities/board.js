// entities/board.js
class Board {
  constructor(cols = 8, rows = 8) {
    this.cols = cols;
    this.rows = rows;
    this.squares = [];
  }

  layout(canvasWidth, canvasHeight) {
    const margin = 20;
    const boardSize = Math.min(canvasWidth - margin * 2, canvasHeight - margin * 2);
    const squareSize = boardSize / this.cols;
    const offsetX = (canvasWidth - boardSize) / 2;
    const offsetY = (canvasHeight - boardSize) / 2;
    this.squares = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.squares.push({
          col, row,
          x: offsetX + col * squareSize,
          y: offsetY + row * squareSize,
          size: squareSize,
          color: (col + row) % 2 === 0 ? '#1a1a2e' : '#16213e'
        });
      }
    }
  }

  draw(ctx, canvasWidth, canvasHeight) {
    this.layout(canvasWidth, canvasHeight);
    for (const sq of this.squares) {
      ctx.fillStyle = sq.color;
      ctx.fillRect(sq.x, sq.y, sq.size, sq.size);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.42)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sq.x + 0.5, sq.y + 0.5, sq.size - 1, sq.size - 1);
    }
  }

  getSquareAt(px, py) {
    for (const sq of this.squares) {
      if (px >= sq.x && px < sq.x + sq.size && py >= sq.y && py < sq.y + sq.size) return sq;
    }
    return null;
  }
}
