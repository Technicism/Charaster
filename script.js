var theme = charaster.theme;

charaster.gridCanvas = document.getElementById("grid");
charaster.gridContext = charaster.gridCanvas.getContext("2d");
charaster.rasterCanvas = document.getElementById("raster");
charaster.rasterContext = charaster.rasterCanvas.getContext("2d");
charaster.cursorCanvas = document.getElementById("cursor");
charaster.cursorContext = charaster.cursorCanvas.getContext("2d");

function drawGrid(canvas, context) {
  fitToContainer(canvas);
  context.strokeStyle = theme.grid;
  context.beginPath();
  for (var row = 0; row < canvas.height; row += fontHeight) {
    context.moveTo(0, row);
    context.lineTo(canvas.width, row);
    context.stroke();
  }
  for (var col = 0; col < canvas.width; col += fontWidth) {
    context.moveTo(col, 0);
    context.lineTo(col, canvas.height);
    context.stroke();
  }
  context.closePath();
}

function drawRaster(canvas, context) {
  fitToContainer(canvas);
  context.strokeStyle = theme.foreground;
  context.font = "12pt Consolas";
  context.beginPath();
  for (var col = 0; col < raster.length; col++) {
    for (var row = 0; row < raster[0].length; row++) {
      if (raster[col][row] != null) {
        context.fillText(raster[col][row], row * fontWidth, col * fontHeight - 5);
      }
    }
  }
  context.closePath();
}

function drawCursor(canvas, context) {
  fitToContainer(canvas);
  context.beginPath();
  context.strokeStyle = theme.cursor;
  context.rect(cursor.x * fontWidth, cursor.y * fontHeight, fontWidth, fontHeight);
  context.stroke();
  context.closePath();
  document.getElementById("cursorPos").innerHTML = "(" + cursor.x + ", " + cursor.y + ")";
}



var char = "o";
var fontHeight = 19;
var fontWidth = 9;
var gridWidth = 120;
var gridHeight = 40;
var raster = createRaster(gridWidth, gridHeight);


var cursor = new Cell(0, 0);

var body = document.getElementById("body");
var controls = document.getElementById("controls");
var info = document.getElementById("info");
var bars = document.getElementsByClassName("bar");
var foreground = document.getElementById("foreground");

setTheme(theme.name);
drawRaster(charaster.rasterCanvas, charaster.rasterContext);
drawCursor(charaster.cursorCanvas, charaster.cursorContext);
drawGrid(charaster.gridCanvas, charaster.gridContext);


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
  charaster.cursorContext.clearRect(cursor.x * fontWidth, cursor.y * fontHeight, fontWidth, -fontHeight);
  cursor.x = x;
  cursor.y = y;
  drawCursor(charaster.cursorCanvas, charaster.cursorContext);
}

function onKeyDown(e) {

  // Move cursor with arrow keys.
  charaster.cursorContext.clearRect(cursor.x * fontWidth, cursor.y * fontHeight, fontWidth, -fontHeight);
  if (e.keyCode == 39 && cursor.x < gridWidth) {
    cursor.x++;
  } else if (e.keyCode == 40 && cursor.y < gridHeight) {
    cursor.y++;
  } else if (e.keyCode == 37 && cursor.x > 0) {
    cursor.x--;
  } else if (e.keyCode == 38 && cursor.y > 0) {
    cursor.y--;
  }
  drawCursor(charaster.cursorCanvas, charaster.cursorContext);
  if (e.keyCode == 65) {
    // toggleDarkMode();
    setTheme("test");
  }
}

function setTheme(name) {

  // Set the colors of the page.
  body.style.background = theme.background;
  controls.style.background = theme.bar;
  controls.style.borderColor = theme.barBorder;
  info.style.background = theme.bar;
  info.style.borderColor = theme.barBorder;
  icons = document.getElementsByClassName("icon");
  for (var i = 0; i < icons.length; i++) {
    icons[i].style.fill = theme.icon;
  }
  iconStrokes = document.getElementsByClassName("iconStroke");
  for (var i = 0; i < iconStrokes.length; i++) {
    iconStrokes[i].style.stroke = theme.icon;
  }
  for (var i = 0; i < bars.length; i++) {
    bars[i].style.borderColor = theme.barBorder;
  }

  // Set the colors of the tools.
  for (var i = 0; i < theme.colors.length; i++) {
    var color = document.createElement('option');
    color.value = i;
    color.innerHTML = i;
    color.style.backgroundColor = theme.colors[i];
    foreground.appendChild(color);
  }
}

function setChar(char, x, y) {
  charaster.rasterContext.clearRect(cursor.x * fontWidth, (cursor.y + 1) * fontHeight, fontWidth, -fontHeight);
  charaster.rasterContext.fillText(char, x * fontWidth, (y + 1) * fontHeight - 5);
  // raster[y][x] = char;
}


var cells = [];
function draw(e) {

  var pos = getMousePos(charaster.rasterCanvas, e);
  var gridx = snap(pos.x, fontWidth);
  var gridy = snap(pos.y, fontHeight);

  charaster.cursorContext.clearRect(-1, -1, 1000, 1000);
  charaster.cursorContext.beginPath();
  charaster.cursorContext.lineWidth = 1;
  charaster.cursorContext.strokeStyle = theme.cursor;
  charaster.cursorContext.rect(gridx, gridy, -fontWidth, -fontHeight);
  charaster.cursorContext.stroke();
  charaster.cursorContext.closePath();



  if (!drawnow) {
    return;
  }
  // charaster.rasterContext.clearRect(gridx, gridy, fontWidth, -fontHeight);

  // charaster.rasterContext.strokeStyle="red";
  // charaster.rasterContext.rect(gridx, gridy, fontWidth, -fontHeight);
  charaster.rasterContext.stroke();
  charaster.rasterContext.fillStyle = getColor("foreground");
  charaster.rasterContext.font = "12pt Consolas";
  // charaster.rasterContext.fillRect(posx, posy, 4, 4);
  charaster.rasterContext.fillText(char, gridx - fontWidth, gridy - 5);
  raster[Math.floor(gridy / fontHeight)][Math.floor(gridx / fontWidth)] = char;
  cells.push({x:(Math.floor(gridx / fontWidth)), y:Math.floor(gridy / fontHeight)});
  // cells.push(gridy);

  if (cells.length >= 2) {
    // charaster.rasterContext.clearRect(0, 30, 1000, 20);
    // charaster.rasterContext.fillText(cells[0], 0, 40);
    // charaster.rasterContext.moveTo(cells[0].x + (fontWidth / 2), cells[0].y + (fontHeight / 2));
    // charaster.rasterContext.strokeStyle = "#333";
    // charaster.rasterContext.lineTo(cells[1].x + (fontWidth / 2), cells[1].y + (fontHeight / 2));
    // charaster.rasterContext.stroke();
    test = rasterLine(cells[0].x, cells[0].y, cells[1].x, cells[1].y);
    for (var i = 0; i < test.length; i++) {
      // charaster.rasterContext.strokeStyle="red";
      // charaster.rasterContext.rect(test[i].x * fontWidth, test[i].y * fontHeight, fontWidth, -(fontHeight) );
      charaster.rasterContext.clearRect(test[i].x * fontWidth - fontWidth, test[i].y * fontHeight, fontWidth, -fontHeight );
      charaster.rasterContext.fillText(char, test[i].x * fontWidth - fontWidth, test[i].y * fontHeight - 5);
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


function getColor(control) {
  var value = document.getElementById(control).value;
  if (value == "foreground") {
    return theme.foreground;
  } else {
    return theme.colors[value];
  }
}

function topBar() {
  var top = document.getElementById("controls").clientHeight + 1;
  charaster.gridCanvas.style.top = top + "px";
  charaster.rasterCanvas.style.top = top + "px";
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
    charaster.rasterContext.fillText(char, gridx - fontWidth, gridy - 5);
    cells = [];
  }
}


function fitToContainer(canvas) {
  canvas.width  = canvas.offsetWidth;
  canvas.width  = gridWidth * fontWidth + 1;
  canvas.height = canvas.offsetHeight;
  canvas.height = gridHeight * fontHeight + 1;
  canvas.style.top = document.getElementById("controls").clientHeight + 1 + "px";
  canvas.getContext("2d").translate(0.5, 0.5);
}








function snap(pos, grid) {
  for (var i = 0; i < Math.max(charaster.rasterCanvas.width, charaster.rasterCanvas.height); i += grid) {
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





function createRaster(cols, rows) {
  var array = [];
  for (var i = 0; i < rows; i++) {
    array[i] = [];
    for (var col = 0; col < cols; col++) {
      array[i].push(null);
    }
  }
  document.getElementById("gridSize").innerHTML = "[" + gridWidth + ", " + gridHeight + "]";
  return array;
}
