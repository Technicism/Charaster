class Charaster {
  constructor() {
    this.themes = new Array();
    this.theme;
    this.font = "12pt Consolas";
    this.fontHeight = 19;
    this.fontWidth = 9;
    this.gridWidth = 80;
    this.gridHeight = 24;

    // Canvases.
    this.gridCanvas;
    this.gridContext;
    this.rasterCanvas;
    this.rasterContext;
    this.cursorCanvas;
    this.cursorContext;

    // Info.

  }

  drawGrid() {
    var canvas = this.gridCanvas;
    var context = this.gridContext;
    fitToContainer(canvas);
    context.strokeStyle = theme.grid;
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

  drawRaster(canvas, context) {
    var canvas = this.rasterCanvas;
    var context = this.rasterContext;
    fitToContainer(canvas);
    context.strokeStyle = theme.foreground;
    context.font = "12pt Consolas";
    context.beginPath();
    for (var col = 0; col < raster.length; col++) {
      for (var row = 0; row < raster[0].length; row++) {
        if (raster[col][row] != null) {
          context.fillText(raster[col][row], row * this.fontWidth, col * this.fontHeight - 5);
        }
      }
    }
    context.closePath();
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.character;
    this.foreground;
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

