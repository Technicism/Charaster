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

var mouseDown = false;
var draw = false;
var drawList = new Array();
var lineStart;

// Draw a line using Bresenham's line algorithm, see reference http://tech-algorithm.com/articles/drawing-line-using-bresenham-algorithm/
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
  intWidth = Math.abs(width);
  intHeight = Math.abs(height);
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

// Flood fill algorithm, see reference https://en.wikipedia.org/wiki/Flood_fill
function rasterFlood(cell, target, replacement) {
  queue = [];
  queue.push(cell);
  while (queue.length != 0) {
    floodCell = queue.pop();
    if (floodCell == null || equalForFill(target, replacement) || !equalForFill(floodCell, target)) {
      continue;
    } else if (floodCell.character == target.character) {
      floodCell.character = replacement.character;
      floodCell.foreground = replacement.foreground;
      floodCell.background = replacement.background;
      charaster.setCell(floodCell);
      queue.push(charaster.getCell(new Point(floodCell.point.x, floodCell.point.y - 1)));
      queue.push(charaster.getCell(new Point(floodCell.point.x, floodCell.point.y + 1)));
      queue.push(charaster.getCell(new Point(floodCell.point.x - 1, floodCell.point.y)));
      queue.push(charaster.getCell(new Point(floodCell.point.x + 1, floodCell.point.y)));
    }
  }
}

function equalForFill(a, b) {
  if (a == null || b == null) {
    return false;
  }
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
  charaster.preview.value = charaster.character;

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
  if (e.keyCode == 46) {  // Delete.
    charaster.clearCell(charaster.cursor);
  }
  if (e.keyCode == 32) {
    e.preventDefault(); // Space scrolling.
  }
  if (charaster.mode == "TEXT") {
    if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
    if (e.keyCode == 39 && charaster.cursor.x < charaster.gridWidth - 1) {  // Move right.
      charaster.moveCursorRelative(1, 0);
    } else if (e.keyCode == 40 && charaster.cursor.y < charaster.gridHeight - 1) {  // Move down.
      charaster.moveCursorRelative(0, 1);
    } else if (e.keyCode == 37 && charaster.cursor.x > 0) { // Move left.
      charaster.moveCursorRelative(-1, 0);
    } else if (e.keyCode == 38 && charaster.cursor.y > 0) { // Move up.
      charaster.moveCursorRelative(0, -1);
    } else if (e.keyCode == 8) {  // Backspace.
      charaster.moveCursorRelative(-1, 0);
      charaster.clearCell(charaster.cursor);
    } else if (e.keyCode == 32) { // Spacebar.
      charaster.moveCursorRelative(1, 0);
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
              charaster.setCell(new Cell(line[i], character));
            } else if (charaster.mode == "ERASER") {
              charaster.clearCell(line[i]);
            }
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

  // Reset drawing to avoid unwanted lines from enter and exit points.
  draw = false;
  drawList = [];
  if (mouseDown) {
    draw = true;
  }
}, false);

charaster.cursorCanvas.addEventListener("click", function(e) {
  var pos = getMousePos(charaster.rasterCanvas, e);
  charaster.cursor = charaster.coordToGrid(snapPos(pos));
  charaster.drawCursor();
  if (charaster.mode == "PENCIL") {
    charaster.setCell(new Cell(charaster.cursor, charaster.character));
  } else if (charaster.mode == "ERASER") {
    charaster.clearCell(charaster.cursor);
  } else if (charaster.mode == "FLOOD") {
    var cell = charaster.getCell(charaster.cursor);
    var targetCell = Object.assign({}, cell);
    rasterFlood(cell, targetCell, new Cell(charaster.cursor, charaster.character));
  }
}, false);

charaster.cursorCanvas.addEventListener("mousedown", function(e) {
  mouseDown = true;
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER" || charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
    draw = true;
    if (charaster.mode == "ERASER") {
      charaster.clearCell(charaster.cursor);
    } else {
      var cell = new Cell(charaster.cursor, charaster.character);
      charaster.setCell(cell);
    }
  }
  if (charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
    lineStart = charaster.cursor;
  }
}, false);

window.addEventListener("mouseup", function(e) {
  mouseDown = false;

  // Finish off drawing.
  if (draw) {
    var points = [];
    if (charaster.mode == "LINE") {
      points = rasterLine(lineStart, charaster.cursor);
    } else if (charaster.mode == "RECTANGLE") {
      points = rasterRectangle(lineStart, charaster.cursor);
    }
    for (var i = 0; i < points.length; i++) {
      charaster.setCell(new Cell(points[i], charaster.character));
    }
  }
  draw = false;
  drawList = [];
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
  var clipboard = document.getElementById("clipboard");
  clipboard.innerHTML = "this is a test";
  clipboard.focus();
  clipboard.select();
}, false);

window.addEventListener("paste", function(e) {
  e.preventDefault();

  // Get text from clipboard.
  e.stopPropagation();
  var clipboardData = e.clipboardData || window.clipboardData;
  var text = clipboardData.getData('Text');

  // Place it into raster.
  for (var i = 0; i < text.length; i++) {
    charaster.setCell(new Cell(new Point(charaster.cursor.x + i, charaster.cursor.y), text[i]));
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
