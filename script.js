var theme = themes[0];

var gridCanvas = document.getElementById("grid");
var gridContext = gridCanvas.getContext("2d");
gridContext.translate(0.5, 0.5);
fitToContainer(gridCanvas);

var rasterCanvas = document.getElementById("raster");
var rasterContext = rasterCanvas.getContext("2d");
rasterContext.translate(0.5, 0.5);
rasterContext.lineWidth = 1;
rasterContext.strokeStyle = theme.foreground;
rasterContext.font = "12pt Consolas";
fitToContainer(rasterCanvas);

var cursorCanvas = document.getElementById("cursor");
var cursorContext = cursorCanvas.getContext("2d");
cursorContext.translate(0.5, 0.5);
cursorContext.lineWidth = 1;
fitToContainer(cursorCanvas);

var char = "o";
var fontHeight = 19;
var fontWidth = 9;
var charWidth = 120;
var charHeight = 40;
var gridWidth = Math.floor(gridCanvas.width / fontWidth);
var gridHeight = Math.floor(gridCanvas.height / fontHeight);
var raster = createArray(charWidth, charHeight);
// alert(raster.length + " " + raster[0].length + " " + gridWidth + " " + gridHeight);


var cursor = new Cell(0, 0);

var darkMode = false;
var body = document.getElementById("body");
var controls = document.getElementById("controls");

setTheme(theme.name);
drawGrid();
drawRaster();
drawCursor();

window.addEventListener("keydown", function(e) {
  // Arrow keys.
  if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
}, false);




function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}
window.addEventListener('mousemove', draw, false);
window.addEventListener('keypress', myKeyPress, false);
window.addEventListener('copy', copy, false);
document.onkeydown = onKeyDown;


function copy() {
  alert(raster[cursor.y][cursor.x]);
}

function myKeyPress(e) {
  // text = "<pre>";

  // for (var col = 0; col < raster.length; col++) {
  //   for (var row = 0; row < raster[0].length; row++) {
  //     if (raster[col][row] != null) {
  //       text += raster[col][row];
  //     } else {
  //       text += "_";
  //     }
  //     text += "\n";
  //   }
  // }
  // document.body.innerHTML = text + "</pre>";
  // return;


  char = String.fromCharCode(e.keyCode);
  setChar(String.fromCharCode(e.keyCode), cursor.x, cursor.y);
  moveCursor(cursor.x + 1, cursor.y);
  document.getElementById("char").value = char;
}

function moveCursor(x, y) {
  cursorContext.clearRect(cursor.x * fontWidth, cursor.y * fontHeight, fontWidth, -fontHeight);
  cursor.x = x;
  cursor.y = y;
  drawCursor();
}

function onKeyDown(e) {

  // Move cursor with arrow keys.
  cursorContext.clearRect(cursor.x * fontWidth, cursor.y * fontHeight, fontWidth, -fontHeight);
  if (e.keyCode == 39 && cursor.x < charWidth) {
    cursor.x++;
  } else if (e.keyCode == 40 && cursor.y < charHeight) {
    cursor.y++;
  } else if (e.keyCode == 37 && cursor.x > 0) {
    cursor.x--;
  } else if (e.keyCode == 38 && cursor.y > 0) {
    cursor.y--;
  }
  drawCursor();
  if (e.keyCode == 65) {
    // toggleDarkMode();
    setTheme("test");
  }
}

function setTheme(name) {
  body.style.background = theme.background;
  controls.style.background = theme.bar;
  icons = document.getElementsByClassName("icon");
  for (var i = 0; i < icons.length; i++) {
    icons[i].style.fill = theme.icon;
  }
  iconStrokes = document.getElementsByClassName("iconStroke");
  for (var i = 0; i < iconStrokes.length; i++) {
    iconStrokes[i].style.stroke = theme.icon;
  }
  bars = document.getElementsByClassName("bar");
  for (var i = 0; i < bars.length; i++) {
    bars[i].style.borderColor = theme.barBorder;
  }
  controls = document.getElementById("controls");
  controls.style.borderColor = theme.barBorder;
  drawGrid();
  drawCursor();
}

function toggleDarkMode() {
  if (darkMode) {
    darkMode = false;
    body.style.background = "#fff";
    controls.style.background = "#f8f8f8";
    theme.grid = "#eee";
  } else {
    darkMode = true;
    body.style.background = "#262626";
    theme.grid = "#3e3e3e";
  }
  drawGrid();
}

function setChar(char, x, y) {
  rasterContext.clearRect(cursor.x * fontWidth, (cursor.y + 1) * fontHeight, fontWidth, -fontHeight);
  rasterContext.fillText(char, x * fontWidth, (y + 1) * fontHeight - 5);
  // raster[y][x] = char;
}


var cells = [];
function draw(e) {
  if (!drawnow) {
    return;
  }
  var pos = getMousePos(rasterCanvas, e);
  posx = pos.x;
  posy = pos.y;

  gridx = snap(posx, fontWidth);
  gridy = snap(posy, fontHeight);
  rasterContext.clearRect(gridx, gridy, fontWidth, -fontHeight);
  // rasterContext.strokeStyle="red";
  // rasterContext.rect(gridx, gridy, fontWidth, -fontHeight);
  rasterContext.stroke();
  rasterContext.fillStyle = theme.foreground;
  rasterContext.font = "12pt Consolas";
  // rasterContext.fillRect(posx, posy, 4, 4);
  rasterContext.fillText(char, gridx, gridy - 5);
  raster[Math.floor(gridy / fontHeight)][Math.floor(gridx / fontWidth)] = char;
  cells.push({x:(Math.floor(gridx / fontWidth)), y:Math.floor(gridy / fontHeight)});
  // cells.push(gridy);

  if (cells.length >= 2) {
    // rasterContext.clearRect(0, 30, 1000, 20);
    // rasterContext.fillText(cells[0], 0, 40);
    // rasterContext.moveTo(cells[0].x + (fontWidth / 2), cells[0].y + (fontHeight / 2));
    // rasterContext.strokeStyle = "#333";
    // rasterContext.lineTo(cells[1].x + (fontWidth / 2), cells[1].y + (fontHeight / 2));
    // rasterContext.stroke();
    test = rasterLine(cells[0].x, cells[0].y, cells[1].x, cells[1].y);
    for (var i = 0; i < test.length; i++) {
      // rasterContext.strokeStyle="red";
      // rasterContext.rect(test[i].x * fontWidth, test[i].y * fontHeight, fontWidth, -(fontHeight) );
      rasterContext.clearRect(test[i].x * fontWidth, test[i].y * fontHeight, fontWidth, -fontHeight );
      rasterContext.fillText(char, test[i].x * fontWidth, test[i].y * fontHeight - 5);
      raster[test[i].y][test[i].x] = char;
    }

    cells.shift();

  }
}

var drawnow = false;
window.addEventListener('mousedown', drawing, false);
window.addEventListener('mouseup', drawing, false);
// window.addEventListener('resize', drawGrid, false);
// window.addEventListener('resize', drawRaster, false);
// window.addEventListener('resize', drawCursor, false);
window.addEventListener('resize', topBar, false);


function topBar() {
  var top = document.getElementById("controls").clientHeight + 1;
  gridCanvas.style.top = top + "px";
  rasterCanvas.style.top = top + "px";
  cursorCanvas.style.top = top + "px";
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
    var pos = getMousePos(rasterCanvas, e);
    posx = pos.x;
    posy = pos.y;

    gridx = snap(posx, fontWidth);
    gridy = snap(posy, fontHeight)
    rasterContext.clearRect(gridx, gridy, fontWidth, -fontHeight);
    // rasterContext.strokeStyle="red";
    // rasterContext.rect(gridx, gridy, fontWidth, -fontHeight);
    rasterContext.stroke();
    rasterContext.fillStyle = theme.foreground;
    rasterContext.font = "12pt Consolas";
    // rasterContext.fillRect(posx, posy, 4, 4);
    rasterContext.fillText(char, gridx, gridy - 5);
    cells = [];
  }
}


function fitToContainer(canvas) {
  // Make it visually fill the positioned parent
  // canvas.style.width ='100%';
  // canvas.style.height ='100%';
  // canvas.style.height='calc(100% - 32px)';
  // ...then set the internal size to match
  canvas.width  = canvas.offsetWidth;
  canvas.width  = charWidth * fontWidth + 1;
  canvas.height = canvas.offsetHeight;
  canvas.height = charHeight * fontHeight + 1;
  var top = document.getElementById("controls").clientHeight + 1 + "px";
  canvas.style.top = top;
  // alert(top);
  canvas.getContext("2d").translate(0.5, 0.5);

}

function drawGrid() {
  // var canvas = document.getElementById("grid");
  // var ctx = canvas.getContext("2d");

  // Canvas size.
  fitToContainer(gridCanvas);

  // Draw grid.
  gridContext.lineWidth = 1;
  gridContext.strokeStyle = theme.grid;
  for (var row = 0; row < gridCanvas.height; row += fontHeight) {
    gridContext.moveTo(0, row);
    gridContext.lineTo(gridCanvas.width, row);
    gridContext.stroke();
  }
  for (var col = 0; col < gridCanvas.width; col += fontWidth) {
    gridContext.moveTo(col, 0);
    gridContext.lineTo(col, gridCanvas.height);
    gridContext.stroke();
  }
}

function drawRaster() {

  // Canvas size.
  fitToContainer(rasterCanvas);

  // For some reason this is not remembered.
  rasterContext.lineWidth = 1;
  rasterContext.strokeStyle = theme.foreground;
  rasterContext.font = "12pt Consolas";

  // Draw grid.
  for (var col = 0; col < raster.length; col++) {
    for (var row = 0; row < raster[0].length; row++) {
      if (raster[col][row] != null) {
        rasterContext.fillText(raster[col][row], row * fontWidth, col * fontHeight - 5);
      }
    }
  }
}

function drawCursor() {

  fitToContainer(cursorCanvas);
  // rasterContext.translate(0.5, 0.5);
  cursorContext.beginPath();
  cursorContext.lineWidth = 1;
  cursorContext.strokeStyle = theme.cursor;
  cursorContext.rect(cursor.x * fontWidth, cursor.y * fontHeight, fontWidth, fontHeight);
  cursorContext.stroke();
  cursorContext.closePath();
  document.getElementById("cursorPos").innerHTML = "(" + cursor.x + ", " + cursor.y + ")";

}



function snap(pos, grid) {
  for (var i = 0; i < Math.max(gridCanvas.width, gridCanvas.height); i += grid) {
    if (pos <= i) {
      return i;
    }
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





function createArray(cols, rows) {
  var array = [];
  for (var i = 0; i < rows; i++) {
    array[i] = [];
    for (var col = 0; col < cols; col++) {
      array[i].push(null);
    }
  }
  return array;
}
