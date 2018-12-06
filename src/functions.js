"use strict";

/**
 * Lists all the points to be rastered at to form a line.
 *
 * @see     {@link http://tech-algorithm.com/articles/drawing-line-using-bresenham-algorithm/}
 * @param   {Point}   p - Origin.
 * @param   {Point}   q - Destination.
 * @return  {Point[]} Line.
 */
function rasterLine(p, q) {
  var pX = p.x;
  var pY = p.y;
  var qX = q.x;
  var qY = q.y;
  var width = qX - pX;
  var height = qY - pY;
  var slopePX = 0;
  var slopePY = 0;
  var slopeQX = 0;
  var slopeQY = 0;

  // Octant.
  if (width < 0) {
    slopePX = -1;
  } else if (width > 0) {
    slopePX = 1;
  }
  if (height < 0) {
    slopePY = -1;
  } else if (height > 0) {
    slopePY = 1;
  }
  if (width < 0) {
    slopeQX = -1;
  } else if (width > 0) {
    slopeQX = 1;
  }
  var intWidth = Math.abs(width);
  var intHeight = Math.abs(height);
  var longest = intWidth;
  var shortest = intHeight;
  if (longest <= shortest) {
    longest = intHeight
    shortest = intWidth
    if (height < 0) {
      slopeQY = -1;
    } else if (height > 0) {
      slopeQY = 1;
    }
    slopeQX = 0;
  }

  // Drawing.
  var list = [];
  var numerator = longest >> 1;
  for (var i = 0; i <= longest; i++) {
    list.push(new Point(pX, pY));
    numerator += shortest;
    if (numerator >= longest) {
      numerator -= longest;
      pX += slopePX;
      pY += slopePY;
    } else {
      pX += slopeQX;
      pY += slopeQY;
    }
  }
  return list;
}

/**
 * Lists all the points to be rastered at to form a rectangle.
 *
 * @param   {Point}   p - Origin.
 * @param   {Point}   q - Destination.
 * @return  {Point[]} Rectangle.
 */
function rasterRectangle(p, q) {
  var points = [];
  points = points.concat(rasterLine(p, new Point(q.x, p.y)));  // Top.
  points = points.concat(rasterLine(new Point(q.x, p.y), q));  // Right.
  points = points.concat(rasterLine(new Point(p.x, q.y), q));  // Bottom.
  points = points.concat(rasterLine(p, new Point(p.x, q.y)));  // Left.
  return points;
}

/**
 * Flood fill algorithm that sets target cell properties to be that of the replacement.
 *
 * @see     {@link https://en.wikipedia.org/wiki/Flood_fill}
 * @param   {Cell}  cell
 * @param   {Cell}  target
 * @param   {Cell}  replacement
 */
function rasterFlood(cell, target, replacement) {
  var queue = [];
  queue.push(cell);
  while (queue.length != 0) {
    var floodCell = queue.pop();
    if (floodCell == null || target.equalForFill(replacement) || !target.equalForFill(floodCell)) {
      continue;
    } else {
      floodCell = floodProperties(floodCell, replacement);
      charaster.setCell(floodCell);
      queue.push(charaster.getCell(new Point(floodCell.point.x, floodCell.point.y - 1))); // Top.
      queue.push(charaster.getCell(new Point(floodCell.point.x + 1, floodCell.point.y))); // Right.
      queue.push(charaster.getCell(new Point(floodCell.point.x, floodCell.point.y + 1))); // Bottom.
      queue.push(charaster.getCell(new Point(floodCell.point.x - 1, floodCell.point.y))); // Left.
    }
  }
}

/**
 * Apply cell properties to a cell being flooded.
 *
 * @param   {Cell}   cell
 * @param   {Cell}   replacement
 * @return  {Cell}
 */
function floodProperties(cell, replacement) {
  var flooded = cell.copy();
  if (charaster.characterEnabled) {
    flooded.character = replacement.character;
  }
  if (charaster.foregroundEnabled) {
    flooded.foregroundId = replacement.foregroundId;
  }
  if (charaster.backgroundEnabled) {
    flooded.backgroundId = replacement.backgroundId;
  }
  if (charaster.bold) {
    flooded.bold = replacement.bold;
  }
  if (charaster.italic) {
    flooded.italic = replacement.italic;
  }
  if (charaster.underline) {
    flooded.underline = replacement.underline;
  }
  return flooded;
}

/**
 * Get the pixel position of the mouse on the canvas.
 *
 * @param   {HTMLCanvasElement} canvas
 * @param   {MouseEvent}        e
 * @return  {Point}
 */
function getMousePos(canvas, e) {
  var rect = canvas.getBoundingClientRect();
  return new Point(e.clientX - rect.left, e.clientY - rect.top);
}

/**
 * Snap a value to a grid interval value.
 *
 * @param   {Number}  pos
 * @param   {Number}  grid
 * @return  {Number}  Snapped pos.
 */
function snap(pos, grid) {
  for (var i = 0; i < Math.max(charaster.rasterCanvas.width, charaster.rasterCanvas.height); i += grid) {
    if (pos <= i) {
      return i;
    }
  }
}

/**
 * Snap a given point to the grid.
 *
 * @param   {Point} point
 * @return  {Point} Snapped point.
 */
function snapPos(point) {
  var x = snap(point.x, charaster.fontWidth);
  var y = snap(point.y, charaster.fontHeight);
  return new Point(x, y);
}

/**
 * Measures and applies the font width, height and offset.
 *
 * @param   {String} font Family name.
 */
function measureCharacter(font) {
  var largestCharacter = "█";

  // Find the width and height from the automatically sized bounding box.
  var span = document.createElement("span");
  span.innerHTML = largestCharacter;
  span.style.font = font;
  document.body.appendChild(span);
  var box = span.getBoundingClientRect();
  charaster.fontWidth = Math.ceil(box.width);
  charaster.fontHeight = Math.ceil(box.height);
  document.body.removeChild(span);

  // Find the offset by looking for a pixel that is not transparent.
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  var fontOffset = 0;
  context.fillStyle = "black";
  context.font = font;
  while (context.getImageData(0, 0, 1, 1).data[3] == 0) {
    context.fillText(largestCharacter, 0, charaster.fontHeight - fontOffset);
    fontOffset++;
  }
  charaster.fontOffset = fontOffset;
}

/**
 * Achieves the effect of zooming in the raster by increasing or decreasing the font size.
 *
 * @param {Number} size - In points.
 */
function zoom(size) {
  if (size < 4 || size > 512) {
    return; // Out of scale.
  }
  charaster.setFontSize(size);
  charaster.rasterContext.font = charaster.font;
  measureCharacter(charaster.font);
  charaster.drawGrid();
  charaster.drawCursor();
  charaster.drawRaster();
  charaster.drawRaster("temp");
  var display = Math.round((size / charaster.defaultFontSize) * 100) + "%";
  var info = document.getElementById("zoomPercent");
  info.innerHTML = display;
  info.title = charaster.fontSize + "pt font size";
}

/**
 * Find the correct order for starting and stopping drawing a line.
 *
 * @param   {Point} p
 * @param   {Point} q
 * @return  {Point} Ordered coordinates from p and q.
 */
function getStartStop(p, q) {
  var startX = Math.min(p.x, q.x);
  var startY = Math.min(p.y, q.y);
  var stopX = Math.max(p.x, q.x);
  var stopY = Math.max(p.y, q.y);
  var ordered = [];
  ordered.push(new Point(startX, startY));
  ordered.push(new Point(stopX, stopY));
  return ordered;
}

/**
 * Move and draw the cursor under the mouse.
 *
 * @param   {MouseEvent} e
 */
function mouseToCursor(e) {
  var pos = getMousePos(charaster.rasterCanvas, e);
  var cursor = charaster.coordToGrid(snapPos(pos));

  // Draw cursor if it has moved.
  if (!charaster.cursor.equals(cursor)) {
    charaster.cursor = cursor;
    charaster.drawCursor();
  }
}

/**
 * Apply visual styles to button depending if they are active or not.
 *
 * @param   {String}  id
 * @param   {Boolean} active
 */
function buttonStyle(id, active) {
  var button = document.getElementById(id);
  if (active) {
    button.classList.add("active");
  } else {
    button.classList.remove("active");
  }
  var icons = button.getElementsByClassName("icon");
  for (var i = 0; i < icons.length; i++) {
    if (active) {
      icons[i].classList.add("activeFill");
    } else {
      icons[i].classList.remove("activeFill");
    }
  }
  var iconStrokes = button.getElementsByClassName("iconStroke");
  for (var i = 0; i < iconStrokes.length; i++) {
    if (active) {
      iconStrokes[i].classList.add("activeStroke");
    } else {
      iconStrokes[i].classList.remove("activeStroke");
    }
  }

  // Apply title, if button is a SVG then give title to span parent.
  if (active) {
    var title = button.getAttribute("name") + " is on";
    if (button.title == null) {
      button.parentNode.title = title;
    } else {
      button.title = title;
    }
  } else {
    var title = button.getAttribute("name") + " is off";
    if (button.title == null) {
      button.parentNode.title = title;
    } else {
      button.title = title;
    }
  }
}

/**
 * Write raster contents to a string of plain text.
 *
 * @param   {Cell[][]}  raster
 * @return  {String}
 */
function savePlain(raster) {
  var lines = "";
  for (var col = 0; col < charaster.gridHeight; col++) {
    var line = "";
    for (var row = 0; row < charaster.gridWidth; row++) {
      var cell = raster[col][row];
      if (cell.character == null) {
        line += " ";
      } else {
        line += raster[col][row].character;
      }
    }
    lines += line + "\r\n"; // TODO Address different OS line endings
  }
  return lines;
}

/**
 * Open a file as plain text to the raster.
 *
 * @param   {String}  path - To file.
 */
function openPlain(path) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = reader.result;

    // Resize to fit.
    var textArray = text.split("\n");
    charaster.gridHeight = textArray.length;
    charaster.gridWidth = 1;
    for (var row = 0; row < textArray.length; row++) {
      if (textArray[row].length > charaster.gridWidth) {
        charaster.gridWidth = textArray[row].length;
      }
    }
    charaster.gridHeight++;
    charaster.raster = charaster.createRaster(charaster.gridWidth, charaster.gridHeight);
    charaster.drawAll();
    charaster.resetProperties();
    pasteText(text, new Point(0, 0));
    rasterHistory.clearAll();
  }
  reader.readAsText(path);
}

/**
 * Open a file as JSON to the raster.
 *
 * @param   {String}  path - To file.
 */
function openJson(path) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = reader.result;
    charaster.raster = JSON.parse(text);
    charaster.gridWidth = charaster.raster[0].length;
    charaster.gridHeight = charaster.raster.length;
    for (var col = 0; col < charaster.gridHeight; col++) {
      for (var row = 0; row < charaster.gridWidth; row++) {
        charaster.raster[col][row].__proto__ = Cell.prototype;
      }
    }
    charaster.drawAll();
    rasterHistory.clearAll();
  }
  reader.readAsText(path);
}

/**
 * Write raster contents to a string of bash code, which is able to support many cell proprieties.
 *
 * @see     {@link http://misc.flogisoft.com/bash/tip_colors_and_formatting} and {@link http://askubuntu.com/a/528938} for the escape sequences.
 * @param   {Cell[][]} raster
 * @return  {String}
 */
function saveShell(raster) {
  var string = "";
  for (var col = 0; col < charaster.gridHeight; col++) {
    for (var row = 0; row < charaster.gridWidth; row++) {
      var cell = raster[col][row];
      if (cell.character == null || cell.character == " ") {
        string += " ";
      } else {

        // Colours.
        var background = 49;
        if (cell.backgroundId != "background") {
          if (cell.backgroundId <= 8) {
            background = parseInt(cell.backgroundId + 39);
          } else {
            background = parseInt(cell.backgroundId + 91);
          }
        }
        var foreground = 39;
        if (cell.foregroundId != "foreground") {
          if (cell.foregroundId <= 8) {
            foreground = parseInt(cell.foregroundId + 29);
          } else {
            foreground = parseInt(cell.foregroundId + 81);
          }
        }
        string += "\\e[" + background + "m\\e[" + foreground + "m";

        // Text styling.
        if (cell.bold) {
          string += "\\e[1m";
        }
        if (cell.italic) {
          string += "\\e[3m";
        }
        if (cell.underline) {
          string += "\\e[4m";
        }

        // Character.
        if (cell.character == null) {
          string += " ";
        } else if (cell.character == "\\") {
          string += "\\\\";
        } else {
          string += cell.character;
        }

        // Reset to normal after every cell.
        string += "\\e[0m";
      }
    }
    string += "\\n";
  }
  return string;
}

/**
 * Paste text to the raster.
 *
 * @param   {String}  text
 * @param   {Point}   startPoint - Top left location.
 */
function pasteText(text, startPoint) {
  if (text.length == 0) {
    return;
  }
  if (startPoint == null) {
    startPoint = charaster.cursor;
  }
  var x = 0;
  var y = 0;
  for (var i = 0; i < text.length; i++) {
    if (text[i] == "\n") {
      y++;
      x = 0;
    } else if (text[i] != "\r") {
      var point = new Point(startPoint.x + x, startPoint.y + y);
      if (point.x >= charaster.gridWidth || point.y >= charaster.gridHeight) {
        continue; // Out of range of raster.
      }
      var character = text[i];
      var cell = new Cell(point, character, charaster.foregroundId, charaster.backgroundId);
      charaster.setCell(cell);
      x++;
    }
  }
  rasterHistory.add(charaster.raster);
}

/**
 * Paste cells to the raster.
 *
 * @param   {Cell[]}  cells
 */
function pasteCell(cells) {
  if (cells.length == 0)  {
    return;
  }
  var offset = cells[0].point;
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i].copy();
    var point = new Point(
      charaster.cursor.x + Math.abs(offset.x - cell.point.x),
      charaster.cursor.y + Math.abs(offset.y - cell.point.y)
    );
    if (point.x >= charaster.gridWidth || point.y >= charaster.gridHeight) {
      continue; // Out of range of raster.
    } else {
      if (cell.character == null) {
        cell.character = " ";
      }
      cell.point = point;
      charaster.setCell(cell);
    }
  }
  rasterHistory.add(charaster.raster);
}

/**
 * Stops the drawing process so it can be started fresh again.
 */
function endDraw() {
  draw = false;
  drawList = [];
}

/**
 * Finds the red, green and blue components as integers for a HTML hex colour code.
 *
 * @see     {@link http://stackoverflow.com/a/11508164}
 * @param   {String} hex - With HTML #rrggbb notation.
 * @return  {Object} r, g, b.
 */
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  var int = parseInt(hex, 16);
  var r = (int >> 16) & 255;
  var g = (int >> 8) & 255;
  var b = int & 255;
  return {r: r, g: g, b: b};
}

/**
 * Interpolate by drawing lines between points.
 *
 * @param   {Cell}    cell - Interpolation cell.
 */
function interpolate(cell) {
  if (drawList.length >= 1 && !drawList[drawList.length - 1].equalForDraw(cell)) {
    drawList.push(cell);
    if (drawList.length >= 2) {
      var line = rasterLine(drawList[0].point, drawList[1].point);

      // Draw lines between cells.
      for (var i = 0; i < line.length; i++) {
        if (cell.character == null) {
          charaster.clearCell(line[i]);
        } else {
          charaster.setCell(new Cell(line[i]));
        }
      }
      drawList.shift();
    }
  } else if (drawList.length == 0) {
    drawList.push(cell);
  }
}

/**
 * Check if points are within the grid.
 *
 * @param   {Number}  x
 * @param   {Number}  y
 * @return  {Boolean} True if inside.
 */
function isInsideGrid(x, y) {
  if (x >= 0 && x < charaster.gridWidth && y >= 0 && y < charaster.gridHeight) {
    return true;
  }
  return false;
}

/**
 * Sets the new raster size by cropping cells, also adds to history the previous raster.
 */
function applyRasterSize() {
  var prevRaster = charaster.copyRaster(charaster.raster);
  charaster.raster = charaster.createRaster(charaster.gridWidth, charaster.gridHeight);

  // Clear new.
  for (var col = 0; col < charaster.gridWidth; col++) {
    for (var row = 0; row < charaster.gridHeight; row++) {
      charaster.clearCell(new Point(col, row));
    }
  }

  // Copy old.
  for (var col = 0; col < prevRaster.length; col++) {
    for (var row = 0; row < prevRaster[col].length; row++) {
      if (prevRaster[col][row].character != null) {
        charaster.setCell(prevRaster[col][row]);
      }
    }
  }
  rasterHistory.add(charaster.raster);
  charaster.drawAll();
}

/**
 * Check if cell is empty.
 *
 * @param   {Cell}  cell
 * @return  {Boolean} True if empty.
 */
function isEmptyCell(cell) {
  if ((cell.character == " " || cell.character == null)
   && cell.foregroundId == "foreground"
   && cell.backgroundId == "background"
   && !cell.bold
   && !cell.italic) {
    return true;
  }
  return false;
}

/**
 * Find the smallest size the raster is cropped to, then applies it.
 */
function autoCrop() {

  // Find origin and destination to form a rectangle.
  var top = charaster.gridHeight;
  var right = 0;
  var bottom = 0;
  var left = charaster.gridWidth;
  for (var col = 0; col < charaster.gridWidth; col++) {
    for (var row = 0; row < charaster.gridHeight; row++) {
      var cell = charaster.getCell(new Point(col, row));
      if (isEmptyCell(cell)) {
        continue;
      }
      if (row < top) {
        top = row;
      }
      if (col > right) {
        right = col;
      }
      if (row > bottom) {
        bottom = row;
      }
      if (col < left) {
        left = col;
      }
    }
  }
  right++;
  bottom++;

  // Copy the cells to move.
  var cells = [];
  for (var col = left; col < right; col++) {
    for (var row = top; row < bottom; row++) {
      cells.push(charaster.getCell(new Point(col, row)).copy());
    }
  }

  // New smaller raster.
  charaster.gridWidth = Math.max(1, right - left);
  charaster.gridHeight = Math.max(1, bottom - top);
  charaster.raster = charaster.createRaster(charaster.gridWidth, charaster.gridHeight);
  for (var i = 0; i < cells.length; i++) {
    cells[i].point.x -= left;
    cells[i].point.y -= top;
    charaster.setCell(cells[i]);
  }
  rasterHistory.add(charaster.raster);
  charaster.drawAll();
}

/**
 * Undo the current raster.
 */
function undo() {
  charaster.raster = rasterHistory.undo();
  charaster.gridHeight = charaster.raster.length;
  charaster.gridWidth = charaster.raster[0].length;
  charaster.drawAll();
}

/**
 * Redo the current raster.
 */
function redo() {
  charaster.raster = rasterHistory.redo();
  charaster.gridHeight = charaster.raster.length;
  charaster.gridWidth = charaster.raster[0].length;
  charaster.drawAll();
}

/**
 * Scroll so that the cursor is in view.
 * TODO give more room.
 */
function autoScroll() {
  var main =  document.getElementById("main");

  // Horizontal.
  var pixelX = charaster.cursor.x * charaster.fontWidth;
  var maxX = (main.scrollLeft + window.innerWidth / 2) ;
  main.scrollLeft += pixelX - maxX;

  // Vertical.
  var pixelY = charaster.cursor.y * charaster.fontHeight;
  var maxY = (main.scrollTop + window.innerHeight / 2) ;
  main.scrollTop += pixelY - maxY;
}

/**
 * Makes sure cell points are at the correct location, useful when moving cells around.
 *
 * @param   {Cell[][]} raster
 * @return  {Cell[][]}
 */
function applyCoordinates(raster) {
  for (var col = 0; col < raster.length; col++) {
    for (var row = 0; row < raster[0].length; row++) {
      raster[col][row].point = new Point(row, col);
    }
  }
  return raster;
}

/**
 * Clear cells in the selected region.
 */
function clearSelectedCells() {
  var startStop = getStartStop(charaster.selectBegin, charaster.selectClose);
  for (var y = startStop[0].y; y < startStop[1].y; y++) {
    for (var x = startStop[0].x; x < startStop[1].x; x++) {
      charaster.clearCell(new Point(x, y));
    }
  }
}

/**
 * Hides lists in view.
 * @param   {String} notId - Do not effect this ID.
 */
function hideLists(notId) {
  var lists = document.getElementsByClassName("list");
  for (var i = 0; i < lists.length; i++) {
    if (lists[i].id != notId || notId == null) {
      lists[i].style.visibility = "hidden";
    }
  }
}
