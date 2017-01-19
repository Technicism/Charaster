"use strict";

class Charaster {
  constructor() {
    this.mode = "PENCIL";
    this.tools = {
      pencil: new Pencil(),
      select: new Select(),
      text: new Text(),
      eraser: new Eraser(),
      flood: new Flood(),
      line: new Line(),
      rectangle: new Rectangle()
    };
    this.tool = this.tools.pencil;
    this.themes = [];
    this.theme;
    this.colors = [];
    this.character = "*";
    this.characterEnabled = true;
    this.fontName = "monospace";
    this.fontSize = 12;
    this.defaultFontSize = this.fontSize;
    this.font = this.fontSize + "pt " + this.fontName;
    this.foreground;
    this.background;
    this.foregroundId = "foreground";
    this.backgroundId = "background";
    this.foregroundEnabled = true;
    this.backgroundEnabled = true;
    this.bold = false;
    this.italic = false;
    this.fontHeight;
    this.fontWidth;
    this.fontOffset;
    this.gridWidth = 80;
    this.gridHeight = 24;
    this.raster = this.createRaster(this.gridWidth, this.gridHeight);
    this.cursor = new Point(0, 0);
    this.prevCursor = new Point(0, 0);
    this.selectBegin = new Point(0, 0);
    this.selectClose = new Point(0, 0);
    this.clipboard = [];

    // Canvases.
    this.gridCanvas;
    this.gridContext;
    this.rasterCanvas;
    this.rasterContext;
    this.rasterTempCanvas;
    this.rasterTempContext;
    this.cursorCanvas;
    this.cursorContext;
    this.selectCanvas;
    this.selectContext;

    // Info.
    this.cursorPos;
    this.gridSizeText;

    // Chrome.
    this.body;
    this.controls;
    this.info;
    this.bars;
    this.foreground;
    this.icons;
    this.iconStrokes;
    this.preview;
    this.noColor;
    this.themeSelect;
    this.themeList;

    // Dynamic CSS workaround for before and after styles.
    this.beforeAfter = document.head.appendChild(document.createElement("style"));
  }

  drawGrid() {
    var canvas = this.gridCanvas;
    var context = this.gridContext;
    this.fitToContainer(canvas, context);
    context.translate(0.5, 0.5);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = this.theme.grid;
    for (var row = 0; row < canvas.height; row += this.fontHeight) {
      context.beginPath();
      context.moveTo(0, row);
      context.lineTo(canvas.width, row);
      context.stroke();
      context.closePath();
    }
    for (var col = 0; col < canvas.width; col += this.fontWidth) {
      context.beginPath();
      context.moveTo(col, 0);
      context.lineTo(col, canvas.height);
      context.stroke();
      context.closePath();
    }
  }

  drawRaster(temp) {
    var canvas = this.rasterCanvas;
    var context = this.rasterContext;
    if (temp != null) {
      canvas = this.rasterTempCanvas;
      context = this.rasterTempContext;
    }
    this.fitToContainer(canvas, context);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (canvas != this.rasterCanvas) {
      return;
    }

    // Background is drawn sweperatlyu from
    for (var col = 0; col < this.raster.length; col++) {
      for (var row = 0; row < this.raster[0].length; row++) {
        var cell = this.raster[col][row];
        if (cell.character != null) {

          // Background.
          if (cell.background != null) {
            context.fillStyle = cell.background;
            context.fillRect(
              cell.point.x * this.fontWidth, cell.point.y * this.fontHeight,
              this.fontWidth, this.fontHeight
            );
          }

          // Character.
          context.fillStyle = cell.foreground;
          context.font = this.font;
          if (cell.bold) {
            context.font = "bold " + context.font;
          }
          if (cell.italic) {
            context.font = "italic " + context.font;
          }
          context.fillText(
            cell.character,
            row * this.fontWidth, (col + 1) * this.fontHeight - this.fontOffset
          );
        }
      }
    }
  }

  drawCursor() {
    var canvas = this.cursorCanvas;
    var context = this.cursorContext;
    this.fitToContainer(canvas, context);
    context.translate(0.5, 0.5);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.strokeStyle = this.theme.cursor;
    var offsetX = -1;
    if (this.cursor.x == 0) {
      offsetX = 0;
    }
    var offsetY = -1;
    if (this.cursor.y == 0) {
      offsetY = 0;
    }
    context.rect(
      this.cursor.x * this.fontWidth + offsetX, this.cursor.y * this.fontHeight + offsetY,
      this.fontWidth, this.fontHeight
    );
    context.stroke();
    context.closePath();
    this.cursorPos.innerHTML = "(" + this.cursor.x + ", " + this.cursor.y + ")";
  }

  drawSelect() {
    var canvas = this.selectCanvas;
    var context = this.selectContext;
    this.fitToContainer(canvas, context);
    context.translate(0.5, 0.5);
    if (this.mode != "SELECT") {
      return;
    }

    // Wrap around selected cell(s).
    var selectBegin = Object.assign({}, this.selectBegin);
    var selectClose = Object.assign({}, this.selectClose);
    if (this.selectClose.x <= this.selectBegin.x) {
      selectBegin.x++;
    } else if (this.selectClose.x > this.selectBegin.x) {
      selectClose.x++;
    }
    if (this.selectClose.y <= this.selectBegin.y) {
      selectBegin.y++;
    } else if (this.selectClose.y > this.selectBegin.y) {
      selectClose.y++;
    }

    // Draw dashed rectangle.
    this.selectContext.strokeStyle = this.theme.cursor;
    this.selectContext.setLineDash([6, 4]);
    this.selectContext.beginPath();
    this.selectContext.rect(
      selectBegin.x * this.fontWidth,
      selectBegin.y * this.fontHeight,
      (selectClose.x - selectBegin.x) * this.fontWidth,
      (selectClose.y - selectBegin.y) * this.fontHeight
    );
    this.selectContext.stroke();
    this.selectContext.closePath();
    this.selectBegin = selectBegin;
    this.selectClose = selectClose;
  }

  drawAll() {
    this.drawGrid();
    this.drawRaster();
    this.drawRaster("temp");
    this.drawCursor();
    this.drawSelect();
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

  moveCursor(x, y) {
    this.cursorContext.clearRect(
      this.cursor.x * this.fontWidth, this.cursor.y * this.fontHeight,
      this.fontWidth, -this.fontHeight
    );
    this.cursor.x = x;
    this.cursor.y = y;
    this.drawCursor();
  }

  createRaster(cols, rows) {
    var array = [];
    for (var row = 0; row < rows; row++) {
      array[row] = [];
      for (var col = 0; col < cols; col++) {
        array[row].push(new Cell(new Point(col, row), null));
      }
    }
    return array;
  }

  resetRaster(cols, rows) {
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        this.setCell(new Cell(new Point(col, row), " "));
      }
    }
  }

  fitToContainer(canvas, context) {
    canvas.width  = this.gridWidth * this.fontWidth + 1;
    canvas.height = this.gridHeight * this.fontHeight + 1;
    canvas.style.top = controls.clientHeight + 1 + "px";
  }

  setCell(cell, context) {
    if (context == null) {
      context = this.rasterContext;
    }

    // Clear previous cell.
    var prevCell = this.getCell(cell.point);
    context.clearRect(
      cell.point.x * this.fontWidth, (cell.point.y + 1) * this.fontHeight,
      this.fontWidth, -this.fontHeight
    );

    // Bold and italic font.
    context.font = this.font;
    if ((cell.bold == null && this.bold) || cell.bold) {
      context.font = "bold " + context.font
      cell.bold = true;
    }
    if ((cell.italic == null && this.italic) || cell.italic) {
      context.font = "italic " + context.font
      cell.italic = true;
    }

    // Background.
    if (cell.background == null) {
      if (this.backgroundEnabled) {
        cell.background = this.background;
        cell.backgroundId = this.backgroundId;
      } else {
        if (prevCell.background != null) {
          cell.background = prevCell.background;
          cell.backgroundId = prevCell.backgroundId;
        } else {
          cell.background = this.theme.background;
          cell.backgroundId = "background";
        }
      }
    }
    if (cell.background != null) {
      context.fillStyle = cell.background;
      context.fillRect(
        cell.point.x * this.fontWidth, cell.point.y * this.fontHeight,
        this.fontWidth, this.fontHeight
      );
    }

    // Foreground.
    if (cell.foreground == null) {
      if (this.foregroundEnabled) {
        cell.foreground = this.foreground;
        cell.foregroundId = this.foregroundId;
      } else {
        if (prevCell.foreground != null) {
          cell.foreground = prevCell.foreground;
          cell.foregroundId = prevCell.foregroundId;
        } else {
          cell.foreground = this.theme.foreground;
          cell.foregroundId = "foreground";
        }
      }
    }

    // Character.
    if (cell.character == null ) {
      if (this.characterEnabled) {
        cell.character = this.character;
      } else {
        cell.character = prevCell.character;
      }
    }
    if (cell.character != null) {
      context.fillStyle = cell.foreground;
      context.fillText(
        cell.character,
        cell.point.x * this.fontWidth, (cell.point.y + 1) * this.fontHeight - this.fontOffset
      );
    }

    // Save to raster.
    if (context == this.rasterContext) {
      this.raster[cell.point.y][cell.point.x] = cell;
    }
  }

  getCell(point) {
    if (point.x < 0 || point.x >= this.gridWidth || point.y < 0 || point.y >= this.gridHeight) {
      return null;
    }
    return this.raster[point.y][point.x];
  }

  clearCell(point) {

    // TODO take into account properties instead.
    this.raster[point.y][point.x] = new Cell(point, null);
    this.rasterContext.clearRect(
      point.x * this.fontWidth, (point.y + 1) * this.fontHeight,
      this.fontWidth, -this.fontHeight
    );
  }

  applyTheme() {

    // Set the colors of the page.
    this.body.style.background = this.theme.background;
    this.cursorCanvas.style.borderColor = this.theme.grid;

    // Theme selection.
    for (var i = 0; i < this.themeList.children.length; i++) {
      if (this.themeList.children[i].innerHTML == this.theme.name) {
        this.themeList.children[i].style.background = this.theme.iconActive;
        this.themeList.children[i].style.color = this.theme.iconActiveText;
      } else {
        this.themeList.children[i].style.color = this.theme.icon;
        this.themeList.children[i].style.background = "none";
      }
    }

    // Set theme colors.
    for (var i = 0; i < this.colors.length; i++) {
      this.colors[i].style.backgroundColor = this.theme.colors[i];
    }

    // Set character colors.
    if (this.foregroundId == "foreground") {
      this.foreground = this.theme.foreground;
    } else {
      this.foreground = this.theme.colors[this.foregroundId - 1];
    }
    if (this.backgroundId == "background") {
      this.background = this.theme.background;
    } else {
      this.background = this.theme.colors[this.backgroundId - 1];
    }
    this.preview.style.color = this.foreground;
    this.preview.style.backgroundColor = this.background;

    // Reset all character colors in the raster.
    for (var col = 0; col < this.raster.length; col++) {
      for (var row = 0; row < this.raster[0].length; row++) {
        var foregroundId = this.raster[col][row].foregroundId;
        if (foregroundId == "foreground") {
          this.raster[col][row].foreground = this.theme.foreground;
        } else {
          this.raster[col][row].foreground = this.theme.colors[foregroundId - 1];
        }
        var backgroundId = this.raster[col][row].backgroundId;
        if (backgroundId == "background") {
          this.raster[col][row].background = this.theme.background;
        } else {
          this.raster[col][row].background = this.theme.colors[backgroundId - 1];
        }
      }
    }

    // Show new theme on raster.
    this.drawAll();
  }

  coordToGrid(point) {
    var grid = new Point(
      Math.floor(point.x / this.fontWidth) - 1,
      Math.floor(point.y / this.fontHeight) - 1
    );
    grid.x = Math.min(grid.x, this.gridWidth - 1);
    grid.x = Math.max(grid.x, 0);
    grid.y = Math.min(grid.y, this.gridHeight - 1);
    grid.y = Math.max(grid.y, 0);
    if (isNaN(grid.x)) {
      grid.x = this.gridWidth - 1;
    }
    if (isNaN(grid.y)) {
      grid.y = this.gridHeight - 1;
    }
    return grid;
  }

  setFontSize(size) {
    this.fontSize = size;
    this.font = this.fontSize + "pt " + this.fontName;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  copy() {
    return new Point(this.x, this.y);
  }
}

class Cell {
  constructor(point, character, foreground, background, bold, italic) {
    this.point = point;
    this.character = character;
    this.foreground = foreground;
    this.background = background;
    this.bold = bold;
    this.italic = italic;
    this.foregroundId = null;
    this.backgroundId = null;
  }

  equalForDraw(other) {
    if (this.point == other.point && this.equalForFill(other)) {
      return true;
    }
    return false;
  }

  equalForFill(other) {
    if (this.character == other.character
     && this.foreground == other.foreground
     && this.background == other.background) {
      return true;
    }
    return false;
  }

  copy() {
    return new Cell(this.point, this.character, this.foreground, this.background, this.bold, this.italic);
  }
}

class Theme {
  constructor(name, foreground, background, grid, cursor, colors) {
    this.name = name;
    this.foreground = foreground;
    this.background = background;
    var rgb = hexToRgb(grid);
    this.grid = "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", 0.75)";
    this.cursor = cursor;
    this.colors = colors;
  }
}

class Tool {
  apply() {

  }

  keyDown(e) {
    if (e.keyCode == 46) {  // Delete.
      charaster.clearCell(charaster.cursor);
    }
  }

  keyPress(e) {
    charaster.character = String.fromCharCode(e.charCode);
    charaster.preview.value = charaster.character;
  }

  mouseMove(e) {
    mouseToCursor(e);
  }

  mouseLeave(e) {

    // Reset drawing to avoid unwanted lines from enter and exit points.
    draw = false;
    drawList = [];
    if (mouseDown) {
      draw = true;
    }
  }

  mouseDown(e) {
    mouseDown = true;
    draw = true;
  }

  mouseUp(e) {
    mouseDown = false;
  }

  click(e) {
    mouseToCursor(e);
  }

  copy(e) {

  }
}

class History {
  constructor() {
    this.rasters = [];
    this.index = 0;
  }

  add(recordRaster) {
    var raster = [];
    for (var i = 0; i < charaster.raster.length; i++) {
      raster[i] = recordRaster[i].slice();
    }
    this.rasters.splice(this.index, 0, raster);
    for (var i = this.rasters.length - 1; i > this.index; i--) {
      this.rasters.splice(this.rasters.indexOf(i));
    }
    this.index++;
  }

  undo() {
    this.index = Math.max(0, this.index - 1);
    return this.rasters[this.index];
  }

  redo() {
    this.index = Math.min(this.rasters.length - 1, this.index + 1);
    return this.rasters[this.index];
  }
}
