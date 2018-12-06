"use strict";

/** Main class that represents all of the rasters. */
class Charaster {

  /**
   * Constructor that defines all of the tools to be used, font and HTML elements needed.
   */
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
    this.underline = false;
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

  /**
   * Draw a grid by creating long vertical and horizontal lines.
   */
  drawGrid() {
    var canvas = this.gridCanvas;
    var context = this.gridContext;
    this.fitCanvas(canvas, context);
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

  /**
   * Draw the whole cell raster.
   * @param   {String}   temp - If provided draw to the temporary raster instead.
   */
  drawRaster(temp) {
    var canvas = this.rasterCanvas;
    var context = this.rasterContext;
    if (temp != null) {
      canvas = this.rasterTempCanvas;
      context = this.rasterTempContext;
    }
    this.fitCanvas(canvas, context);
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

          // Underline.
          if (cell.underline) {
            this.drawCellLine(this.rasterContext, cell, this.fontOffset);
          }
        }
      }
    }
  }

  /**
   * Draw a rectangle that represents the cursor.
   */
  drawCursor() {
    var canvas = this.cursorCanvas;
    var context = this.cursorContext;
    this.fitCanvas(canvas, context);
    context.translate(0.5, 0.5);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.strokeStyle = currentTheme.cursor;

    // Problem where the cursor on the top and left most rows don't get shown fully.
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

  /**
   * Draw a dashed rectangle that represents the selected cells.
   */
  drawSelect() {
    var canvas = this.selectCanvas;
    var context = this.selectContext;
    this.fitCanvas(canvas, context);
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

  /**
   * Helper method that draws everything.
   */
  drawAll() {
    this.drawGrid();
    this.drawRaster();
    this.drawRaster("temp");
    this.drawCursor();
    this.drawSelect();
  }

  /**
   * Draws a horizontal line on a cell.
   *
   * @param   {CanvasRenderingContext2D}  context
   * @param   {Cell}                      cell
   * @param   {Number}                    offset - Vertical.
   */
  drawCellLine(context, cell, offset) {
    context.strokeStyle = cell.foreground;
    context.lineWidth = 0.5 * this.fontSize / this.defaultFontSize;
    context.beginPath();
    context.moveTo(
      cell.point.x * this.fontWidth,
      cell.point.y * this.fontHeight + this.fontHeight - offset + 0.5
    );
    context.lineTo(
      cell.point.x * this.fontWidth + this.fontWidth,
      cell.point.y * this.fontHeight + this.fontHeight - offset + 0.5
    );
    context.stroke();
    context.closePath();
  }

  /**
   * Moves cursor by adding the point to the current location.
   *
   * @param   {Number}   x
   * @param   {Number}   y
   */
  moveCursorRelative(x, y) {
    var cursor = this.cursor.copy();
    cursor.x += x;
    cursor.y += y;
    this.cursor = cursor;
    this.drawCursor();
  }

  /**
   * Moves cursor by jumping to the point.
   *
   * @param   {Number}   x
   * @param   {Number}   y
   */
  moveCursor(x, y) {
    var cursor = this.cursor.copy();
    cursor.x = x;
    cursor.y = y;
    this.cursor = cursor;
    this.drawCursor();
  }

  /**
   * Create a 2D array of Cells.
   *
   * @param   {Number}    cols - Amount of columns.
   * @param   {Number}    rows - Amount of rows.
   * @return  {Cell[][]}  raster
   */
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

  /**
   * Clear all of the cells in the raster.
   */
  resetRaster() {
    for (var row = 0; row < this.gridHeight; row++) {
      for (var col = 0; col < this.gridWidth; col++) {
        this.setCell(new Cell(new Point(col, row), " "));
      }
    }
  }

  /**
   * Reset all the cell properties.
   */
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

  /**
   * Adjusts the size of a canvas to fit the raster size.
   *
   * @param   {HTMLCanvasElement}         canvas
   * @param   {CanvasRenderingContext2D}  context
   */
  fitCanvas(canvas, context) {
    canvas.width  = this.gridWidth * this.fontWidth + 1;
    canvas.height = this.gridHeight * this.fontHeight + 1;
    canvas.style.top = controls.clientHeight + 1 + "px";
  }

  /**
   * Applies a new cell to the raster, the cell properties are automatically filled if they are not made explicit beforehand.
   *
   * @param   {Cell}                      cell
   * @param   {CanvasRenderingContext2D}  context
   */
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
    if ((cell.bold == null && this.bold) || cell.bold) {
      context.font = "bold " + context.font
      cell.bold = true;
    } else {
      cell.bold = false;
    }
    if ((cell.italic == null && this.italic) || cell.italic) {
      context.font = "italic " + context.font
      cell.italic = true;
    } else {
      cell.italic = false;
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

    // Underline.
    if ((cell.underline == null && this.underline) || cell.underline) {
      cell.underline = true;
      this.drawCellLine(context, cell, this.fontOffset);
    } else {
      cell.underline = false;
    }
  }

  /**
   * Get a cell in the raster.
   *
   * @param   {Point} point
   * @return  {Cell}
   */
  getCell(point) {
    if (point.x < 0 || point.x >= this.gridWidth || point.y < 0 || point.y >= this.gridHeight) {
      return null;
    }
    return this.raster[point.y][point.x];
  }

  /**
   * Clears a single cell in the raster.
   *
   * @param   {Point} point
   */
  clearCell(point) {

    // TODO take into account properties instead.
    var cell = new Cell(point, " ", "foreground", "background", false, false, false);
    this.setCell(cell);
  }

  /**
   * Applies the current theme to the HTML/CSS properties and the raster cells.
   */
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

  /**
   * Given a screen coordinate, return the grid location.
   *
   * @param   {Point} point
   * @return  {Point}
   */
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

  /**
   * Setter for font size.
   *
   * @param   {Number}  size
   */
  setFontSize(size) {
    this.fontSize = size;
    this.font = this.fontSize + "pt " + this.fontName;
  }

  /**
   * Duplicates a whole raster.
   *
   * @param   {Cell[][]}  raster
   * @return  {Cell[][]}
   */
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

  /**
   * When a theme has changed throughout history saves, it need to be reapplied with this.
   *
   * @param   {Cell[][]}  raster
   * @return  {Cell[][]}
   */
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

/** 2D point. */
class Point {

  /**
   * Create a point.
   * @param {Number} x
   * @param {Number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Duplicates the point.
   *
   * @return  {Point}
   */
  copy() {
    return new Point(this.x, this.y);
  }

  /**
   * Check if point is equal to another.
   *
   * @param   {Point}   other
   * @return  {Boolean}
   */
  equals(other) {
    if (this.x == other.x && this.y == other.y) {
      return true;
    }
    return false;
  }
}

/** Cell objects are used to represent characters and more properties supported by shells. */
class Cell {

  /**
   * Create a new Cell.
   *
   * @param   {Point}   point
   * @param   {String}  character
   * @param   {Number}  foregroundId
   * @param   {Number}  backgroundId
   * @param   {Boolean} bold
   * @param   {Boolean} italic
   * @param   {Boolean} underline
   */
  constructor(point, character, foregroundId, backgroundId, bold, italic, underline) {
    this.point = point;
    this.character = character;
    this.bold = bold;
    this.italic = italic;
    this.underline = underline;
    this.foregroundId = foregroundId;
    this.backgroundId = backgroundId;
    this.foreground = null;
    this.background = null;
  }

  /**
   * Check if equal enough when drawing cells.
   *
   * @param   {Cell}   other
   * @return  {Boolean}
   */
  equalForDraw(other) {
    if (this.point.equals(other.point) && this.equalForFill(other)) {
      return true;
    }
    return false;
  }

  /**
   * Check if equal enough when flooding cells.
   *
   * @param   {Cell}   other
   * @return  {Boolean}
   */
  equalForFill(other) {
    if ((this.character == other.character || (!charaster.characterEnabled && other.character != " "))
     && this.bold == other.bold
     && this.italic == other.italic
     && this.underline == other.underline
     && (this.backgroundId == other.backgroundId || !charaster.backgroundEnabled)
     && (this.foregroundId == other.foregroundId || !charaster.foregroundEnabled)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Duplicate the cell.
   *
   * @return  {Cell}
   */
  copy() {
    return new Cell(this.point, this.character, this.foregroundId, this.backgroundId, this.bold, this.italic, this.underline);
  }
}

/** 16 colour shell themes, with other colour options for the user chrome */
class Theme {

  /**
   * Create a new Theme, colours are in the #rrggbb format
   *
   * @param   {String}    name
   * @param   {String}    foreground
   * @param   {String}    background
   * @param   {String}    grid
   * @param   {String}    cursor
   * @param   {String[]}  colors
   */
  constructor(name, foreground, background, grid, cursor, colors) {
    this.name = name;
    this.foreground = foreground;
    this.background = background;

    // Make grid a bit transparent.
    var rgb = hexToRgb(grid);
    this.grid = "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", 0.75)";
    this.cursor = cursor;
    this.colors = colors;
  }
}

/** User tools that work be sending mouse and/or keyboard events, to be extended */
class Tool {

  /**
   * Create a new Tool.
   * @param   {String}    name
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Start using this Tool.
   */
  apply() {

  }

  /**
   * Key down event.
   * @param   {KeyboardEvent}  e
   */
  keyDown(e) {
    if (e.keyCode == 46) {  // Delete.
      charaster.clearCell(charaster.cursor);
    }
  }

  /**
   * Key press event.
   * @param   {KeyboardEvent}  e
   */
  keyPress(e) {
    charaster.character = String.fromCharCode(e.charCode);
    charaster.preview.value = charaster.character;
  }

  /**
   * Mouse move event, cursor follows mouse.
   * @param   {MouseEvent}  e
   */
  mouseMove(e) {
    mouseToCursor(e);
  }

  /**
   * Mouse leave event, stops drawing when leaving the raster area.
   * @param   {MouseEvent}  e
   */
  mouseLeave(e) {

    // Reset drawing to avoid unwanted lines from enter and exit points.
    draw = false;
    drawList = [];
    if (mouseDown) {
      draw = true;
    }
  }

  /**
   * Mouse down event, start drawing.
   * @param   {MouseEvent}  e
   */
  mouseDown(e) {
    mouseDown = true;
    draw = true;
  }

  /**
   * Mouse up event, stop drawing.
   * @param   {MouseEvent}  e
   */
  mouseUp(e) {
    mouseDown = false;
  }

  /**
   * Click event, move cursor to location clicked.
   * @param   {MouseEvent}  e
   */
  click(e) {
    mouseToCursor(e);
  }

  /**
   * Copy event.
   * @param   {ClipboardEvent}  e
   */
  copy(e) {

  }

  /**
   * Cut event.
   * @param   {ClipboardEvent}  e
   */
  cut(e) {

  }

  /**
   * Finished using the tool.
   */
  finish() {

  }
}

/** Support undo and redo by saving rasters that can be loaded as the current raster */
class History {

  /**
   * Create a new History manager, indicate the state using SVG icons that change colours.
   * @param   {SVGPathElement}  undoElement
   * @param   {SVGPathElement}  redoElement
   */
  constructor(undoElement, redoElement) {
    this.rasters = [];
    this.index = -1;
    this.add(charaster.raster);
    this.undoElement = undoElement;
    this.redoElement = redoElement;
  }

  /**
   * Add a new raster.
   * @param   {Cell[][]}  raster
   */
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

  /**
   * Undo the raster.
   * @return  {Cell[][]}
   */
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

  /**
   * Redo the raster.
   * @return  {Cell[][]}
   */
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

  /**
   * Clear all rasters stored.
   */
  clearAll() {
    this.rasters = [];
    this.index = -1;
    this.add(charaster.raster);
  }
}
