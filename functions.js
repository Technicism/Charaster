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
  if (a == null && b == null) {
    return true;
  } else if (a == null || b == null) {
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
    button.style.fill = charaster.theme.icon;
    button.style.background = "none";
    button.style.color = charaster.theme.icon;
  }
  if (button.getElementsByClassName("icon")[0] != null) {
    if (active) {
      button.getElementsByClassName("icon")[0].style.fill = charaster.theme.iconActiveText;
    } else {
      button.getElementsByClassName("icon")[0].style.fill = charaster.theme.icon;
    }
  }
  if (button.getElementsByClassName("iconStroke")[0] != null) {
    if (active) {
      button.getElementsByClassName("iconStroke")[0].style.stroke = charaster.theme.iconActiveText;
    } else {
      button.getElementsByClassName("iconStroke")[0].style.stroke = charaster.theme.icon;
    }
  }
}
