class Charaster {
  constructor() {
    this.themes = new Array();
    this.theme;
    this.font = "12pt Consolas";
    this.fontHeight = 19;
    this.fontWidth = 9;
    this.gridWidth = 80;
    this.gridHeight = 24;
    this.raster = this.createRaster(this.gridWidth, this.gridHeight);
    this.cursor = new Point(0, 0);

    // Canvases.
    this.gridCanvas;
    this.gridContext;
    this.rasterCanvas;
    this.rasterContext;
    this.cursorCanvas;
    this.cursorContext;

    // Info.
    this.cursorPos;
    this.gridSize;

    // Chrome.
    this.body;
    this.controls;
    this.info;
    this.bars;
    this.foreground;
    this.icons;
    this.iconStrokes;
  }

  drawGrid() {
    var canvas = this.gridCanvas;
    var context = this.gridContext;
    fitToContainer(canvas);
    context.strokeStyle = this.theme.grid;
    context.beginPath();
    for (var row = 0; row < canvas.height; row += this.fontHeight) {
      context.moveTo(0, row);
      context.lineTo(canvas.width, row);
      context.stroke();
    }
    for (var col = 0; col < canvas.width; col += this.fontWidth) {
      context.moveTo(col, 0);
      context.lineTo(col, canvas.height);
      context.stroke();
    }
    context.closePath();
  }

  drawRaster() {
    var canvas = this.rasterCanvas;
    var context = this.rasterContext;
    fitToContainer(canvas);
    context.strokeStyle = this.theme.foreground;
    context.font = "12pt Consolas";
    for (var col = 0; col < raster.length; col++) {
      for (var row = 0; row < raster[0].length; row++) {
        if (raster[col][row] != null) {
          context.fillText(raster[col][row], row * this.fontWidth, col * this.fontHeight - 5);
        }
      }
    }
  }

  drawCursor() {
    var canvas = this.cursorCanvas;
    var context = this.cursorContext;
    fitToContainer(canvas);
    context.beginPath();
    context.strokeStyle = this.theme.cursor;
    context.rect(this.cursor.x * fontWidth, this.cursor.y * fontHeight, fontWidth, fontHeight);
    context.stroke();
    context.closePath();
    this.cursorPos.innerHTML = "(" + this.cursor.x + ", " + this.cursor.y + ")";
  }

  moveCursorRelative(x, y) {
    this.cursorContext.clearRect(
      this.cursor.x * this.fontWidth, this.cursor.y * this.fontHeight,
      this.fontWidth, -this.fontHeight
    );
    this.cursor.x += x;
    this.cursor.y += y;
    this.drawCursor();
  }

  createRaster(cols, rows) {
    var array = [];
    for (var i = 0; i < rows; i++) {
      array[i] = [];
      for (var col = 0; col < cols; col++) {
        array[i].push(null);
      }
    }
    return array;
  }


  placeCell(cell) {
    this.rasterContext.fillStyle = this.theme.foreground;
    this.rasterContext.clearRect(
      this.cursor.x * this.fontWidth, (this.cursor.y + 1) * this.fontHeight,
      this.fontWidth, -this.fontHeight
    );
    this.rasterContext.fillText(
      cell.character,
      cell.point.x * this.fontWidth, (cell.point.y + 1) * this.fontHeight - 5
    );
  }

  applyTheme(name) {

    // Set the colors of the page.
    this.body.style.background = this.theme.background;
    this.controls.style.background = this.theme.bar;
    this.controls.style.borderColor = this.theme.barBorder;
    this.info.style.background = this.theme.bar;
    this.info.style.borderColor = this.theme.barBorder;
    for (var i = 0; i < this.icons.length; i++) {
      this.icons[i].style.fill = this.theme.icon;
    }
    for (var i = 0; i < this.iconStrokes.length; i++) {
      this.iconStrokes[i].style.stroke = this.theme.icon;
    }
    for (var i = 0; i < this.bars.length; i++) {
      this.bars[i].style.borderColor = this.theme.barBorder;
    }

    // Set the colors of the tools.
    for (var i = 0; i < this.theme.colors.length; i++) {
      var color = document.createElement('option');
      color.value = i;
      color.innerHTML = i;
      color.style.backgroundColor = this.theme.colors[i];
      foreground.appendChild(color);
    }
  }

}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Cell {
  constructor(point, character, foreground) {
    this.point = point;
    this.character = character;
    this.foreground = foreground;
    this.background;
  }
}

class Theme {
  constructor(name, foreground, background, grid, cursor, bar, barBorder, icon, colors) {
    this.name = name;
    this.foreground = foreground;
    this.background = background;
    this.grid = grid;
    this.cursor = cursor;
    this.bar = bar;
    this.barBorder = barBorder;
    this.icon = icon;
    this.colors = colors;
  }
}

