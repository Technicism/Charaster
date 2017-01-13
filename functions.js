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
 * @see   {@link https://en.wikipedia.org/wiki/Flood_fill}
 * @param {Cell}  cell
 * @param {Cell}  target
 * @param {Cell}  replacement
 */
function rasterFlood(cell, target, replacement) {
  var queue = [];
  queue.push(cell);
  while (queue.length != 0) {
    var floodCell = queue.pop();
    if (floodCell == null || equalForFill(target, replacement) || !equalForFill(floodCell, target)) {
      continue;
    } else if (floodCell.character == target.character) {
      floodCell.character = replacement.character;
      floodCell.foreground = replacement.foreground;
      floodCell.background = replacement.background;
      charaster.setCell(floodCell);
      queue.push(charaster.getCell(new Point(floodCell.point.x, floodCell.point.y - 1))); // Top.
      queue.push(charaster.getCell(new Point(floodCell.point.x + 1, floodCell.point.y))); // Right.
      queue.push(charaster.getCell(new Point(floodCell.point.x, floodCell.point.y + 1))); // Bottom.
      queue.push(charaster.getCell(new Point(floodCell.point.x - 1, floodCell.point.y))); // Left.
    }
  }
}

function equalForFill(a, b) {
  if (a.character == b.character && a.foreground == b.foreground && a.background == b.background) {
    return true;
  }
  return false;
}

function getMousePos(canvas, e) {
  var rect = canvas.getBoundingClientRect();
  return new Point(e.clientX - rect.left, e.clientY - rect.top);
}

// Snap a given value to the grid interval.
function snap(pos, grid) {
  for (var i = 0; i < Math.max(charaster.rasterCanvas.width, charaster.rasterCanvas.height); i += grid) {
    if (pos <= i) {
      return i;
    }
  }
}

// Snap a given point to the grid.
function snapPos(point) {
  var x = snap(point.x, charaster.fontWidth);
  var y = snap(point.y, charaster.fontHeight);
  return new Point(x, y);
}

function measureCharacter(font) {

  // Find the width and height from the automatically sized bounding box.
  var span = document.createElement("span");
  span.innerHTML = "█"
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
    context.fillText("█", 0, charaster.fontHeight - fontOffset);
    fontOffset++;
  }
  charaster.fontOffset = fontOffset;
}

// Zoom in or out by changing the font size.
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
  var display = Math.round((size / 12) * 100) + "%";
  document.getElementById("zoomPercent").innerHTML = display;
}

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

function buttonStyle(id, active) {
  var button = document.getElementById(id);
  if (active) {
    button.style.background = charaster.theme.iconActive;
    button.style.color = charaster.theme.iconActiveText;
  } else {
    button.style.background = "none";
    button.style.color = charaster.theme.icon;
  }
  var icons = button.getElementsByClassName("icon");
  for (var i = 0; i < icons.length; i++) {
    if (active) {
      icons[i].style.fill = charaster.theme.iconActiveText;
    } else {
      icons[i].style.fill = charaster.theme.icon;
    }
  }
  var iconStrokes = button.getElementsByClassName("iconStroke");
  for (var i = 0; i < iconStrokes.length; i++) {
    if (active) {
      iconStrokes[i].style.stroke = charaster.theme.iconActiveText;
    } else {
      iconStrokes[i].style.stroke = charaster.theme.icon;
    }
  }
}

function saveText() {
  var lines = "";
  for (var col = 0; col < charaster.gridHeight; col++) {
    var line = "";
    for (var row = 0; row < charaster.gridWidth; row++) {
      var cell = charaster.raster[col][row];
      if (cell.character == null) {
        line += " ";
      } else {
        line += charaster.raster[col][row].character;
      }
    }
    lines += line + "\n";
  }
  return lines;
}

function saveShell() {
  var string = "";
  for (var col = 0; col < charaster.gridHeight; col++) {
    for (var row = 0; row < charaster.gridWidth; row++) {
      var cell = charaster.raster[col][row];
      if (cell.character == null) {
        string += " ";
      } else {
        string += "\\e[" + parseInt(cell.foregroundId + 29) + "m";
        string += charaster.raster[col][row].character;
      }
    }
    string += "\\n";
  }
  console.log(string);
  return string;
}

function pasteText(text) {
  var x = 0;
  var y = 0;
  for (var i = 0; i < text.length; i++) {
    if (text[i] == "\n") {
      y++;
      x = 0;
    } else if (text[i] != "\r") {
      var point = new Point(charaster.cursor.x + x, charaster.cursor.y + y);
      if (point.x >= charaster.gridWidth || point.y >= charaster.gridHeight) {
        continue; // Out of range of raster.
      }
      var character = text[i];
      var cell = new Cell(point, character);
      charaster.setCell(cell);
      x++;
    }
  }
}

function pasteCell() {
  if (charaster.clipboard.length > 0)  {
    var offset = charaster.clipboard[0].point;
    for (var i = 0; i < charaster.clipboard.length; i++) {
      var cell = charaster.clipboard[i].copy();
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
  }
}
