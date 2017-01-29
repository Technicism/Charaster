"use strict";

// TODO http://usejsdoc.org/howto-es2015-classes.html documentation

class Charaster {
  constructor() {
    this.tools = {
      pencil: new Pencil("Pencil"),
      select: new Select("Select"),
      text: new Text("Text"),
      eraser: new Eraser("Eraser"),
      picker: new Picker("Picker"),
      flood: new Flood("Flood"),
      line: new Line("Line"),
      rectangle: new Rectangle("Rectangle")
    };
    this.tool = this.tools.pencil;
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
    this.gridEnabled = true;
    this.bold = false;
    this.italic = false;
    this.fontHeight;
    this.fontWidth;
    this.fontOffset;
    this.gridWidth = 80;
    this.gridHeight = 24;
    this.raster = this.createRaster(this.gridWidth, this.gridHeight);
    this.cell = new Cell(null, "*", "foreground", "background", false, false);
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
  }

  drawGrid() {
    var canvas = this.gridCanvas;
    var context = this.gridContext;
    this.fitToContainer(canvas, context);
    context.translate(0.5, 0.5);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = currentTheme.grid;
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
    this.gridSizeText.innerHTML = "[" + this.gridWidth + ", " + this.gridHeight + "]";
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
    for (var col = 0; col < this.raster.length; col++) {
      for (var row = 0; row < this.raster[0].length; row++) {
        var cell = this.raster[col][row];
        if (cell.character != null) {

          // Background.
          if (cell.background != null) {
            context.fillStyle = cell.background;
            context.fillRect(
              row * this.fontWidth, col * this.fontHeight,
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
    context.strokeStyle = currentTheme.cursor;
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
    if (this.tool.name != this.tools.select.name) {
      return;
    }

    // Wrap around selected cell(s).
    var selectBegin = this.selectBegin.copy();
    var selectClose = this.selectClose.copy();
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
    this.selectContext.strokeStyle = currentTheme.cursor;
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
    var cursor = this.cursor.copy();
    cursor.x += x;
    cursor.y += y;
    this.cursor = cursor;
    this.drawCursor();
  }

  moveCursor(x, y) {
    var cursor = this.cursor.copy();
    cursor.x = x;
    cursor.y = y;
    this.cursor = cursor;
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

  resetProperties() {
    this.character = "*";
    this.preview.value = this.character;
    this.foregroundId = "foreground";
    this.backgroundId = "background";
    this.foreground = currentTheme.foreground;
    this.background = currentTheme.background;
    this.preview.style.color = this.foreground;
    this.preview.style.background = this.background;
    this.bold = false
    this.italic = false;
    this.preview.style.fontWeight = "normal";
    this.preview.style.fontStyle = "normal";
  }

  fitToContainer(canvas, context) {
    canvas.width  = this.gridWidth * this.fontWidth + 1;
    canvas.height = this.gridHeight * this.fontHeight + 1;
    canvas.style.top = controls.clientHeight + 1 + "px";
  }

  setCell(cell, context) {
    if (cell == null || !isInsideGrid(cell.point.x, cell.point.y)) {
      return;
    }
    if (context == null) {
      context = this.rasterContext;
    }
    var prevCell = this.getCell(cell.point).copy();

    // Save to raster.
    if (context == this.rasterContext) {
      this.raster[cell.point.y][cell.point.x] = cell;
    }

    // Clear previous cell.
    context.clearRect(
      cell.point.x * this.fontWidth, (cell.point.y + 1) * this.fontHeight,
      this.fontWidth, -this.fontHeight
    );

    // Bold and italic font.
    context.font = this.font;
    if ((cell.bold == false && this.bold) || cell.bold) {
      context.font = "bold " + context.font
      cell.bold = true;
    }
    if ((cell.italic == false && this.italic) || cell.italic) {
      context.font = "italic " + context.font
      cell.italic = true;
    }

    // Background.
    if (cell.backgroundId == null) {
      if (this.backgroundEnabled) {
        cell.background = this.background;
        cell.backgroundId = this.backgroundId;
      } else {
        if (prevCell.backgroundId != null) {
          cell.background = prevCell.background;
          cell.backgroundId = prevCell.backgroundId;
        } else {
          cell.background = currentTheme.background;
          cell.backgroundId = "background";
        }
      }
    } else if (cell.backgroundId == "background") {
      cell.background = currentTheme.background;
    } else {
      cell.background = currentTheme.colors[cell.backgroundId - 1];
    }
    context.fillStyle = cell.background;
    context.fillRect(
      cell.point.x * this.fontWidth, cell.point.y * this.fontHeight,
      this.fontWidth, this.fontHeight
    );

    // Foreground.
    if (cell.foregroundId == null) {
      if (this.foregroundEnabled) {
        cell.foreground = this.foreground;
        cell.foregroundId = this.foregroundId;
      } else {
        if (prevCell.foregroundId != null) {
          cell.foregroundId = prevCell.foregroundId;
        } else {
          cell.foregroundId = "foreground";
        }
      }
    }
    if (cell.foregroundId == "foreground") {
      cell.foreground = currentTheme.foreground;
    } else {
      cell.foreground = currentTheme.colors[cell.foregroundId - 1];
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
  }

  getCell(point) {
    if (point.x < 0 || point.x >= this.gridWidth || point.y < 0 || point.y >= this.gridHeight) {
      return null;
    }
    return this.raster[point.y][point.x];
  }

  clearCell(point) {

    // TODO take into account properties instead.
    var cell = new Cell(point, " ", "foreground", "background", false, false);
    this.setCell(cell);
  }

  applyTheme() {

    // Set the colors of the page.
    this.body.style.background = currentTheme.background;
    this.cursorCanvas.style.borderColor = currentTheme.grid;

    // Theme selection.
    for (var i = 0; i < this.themeList.children.length; i++) {
      if (this.themeList.children[i].innerHTML == currentTheme.name) {
        this.themeList.children[i].style.background = currentTheme.iconActive;
        this.themeList.children[i].style.color = currentTheme.iconActiveText;
      } else {
        this.themeList.children[i].style.color = currentTheme.icon;
        this.themeList.children[i].style.background = "none";
      }
    }

    // Set theme colors.
    for (var i = 0; i < this.colors.length; i++) {
      this.colors[i].style.backgroundColor = currentTheme.colors[i];
    }

    // Set character colors.
    if (this.foregroundId == "foreground") {
      this.foreground = currentTheme.foreground;
    } else {
      this.foreground = currentTheme.colors[this.foregroundId - 1];
    }
    if (this.backgroundId == "background") {
      this.background = currentTheme.background;
    } else {
      this.background = currentTheme.colors[this.backgroundId - 1];
    }
    this.preview.style.color = this.foreground;
    this.preview.style.backgroundColor = this.background;

    // Reset all character colors in the raster.
    for (var col = 0; col < this.raster.length; col++) {
      for (var row = 0; row < this.raster[0].length; row++) {
        var foregroundId = this.raster[col][row].foregroundId;
        if (foregroundId == "foreground") {
          this.raster[col][row].foreground = currentTheme.foreground;
        } else {
          this.raster[col][row].foreground = currentTheme.colors[foregroundId - 1];
        }
        var backgroundId = this.raster[col][row].backgroundId;
        if (backgroundId == "background") {
          this.raster[col][row].background = currentTheme.background;
        } else {
          this.raster[col][row].background = currentTheme.colors[backgroundId - 1];
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

  copyRaster(raster) {
    var rasterCopy = [];
    for (var i = 0; i < raster.length; i++) {
      rasterCopy[i] = [];
      for (var j = 0; j < raster[i].length; j++) {
        rasterCopy[i].push(raster[i][j].copy());
      }
    }
    return rasterCopy;
  }

  applyNewTheme(raster) {
    for (var i = 0; i < raster.length; i++) {
      for (var j = 0; j < raster[i].length; j++) {
        var cell = raster[i][j];
        if (cell.foregroundId == "foreground") {
          cell.foreground = currentTheme.foreground;
        } else {
          cell.foreground = currentTheme.colors[cell.foregroundId - 1];
        }
        if (cell.backgroundId == "background") {
          cell.background = currentTheme.background;
        } else {
          cell.background = currentTheme.colors[cell.backgroundId - 1];
        }
      }
    }
    return raster;
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

  equals(other) {
    if (this.x == other.x && this.y == other.y) {
      return true;
    }
    return false;
  }
}

class Cell {
  constructor(point, character, foregroundId, backgroundId, bold, italic) {
    this.point = point;
    this.character = character;
    this.bold = bold;
    if (this.bold == null) {
      this.bold = false;
    }
    this.italic = italic;
    if (this.italic == null) {
      this.italic = false;
    }
    this.foregroundId = foregroundId;
    this.backgroundId = backgroundId;
    this.foreground = null;
    this.background = null;
  }

  equalForDraw(other) {
    if (this.point.equals(other.point) && this.equalForFill(other)) {
      return true;
    }
    return false;
  }

  equalForFill(other) {
    if ((this.character == other.character || (!charaster.characterEnabled && other.character != " "))
     && this.bold == other.bold
     && this.italic == other.italic
     && (this.backgroundId == other.backgroundId || !charaster.backgroundEnabled)
     && (this.foregroundId == other.foregroundId || !charaster.foregroundEnabled)
    ) {
      return true;
    }
    return false;
  }

  copy() {
    return new Cell(this.point, this.character, this.foregroundId, this.backgroundId, this.bold, this.italic);
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
  constructor(name) {
    this.name = name;
  }

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

  cut(e) {

  }

  finish() {

  }
}

// TODO add history to more tools and copy, paste.
class History {
  constructor(undoElement, redoElement) {
    this.rasters = [];
    this.index = -1;
    this.add(charaster.raster);
    this.undoElement = undoElement;
    this.redoElement = redoElement;
  }

  add(raster) {
    var raster = charaster.copyRaster(raster);
    var length = this.rasters.length;
    this.index++;

    // Remove past history if new history was added after an undo.
    for (var i = this.index; i < length; i++) {
      this.rasters.pop();
    }
    this.rasters.push(raster);
    if (this.index > 0) {
      this.undoElement.classList.remove("inactive");
      this.redoElement.classList.add("inactive");
    }
  }

  undo() {
    this.index = Math.max(this.index - 1, 0);
    if (this.index == 0) {
      this.undoElement.classList.add("inactive");
    }
    if (this.index < this.rasters.length - 1) {
      this.redoElement.classList.remove("inactive");
    }
    var raster = charaster.applyNewTheme(charaster.copyRaster(this.rasters[this.index]));
    return applyCoordinates(raster);
  }

  redo() {
    if (this.index == this.rasters.length - 2) {
      this.redoElement.classList.add("inactive");
    }
    if (this.index > 0) {
      this.undoElement.classList.remove("inactive");
    }
    this.index = Math.min(this.index + 1, this.rasters.length - 1);
    var raster = charaster.applyNewTheme(charaster.copyRaster(this.rasters[this.index]));
    return applyCoordinates(raster);
  }

  clearAll() {
    this.rasters = [];
    this.index = -1;
    this.add(charaster.raster);
  }
}
