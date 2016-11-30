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





var char = "o";
var fontHeight = 19;
var fontWidth = 9;
var gridWidth = 120;
var gridHeight = 40;


window.addEventListener("load", function(e) {
  charaster.applyTheme(charaster.theme.name);
  charaster.drawRaster();
  charaster.drawCursor();
  charaster.drawGrid();
} , false);

window.addEventListener("keydown", function(e) {

  // Move cursor with arrow keys.
  if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
  if (e.keyCode == 39 && charaster.cursor.x < gridWidth) {
    charaster.moveCursorRelative(1, 0);
  } else if (e.keyCode == 40 && charaster.cursor.y < gridHeight) {
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


var draw = false;



charaster.cursorCanvas.addEventListener('mousemove', function(e) {
  if (charaster.mode == "PENCIL") {
    var pos = getMousePos(charaster.rasterCanvas, e);
    charaster.cursor = charaster.coordToGrid(snapPos(pos));
    charaster.drawCursor();
    if (draw) {
      charaster.placeCell(new Cell(charaster.cursor, charaster.character));
    }
  }
} , false);

charaster.cursorCanvas.addEventListener('click', function(e) {
  if (charaster.mode == "PENCIL") {
    var pos = getMousePos(charaster.rasterCanvas, e);
    charaster.cursor = charaster.coordToGrid(snapPos(pos));
    charaster.placeCell(new Cell(charaster.cursor, charaster.character));
  }
} , false);

charaster.cursorCanvas.addEventListener('mousedown', function(e) {
  if (charaster.mode == "PENCIL") {
    draw = true;
  }
} , false);

charaster.cursorCanvas.addEventListener('mouseup', function(e) {
  if (charaster.mode == "PENCIL") {
    draw = false;
  }
} , false);




window.addEventListener('copy', copy, false);

function copy() {
  alert("copy");
}




var cells = [];
function draw(e) {

  var pos = getMousePos(charaster.rasterCanvas, e);
  var gridx = snap(pos.x, fontWidth);
  var gridy = snap(pos.y, fontHeight);

  charaster.cursorContext.clearRect(-1, -1, 1000, 1000);
  charaster.cursorContext.beginPath();
  charaster.cursorContext.lineWidth = 1;
  charaster.cursorContext.strokeStyle = charaster.theme.cursor;
  charaster.cursorContext.rect(gridx, gridy, -fontWidth, -fontHeight);
  charaster.cursorContext.stroke();
  charaster.cursorContext.closePath();



  if (!drawnow) {
    return;
  }
  charaster.rasterContext.stroke();
  charaster.rasterContext.fillStyle = getColor("foreground");
  charaster.rasterContext.font = "12pt Consolas";
  charaster.rasterContext.fillText(char, gridx - fontWidth, gridy - 5);
  charaster.raster[Math.floor(gridy / fontHeight)][Math.floor(gridx / fontWidth)] = char;
  cells.push({x:(Math.floor(gridx / fontWidth)), y:Math.floor(gridy / fontHeight)});
  // cells.push(gridy);

  if (cells.length >= 2) {
    test = rasterLine(cells[0].x, cells[0].y, cells[1].x, cells[1].y);
    for (var i = 0; i < test.length; i++) {
      charaster.rasterContext.clearRect(test[i].x * fontWidth - fontWidth, test[i].y * fontHeight, fontWidth, -fontHeight );
      charaster.rasterContext.fillText(char, test[i].x * fontWidth - fontWidth, test[i].y * fontHeight - 5);
      charaster.raster[test[i].y][test[i].x] = char;
    }
    cells.shift();
  }
}



var drawnow = false;
// window.addEventListener('mousedown', drawing, false);
// window.addEventListener('mouseup', drawing, false);
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


function drawing(e) {
  drawnow = !drawnow;
  if (!drawnow) {
    // ctx.clearRect(0, 0, 1000, 20);
    // ctx.fillText(cells[cells.length - 1].x, 0, 10);
    // ctx.strokeStyle = "#f33";
    // if (cells.length > 5) {
    //   ctx.beginPath();
    //   ctx.moveTo(cells[0].x, cells[0].y);
    //   for (i = 1; i < cells.length - 2; i++) {
    //     var xc = (cells[i].x + cells[i + 1].x) / 2;
    //     var yc = (cells[i].y + cells[i + 1].y) / 2;
    //     ctx.quadraticCurveTo(cells[i].x, cells[i].y, xc, yc);
    //   }
    //   ctx.quadraticCurveTo(cells[i].x, cells[i].y, cells[i+1].x,cells[i+1].y);
    //   ctx.stroke();
    //   cells = [];
    // }
    var pos = getMousePos(charaster.rasterCanvas, e);
    posx = pos.x;
    posy = pos.y;

    gridx = snap(posx, fontWidth);
    gridy = snap(posy, fontHeight)
    charaster.rasterContext.clearRect(gridx, gridy, -fontWidth, -fontHeight);
    // charaster.rasterContext.strokeStyle="red";
    // charaster.rasterContext.rect(gridx, gridy, fontWidth, -fontHeight);
    charaster.rasterContext.stroke();
    charaster.rasterContext.fillStyle = getColor("foreground");
    charaster.rasterContext.font = "12pt Consolas";
    // charaster.rasterContext.fillRect(posx, posy, 4, 4);
    charaster.placeCell(new Cell(charaster.coordToGrid(new Point(gridx, gridy)), charaster.character));
    // charaster.rasterContext.fillText(char, gridx - fontWidth, gridy - 5);
    cells = [];
  }
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
    list.push({x:x0, y:y0});
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





