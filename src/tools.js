/**
 * Draw a line.
 * @extends Tool
 */
class Line extends Tool {
  mouseMove(e) {
    super.mouseMove(e);
    if (draw) {
      charaster.drawRaster("temp");
      var points = rasterLine(lineStart, charaster.cursor);
      for (var i = 0; i < points.length; i++) {
        charaster.setCell(new Cell(points[i]), charaster.rasterTempContext);
      }
    }
  }

  mouseDown(e) {
    super.mouseDown(e);
    lineStart = charaster.cursor;
    charaster.setCell(new Cell(charaster.cursor));
  }

  mouseUp(e) {
    super.mouseUp(e);
    if (draw) {
      var points = rasterLine(lineStart, charaster.cursor);
      charaster.drawRaster("temp");
      for (var i = 0; i < points.length; i++) {
        charaster.setCell(new Cell(points[i]));
      }
      endDraw();
      rasterHistory.add(charaster.raster);
    }
  }
}

/**
 * Draw a rectangle.
 * @extends Tool
 */
class Rectangle extends Tool {
  mouseMove(e) {
    super.mouseMove(e);
    if (draw) {
      charaster.drawRaster("temp");
      var points = rasterRectangle(lineStart, charaster.cursor);
      for (var i = 0; i < points.length; i++) {
        charaster.setCell(new Cell(points[i]), charaster.rasterTempContext);
      }
    }
  }

  mouseDown(e) {
    super.mouseDown(e);
    lineStart = charaster.cursor;
    charaster.setCell(new Cell(charaster.cursor));
  }

  mouseUp(e) {
    super.mouseUp(e);
    if (draw) {
      var points = rasterRectangle(lineStart, charaster.cursor);
      charaster.drawRaster("temp");
      for (var i = 0; i < points.length; i++) {
        charaster.setCell(new Cell(points[i]));
      }
      endDraw();
      rasterHistory.add(charaster.raster);
    }
  }
}

/**
 * Draw a rectangle with ASCII characters.
 * @extends Tool
 *
 * +-+ ┌─┐
 * | | │ │
 * +-+ └─┘
 */
class RectangleAscii extends Tool {
  mouseMove(e) {
    super.mouseMove(e);
    if (draw) {
      charaster.drawRaster("temp");
      this.drawCorneredRectangle();
    }
  }

  mouseDown(e) {
    super.mouseDown(e);
    lineStart = charaster.cursor;
    charaster.setCell(new Cell(charaster.cursor));
  }

  mouseUp(e) {
    super.mouseUp(e);
    if (draw) {
      var points = rasterRectangle(lineStart, charaster.cursor);
      charaster.drawRaster("temp");
      for (var i = 0; i < points.length; i++) {
        charaster.setCell(new Cell(points[i]));
      }
      endDraw();
      rasterHistory.add(charaster.raster);
    }
  }

  drawCorneredRectangle() {
    var p = lineStart;
    var q = charaster.cursor;
    var points = [];

    // Horizontal.
    points = [];
    points = points.concat(rasterLine(p, new Point(q.x, p.y)));  // Top.
    points = points.concat(rasterLine(new Point(p.x, q.y), q));  // Bottom.
    for (var i = 0; i < points.length; i++) {
      charaster.setCell(new Cell(points[i], "-"), charaster.rasterTempContext);
    }

    // Vertical.
    points = [];
    points = points.concat(rasterLine(new Point(q.x, p.y), q));  // Right.
    points = points.concat(rasterLine(p, new Point(p.x, q.y)));  // Left.
    for (var i = 0; i < points.length; i++) {
      charaster.setCell(new Cell(points[i], "|"), charaster.rasterTempContext);
    }

    // Corners.
    charaster.setCell(new Cell(new Point(q.x, p.y), "+"), charaster.rasterTempContext); // Top right.
    charaster.setCell(new Cell(new Point(p.x, q.y), "+"), charaster.rasterTempContext); // Bottom left.
    charaster.setCell(new Cell(p, "+"), charaster.rasterTempContext); // Top left.
    charaster.setCell(new Cell(q, "+"), charaster.rasterTempContext); // Bottom right.
  }
}

/**
 * Selection tool used for copy, cut and paste as well as deleting multiple cells.
 * @extends Tool
 */
class Select extends Tool {
  keyDown(e) {
    if (e.keyCode == 46) {  // Delete.
      clearSelectedCells();
      rasterHistory.add(charaster.raster);
    }
  }

  mouseMove(e) {
    super.mouseMove(e);
    if (draw) {
      charaster.selectBegin = lineStart;
      charaster.selectClose = charaster.cursor;
      charaster.drawSelect();
    }
  }

  mouseDown(e) {
    super.mouseDown(e);
    lineStart = charaster.cursor;
  }

  click(e) {
    charaster.selectBegin = lineStart;
    charaster.selectClose = charaster.cursor;
    charaster.drawSelect();
  }

  mouseUp(e) {
    super.mouseUp(e);
    endDraw();
  }

  copy(e) {
    var clipboard = document.getElementById("clipboard");
    clipboard.innerHTML = "";
    charaster.clipboard = [];
    var startStop = getStartStop(charaster.selectBegin, charaster.selectClose);
    for (var y = startStop[0].y; y < startStop[1].y; y++) {
      for (var x = startStop[0].x; x < startStop[1].x; x++) {
        var cell = charaster.getCell(new Point(x, y)).copy();
        charaster.clipboard.push(cell);
        if (cell.character == null) {
          clipboard.innerHTML += " ";
        } else {
          clipboard.innerHTML += cell.character;
        }
      }
      clipboard.innerHTML += "\n";
    }
    clipboard.focus();
    clipboard.select();
  }

  cut(e) {
    this.copy(null);  // TODO fix problem where does not paste cut raw text
    clearSelectedCells();
    rasterHistory.add(charaster.raster);
  }

  finish() {
    charaster.selectContext.clearRect(-1, -1, charaster.selectCanvas.width, charaster.selectCanvas.height);
  }
}

/**
 * Write text.
 * @extends Tool
 */
class Text extends Tool {
  keyDown(e) {
    super.keyDown(e);
    if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();                   // Stop arrow keys panning.
    }
    if (e.keyCode == 39 && charaster.cursor.x < charaster.gridWidth - 1) {
      charaster.moveCursorRelative(1, 0);   // Move right.
    } else if (e.keyCode == 40 && charaster.cursor.y < charaster.gridHeight - 1) {
      charaster.moveCursorRelative(0, 1);   // Move down.
    } else if (e.keyCode == 37 && charaster.cursor.x > 0) {
      charaster.moveCursorRelative(-1, 0);  // Move left.
    } else if (e.keyCode == 38 && charaster.cursor.y > 0) {
      charaster.moveCursorRelative(0, -1);  // Move up.
    } else if (e.keyCode == 8) {
      charaster.moveCursorRelative(-1, 0);  // Backspace.
      charaster.clearCell(charaster.cursor);
      rasterHistory.add(charaster.raster);
    } else if (e.keyCode == 32) {
      charaster.moveCursorRelative(1, 0);   // Spacebar.
    }

    // Enter.
    if (charaster.cursor.y > charaster.selectBegin.y) {
      charaster.selectBegin.y = charaster.cursor.y;
    }
    if (e.keyCode == 13) {
      charaster.selectBegin.y++;
      charaster.moveCursor(charaster.selectBegin.x, charaster.selectBegin.y);
    }
    autoScroll();
  }

  keyPress(e) {
    super.keyPress(e);
    var cursor = charaster.cursor.copy();
    charaster.setCell(new Cell(cursor));

    // Make sure within raster.
    if (charaster.cursor.x < charaster.gridWidth - 1) {
      charaster.moveCursorRelative(1, 0);
    } else if (charaster.cursor.y < charaster.gridHeight - 1) {
      charaster.moveCursor(0, charaster.cursor.y + 1);
    }
    rasterHistory.add(charaster.raster);
    autoScroll();
  }

  mouseMove(e) {
    // Do not need.
  }

  mouseDown(e) {
    // Do not need.
  }

  click(e) {
    super.click(e);
    charaster.selectBegin = charaster.cursor.copy();
  }

  apply() {
    charaster.selectBegin = charaster.cursor.copy();
  }

}

/**
 * Draw freehand.
 * @extends Tool
 */
class Pencil extends Tool {
  mouseMove(e) {
    super.mouseMove(e)
    if (draw) {
      interpolate(new Cell(charaster.cursor, charaster.character));
    }
  }

  mouseDown(e) {
    super.mouseDown(e);
    lineStart = charaster.cursor;
    charaster.setCell(new Cell(charaster.cursor));
  }

  mouseUp(e) {
    if (draw) {
      super.mouseUp(e);
      endDraw();
      rasterHistory.add(charaster.raster);
    }
  }
}

/**
 * Erase freehand.
 * @extends Tool
 */
class Eraser extends Tool {
  mouseDown(e) {
    super.mouseDown(e);
    charaster.clearCell(charaster.cursor);
  }

  mouseUp(e) {
    if (draw) {
      super.mouseUp(e);
      endDraw();
      rasterHistory.add(charaster.raster);
    }
  }

  mouseMove(e) {
    super.mouseMove(e)
    if (draw) {
      charaster.selectBegin = lineStart;
      charaster.selectClose = charaster.cursor;
      charaster.drawSelect();
      interpolate(new Cell(charaster.cursor, null));
    }
  }
}

/**
 * Bucked flood fill.
 * @extends Tool
 */
class Flood extends Tool {
  click(e) {
    super.click(e);
    var cell = charaster.getCell(charaster.cursor);
    var targetCell = cell.copy();
    rasterFlood(cell, targetCell, new Cell(charaster.cursor, charaster.character, charaster.foregroundId, charaster.backgroundId, charaster.bold, charaster.italic, charaster.underline));
    charaster.drawAll();
  }

  mouseDown(e) {
    // Do not need.
  }
}

/**
 * Change the current cell to that picked from the raster.
 * @extends Tool
 */
class Picker extends Tool {
  click(e) {
    super.click(e);
    var cell = charaster.getCell(charaster.cursor);
    console.log(cell);

    // TODO set as whole cell that takes into account preview too instead of this:
    charaster.character = cell.character;
    charaster.preview.value = cell.character;
    charaster.foregroundId = cell.foregroundId;
    charaster.backgroundId = cell.backgroundId;
    charaster.foreground = cell.foreground;
    charaster.background = cell.background;
    charaster.preview.style.color = cell.foreground;
    charaster.preview.style.background = cell.background;
    charaster.bold = cell.bold;
    charaster.italic = cell.italic;
    if (charaster.bold) {
      charaster.preview.style.fontWeight = "bold";
    } else {
      charaster.preview.style.fontWeight = "normal";
    }
    if (charaster.italic) {
      charaster.preview.style.fontStyle = "italic";
    } else {
      charaster.preview.style.fontStyle = "normal";
    }
  }

  mouseDown(e) {
    // Do not need.
  }
}
