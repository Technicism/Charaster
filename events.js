// Canvases.
charaster.gridCanvas = document.getElementById("grid");
charaster.gridContext = charaster.gridCanvas.getContext("2d");
charaster.rasterCanvas = document.getElementById("raster");
charaster.rasterContext = charaster.rasterCanvas.getContext("2d");
charaster.rasterTempCanvas = document.getElementById("rasterTemp");
charaster.rasterTempContext = charaster.rasterTempCanvas.getContext("2d");
charaster.cursorCanvas = document.getElementById("cursor");
charaster.cursorContext = charaster.cursorCanvas.getContext("2d");

// Info.
charaster.cursorPos = document.getElementById("cursorPos");
charaster.gridSize = document.getElementById("gridSize");
charaster.gridSize.innerHTML = "[" + charaster.gridWidth + ", " + charaster.gridHeight + "]";

// Chrome.
charaster.body = document.getElementById("body");
charaster.controls = document.getElementById("controls");
charaster.info = document.getElementById("info");
charaster.bars = document.getElementsByClassName("bar");
charaster.foreground = document.getElementById("foreground");
charaster.icons = document.getElementsByClassName("icon");
charaster.iconStrokes = document.getElementsByClassName("iconStroke");
charaster.preview = document.getElementById("preview");
charaster.noColor = document.getElementById("noColor");
charaster.themeSelect = document.getElementById("themeSelect");

var draw = false;
var drawList = new Array();
var lineStart;

// Based on http://tech-algorithm.com/articles/drawing-line-using-bresenham-algorithm/
function rasterLine(a, b) {
  var x0 = a.x;
  var y0 = a.y;
  var x1 = b.x;
  var y1 = b.y;
  var width = x1 - x0;
  var height = y1 - y0;
  var slopeX0 = 0;
  var slopeY0 = 0;
  var slopeX1 = 0;
  var slopeY1 = 0;

  // Octant.
  if (width < 0) {
    slopeX0 = -1;
  } else if (width > 0) {
    slopeX0 = 1;
  }
  if (height < 0) {
    slopeY0 = -1;
  } else if (height > 0) {
    slopeY0 = 1;
  }
  if (width < 0) {
    slopeX1 = -1;
  } else if (width > 0) {
    slopeX1 = 1;
  }
  intWidth = Math.abs(width);
  intHeight = Math.abs(height);
  var longest = intWidth;
  var shortest = intHeight;
  if (longest <= shortest) {
    longest = intHeight
    shortest = intWidth
    if (height < 0) {
      slopeY1 = -1;
    } else if (height > 0) {
      slopeY1 = 1;
    }
    slopeX1 = 0;
  }

  // Drawing.
  var list = [];
  var numerator = longest >> 1;
  for (var i = 0; i <= longest; i++) {
    list.push(new Point(x0, y0));
    numerator += shortest;
    if (numerator >= longest) {
      numerator -= longest;
      x0 += slopeX0;
      y0 += slopeY0;
    } else {
      x0 += slopeX1;
      y0 += slopeY1;
    }
  }
  return list;
}

// Create a rectangle out of four lines.
function rasterRectangle(p, q) {
  var points = [];
  var sideLeft = rasterLine(
    p,
    new Point(p.x, q.y)
  );
  var sideRight = rasterLine(
    new Point(q.x, p.y),
    q
  );
  var sideTop = rasterLine(
    p,
    new Point(q.x, p.y)
  );
  var sideBottom = rasterLine(
    new Point(p.x, q.y),
    charaster.cursor
  );
  points = points.concat(sideLeft);
  points = points.concat(sideRight);
  points = points.concat(sideTop);
  points = points.concat(sideBottom);
  return points;
}

function allowFlood(cell, flood) {
  if (cell == null) {
    return false;
  }
  if (cell.character == null) {
    return true;
  } else if (cell.character == flood.character) {

  }
  return false;
}

// Non-recursive flood fill algorithm.
function rasterFlood(p, fillCell) {
  var queue = [];
  queue.push(p);
  while (queue.length != 0) {
    flood = queue.pop();
    var cell = charaster.getCell(flood);
    cell.character = fillCell.character;
    cell.point = flood;
    charaster.setCell(cell);
    var up = charaster.getCell(new Point(flood.x, flood.y - 1));
    if (allowFlood(up, fillCell)) {
      queue.push(up.point);
    }
    var right = charaster.getCell(new Point(flood.x + 1, flood.y));
    if (allowFlood(right, fillCell)) {
      queue.push(right.point);
    }
    var down = charaster.getCell(new Point(flood.x, flood.y + 1));
    if (allowFlood(down, fillCell)) {
      queue.push(down.point);
    }
    var left = charaster.getCell(new Point(flood.x - 1, flood.y));
    if (allowFlood(left, fillCell)) {
      queue.push(left.point);
    }
  }
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

// When a button is clicked change the mode and visual style of it.
function buttonMode(id, mode, activate) {
  var button = document.getElementById(id);
  button.addEventListener("click", function(e) {
    var reset = document.getElementsByClassName("tools");
    for (var i = 0; i < reset.length; i++) {
      reset[i].style.fill = charaster.theme.icon;
      reset[i].style.background = "none";
      reset[i].style.color = charaster.theme.icon;
      if (reset[i].getElementsByClassName("icon")[0] != null) {
        reset[i].getElementsByClassName("icon")[0].style.fill = charaster.theme.icon;
      }
      if (reset[i].getElementsByClassName("iconStroke")[0] != null) {
        reset[i].getElementsByClassName("iconStroke")[0].style.stroke = charaster.theme.icon;
      }
    }
    button.style.background = charaster.theme.iconActive;
    button.style.color = charaster.theme.iconActiveText;
    if (button.getElementsByClassName("icon")[0] != null) {
      button.getElementsByClassName("icon")[0].style.fill = charaster.theme.iconActiveText;
    }
    if (button.getElementsByClassName("iconStroke")[0] != null) {
      button.getElementsByClassName("iconStroke")[0].style.stroke = charaster.theme.iconActiveText;
    }
    button.style.borderRadius = "2px";
    if (charaster.mode == "TEXT" && (mode == "PENCIL") || mode == "ERASER") {
      charaster.prevCursor = charaster.cursor;
      charaster.drawCursor();
    }
    if ((charaster.mode == "PENCIL" || charaster.mode == "ERASER") && mode == "TEXT") {
      charaster.cursor = charaster.prevCursor;
      charaster.drawCursor();
    }
    charaster.mode = mode;
  }, false);
  if (activate) {
    button.style.background = charaster.theme.iconActive;
    button.getElementsByClassName("icon")[0].style.fill = charaster.theme.iconActiveText;
    button.style.borderRadius = "2px";
  }
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
  delete span;

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
  delete canvas;
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

window.addEventListener("load", function(e) {
  measureCharacter(charaster.font);

  charaster.applyTheme(charaster.theme.name);
  charaster.drawRaster();
  charaster.drawRaster("temp");
  charaster.drawCursor();
  charaster.drawGrid();

  buttonMode("textMode", "TEXT", false);
  buttonMode("eraserMode", "ERASER", false);
  buttonMode("pencilMode", "PENCIL", true);
  buttonMode("lineMode", "LINE", false);
  buttonMode("rectangleMode", "RECTANGLE", false);
  buttonMode("floodMode", "FLOOD", false);

  // Apply theme colours to buttons.
  for (var i = 0; i < charaster.theme.colors.length; i++) {
    var colorButton = document.getElementById("color" + (i + 1));
    colorButton.style.backgroundColor = charaster.theme.colors[i];
    colorButton.style.borderColor = charaster.theme.barBorder;

    // Left click to apply colour to foreground.
    colorButton.addEventListener("click", function(e) {
      var index = e.target.id.replace("color", "") - 1;
      charaster.foreground = charaster.theme.colors[index];
      charaster.preview.style.color = charaster.theme.colors[index];
    }, false);

    // Right click to apply colour to background.
    colorButton.addEventListener("contextmenu", function(e) {
      e.preventDefault();
      var index = e.target.id.replace("color", "") - 1;
      charaster.background = charaster.theme.colors[index];
      charaster.preview.style.backgroundColor = charaster.theme.colors[index];
    }, false);
  }
}, false);

// Left click to reset foreground.
charaster.noColor.addEventListener("click", function(e) {
  charaster.foreground = charaster.theme.foreground;
  charaster.preview.style.color = charaster.theme.foreground;
}, false);

// Right click to reset background.
charaster.noColor.addEventListener("contextmenu", function(e) {
  e.preventDefault();
  charaster.background = charaster.theme.background;
  charaster.preview.style.backgroundColor = charaster.theme.background;
}, false);


window.addEventListener("keydown", function(e) {
  if (e.keyCode == 46) {
    charaster.setCell(new Cell(charaster.cursor, null)); // Delete.
  }
  if (charaster.mode == "TEXT") {
    if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
    if (e.keyCode == 39 && charaster.cursor.x < charaster.gridWidth - 1) {
      charaster.moveCursorRelative(1, 0);   // Right.
    } else if (e.keyCode == 40 && charaster.cursor.y < charaster.gridHeight - 1) {
      charaster.moveCursorRelative(0, 1);   // Down.
    } else if (e.keyCode == 37 && charaster.cursor.x > 0) {
      charaster.moveCursorRelative(-1, 0);  // Left.
    } else if (e.keyCode == 38 && charaster.cursor.y > 0) {
      charaster.moveCursorRelative(0, -1);  // Up.
    } else if (e.keyCode == 8) {
      charaster.setCell(new Cell(charaster.cursor, null)); // Delete.
      charaster.moveCursorRelative(-1, 0);  // Left.
    }
  }
}, false);

window.addEventListener("keypress", function(e) {
  if([13].indexOf(e.keyCode) > -1) {
    return;
  }
  charaster.character = String.fromCharCode(e.charCode);

  // Automatically update current cell character.
  charaster.preview.value = charaster.character;
  charaster.preview.style.backgroundColor = charaster.background;
  charaster.preview.style.color = charaster.foreground;

  if (charaster.mode == "TEXT") {
    charaster.setCell(new Cell(charaster.cursor, charaster.character));
    charaster.moveCursorRelative(1, 0);
  }
}, false);

charaster.cursorCanvas.addEventListener("mousemove", function(e) {
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER" || charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
    var pos = getMousePos(charaster.rasterCanvas, e);
    charaster.cursor = charaster.coordToGrid(snapPos(pos));
    charaster.drawCursor();
    if (draw) {
      var cell = new Cell(charaster.cursor, charaster.character);
      if (charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
        charaster.drawRaster("temp");
        var points = [];
        if (charaster.mode == "LINE") {
          points = rasterLine(lineStart, charaster.cursor);
        } else if (charaster.mode == "RECTANGLE") {
          points = rasterRectangle(lineStart, charaster.cursor);
        }
        for (var i = 0; i < points.length; i++) {
          charaster.setCell(new Cell(points[i], charaster.character), charaster.rasterTempContext);
        }
      } else if (drawList.length >= 1 && !drawList[drawList.length - 1].equality(cell)) {
        drawList.push(cell);
        if (drawList.length >= 2) {
          var line = rasterLine(drawList[0].point, drawList[1].point);

          // Draw lines between cells.
          for (var i = 0; i < line.length; i++) {
            var character = null;
            if (charaster.mode == "PENCIL") {
              character = charaster.character;
            }
            charaster.setCell(new Cell(line[i], character));
          }
          drawList.shift();
        }
      } else if (drawList.length == 0) {
        drawList.push(cell);
      }
    }
  }
}, false);

charaster.cursorCanvas.addEventListener("mouseleave", function(e) {
  draw = false;
  drawList = [];
}, false);

charaster.cursorCanvas.addEventListener("click", function(e) {
  var pos = getMousePos(charaster.rasterCanvas, e);
  charaster.cursor = charaster.coordToGrid(snapPos(pos));
  charaster.drawCursor();
  var character = null;
  if (charaster.mode == "PENCIL") {
    character = charaster.character;
    charaster.setCell(new Cell(charaster.cursor, character));
  } else if (charaster.mode == "ERASER") {
    charaster.setCell(new Cell(charaster.cursor, null));
  } else if (charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
    charaster.drawRaster("temp");
    var points = [];
    if (charaster.mode == "LINE") {
      points = rasterLine(lineStart, charaster.cursor);
    } else if (charaster.mode == "RECTANGLE") {
      points = rasterRectangle(lineStart, charaster.cursor);
    }
    for (var i = 0; i < points.length; i++) {
      charaster.setCell(new Cell(points[i], charaster.character));
    }
  } else if (charaster.mode == "FLOOD") {
    character = charaster.character;
    rasterFlood(charaster.cursor, new Cell(charaster.cursor, character));
  }
}, false);

charaster.cursorCanvas.addEventListener("mousedown", function(e) {
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER" || charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
    draw = true;
    var cell = new Cell(charaster.cursor, charaster.character);
    if (charaster.mode == "ERASER") {
      cell.character = null;
    }
    charaster.setCell(cell);
  }
  if (charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
    lineStart = charaster.cursor;
  }
}, false);

charaster.cursorCanvas.addEventListener("mouseup", function(e) {
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER" || charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
    draw = false;
    drawList = [];
  }
}, false);

document.getElementById("boldText").addEventListener("click", function(e) {
  charaster.bold = !charaster.bold;
  if (charaster.bold) {
    charaster.preview.style.fontWeight = "bold";
  } else {
    charaster.preview.style.fontWeight = "normal";
  }
}, false);

document.getElementById("italicText").addEventListener("click", function(e) {
  charaster.italic = !charaster.italic;
  if (charaster.italic) {
    charaster.preview.style.fontStyle = "italic";
  } else {
    charaster.preview.style.fontStyle = "normal";
  }
}, false);

document.getElementById("underlineText").addEventListener("click", function(e) {
  charaster.italic = !charaster.italic;
  if (charaster.italic) {
    charaster.preview.style.fontStyle = "italic";
  } else {
    charaster.preview.style.fontStyle = "normal";
  }
}, false);

document.getElementById("saveButton").addEventListener("click", function(e) {
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
  document.getElementById("saveRaw").innerHTML = lines;
  document.getElementById("saveDialog").style.visibility = "visible";
}, false);

document.getElementById("saveCancel").addEventListener("click", function(e) {
  document.getElementById("saveDialog").style.visibility = "hidden";
}, false);

window.addEventListener("copy", function(e) {
  charaster.clipboard = [];
  charaster.clipboard.push(charaster.getCell(charaster.cursor));
}, false);

window.addEventListener("paste", function(e) {
  for (var i = 0; i < charaster.clipboard.length; i++) {
    var cell = charaster.clipboard[i];
    cell.point = charaster.cursor;
    charaster.setCell(cell);
  }
}, false);

window.addEventListener("resize", function(e) {
  var top = document.getElementById("controls").clientHeight + 1;
  charaster.gridCanvas.style.top = top + "px";
  charaster.rasterCanvas.style.top = top + "px";
  charaster.rasterTempCanvas.style.top = top + "px";
  charaster.cursorCanvas.style.top = top + "px";
}, false);

document.getElementById("zoomIn").addEventListener("click", function(e) {
  var size = parseInt(charaster.fontSize) + 1;
  zoom(size);
}, false);

document.getElementById("zoomOut").addEventListener("click", function(e) {
  var size = parseInt(charaster.fontSize) - 1;
  zoom(size);
}, false);

document.getElementById("gridToggle").addEventListener("click", function(e) {
  if (document.getElementById("grid").style.visibility == "hidden") {
    document.getElementById("grid").style.visibility = "visible";
    document.getElementById("gridToggleStatus").innerHTML = "ON";
  } else {
    document.getElementById("grid").style.visibility = "hidden";
    document.getElementById("gridToggleStatus").innerHTML = "OFF";
  }
}, false);
