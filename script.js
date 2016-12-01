// Canvases.
charaster.gridCanvas = document.getElementById("grid");
charaster.gridContext = charaster.gridCanvas.getContext("2d");
charaster.rasterCanvas = document.getElementById("raster");
charaster.rasterContext = charaster.rasterCanvas.getContext("2d");
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

function getMousePos(canvas, e) {
  var rect = canvas.getBoundingClientRect();
  return new Point(e.clientX - rect.left, e.clientY - rect.top);
}

function snap(pos, grid) {
  for (var i = 0; i < Math.max(charaster.rasterCanvas.width, charaster.rasterCanvas.height); i += grid) {
    if (pos <= i) {
      return i;
    }
  }
}

function snapPos(point) {
  var x = snap(point.x, charaster.fontWidth);
  var y = snap(point.y, charaster.fontHeight);
  return new Point(x, y);
}

var draw = false;
var drawList = new Array();







window.addEventListener("load", function(e) {
  charaster.applyTheme(charaster.theme.name);
  charaster.drawRaster();
  charaster.drawCursor();
  charaster.drawGrid();
}, false);

window.addEventListener("keydown", function(e) {

  // Move cursor with arrow keys.
  if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
  if (e.keyCode == 39 && charaster.cursor.x < charaster.gridWidth) {
    charaster.moveCursorRelative(1, 0);
  } else if (e.keyCode == 40 && charaster.cursor.y < charaster.gridHeight) {
    charaster.moveCursorRelative(0, 1);
  } else if (e.keyCode == 37 && charaster.cursor.x > 0) {
    charaster.moveCursorRelative(-1, 0);
  } else if (e.keyCode == 38 && charaster.cursor.y > 0) {
    charaster.moveCursorRelative(0, -1);
  }
}, false);

window.addEventListener("keypress", function(e) {
  charaster.character = String.fromCharCode(e.keyCode);
  charaster.placeCell(new Cell(charaster.cursor, char));
  charaster.moveCursorRelative(1, 0);
  document.getElementById("char").value = charaster.character;
}, false);

charaster.cursorCanvas.addEventListener('mousemove', function(e) {
  if (charaster.mode == "PENCIL") {
    var pos = getMousePos(charaster.rasterCanvas, e);
    charaster.cursor = charaster.coordToGrid(snapPos(pos));
    charaster.drawCursor();
    if (draw) {
      var cell = new Cell(charaster.cursor, charaster.character);
      if (drawList.length >= 1 && !drawList[drawList.length - 1].equality(cell)) {
        drawList.push(cell);
        if (drawList.length >= 2) {
          var line = rasterLine(
            drawList[0].point.x, drawList[0].point.y,
            drawList[1].point.x, drawList[1].point.y
          );

          // Draw lines between cells.
          for (var i = 0; i < line.length; i++) {
            charaster.placeCell(new Cell(line[i], charaster.character));
          }
          drawList.shift();
        }
      } else if (drawList.length == 0) {
        drawList.push(cell);
      }
    }
  }
}, false);

charaster.cursorCanvas.addEventListener('click', function(e) {
  if (charaster.mode == "PENCIL") {
    var pos = getMousePos(charaster.rasterCanvas, e);
    charaster.cursor = charaster.coordToGrid(snapPos(pos));
    charaster.placeCell(new Cell(charaster.cursor, charaster.character));
  }
}, false);

charaster.cursorCanvas.addEventListener('mousedown', function(e) {
  if (charaster.mode == "PENCIL") {
    draw = true;
    var cell = new Cell(charaster.cursor, charaster.character);
    charaster.placeCell(cell);
  }
}, false);

charaster.cursorCanvas.addEventListener('mouseup', function(e) {
  if (charaster.mode == "PENCIL") {
    draw = false;
    drawList = [];
  }
}, false);




window.addEventListener('copy', copy, false);

function copy() {
  alert("copy");
}



window.addEventListener('resize', topBar, false);


function getColor(control) {
  var value = document.getElementById(control).value;
  if (value == "foreground") {
    return charaster.theme.foreground;
  } else {
    return charaster.theme.colors[value];
  }
}

function topBar() {
  var top = document.getElementById("controls").clientHeight + 1;
  charaster.gridCanvas.style.top = top + "px";
  charaster.rasterCanvas.style.top = top + "px";
  charaster.cursorCanvas.style.top = top + "px";
  // var iframe = document.getElementById("rasterFrame");
  // var bottom = 24;
  // iframe.style.height = window.innerHeight - top - bottom + "px";
  // alert(iframe.style.height);
}
















// Based on http://tech-algorithm.com/articles/drawing-line-using-bresenham-algorithm/
function rasterLine(x0, y0, x1, y1) {
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
