class Charaster {
  constructor() {
    this.themes = new Array();
    this.theme;
    this.font = "12pt Consolas";
    this.fontHeight = 19;
    this.fontWidth = 9;
    this.gridWidth = 80;
    this.gridHeight = 24;
    this.gridCanvas;
    this.gridContext;
    this.rasterCanvas;
    this.rasterContext;
    this.cursorCanvas;
    this.cursorContext;
  }
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
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

