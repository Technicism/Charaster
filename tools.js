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
}

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
}

class Select extends Tool {
  keyDown(e) {
    var startStop = getStartStop(charaster.selectBegin, charaster.selectClose);
    for (var y = startStop[0].y; y < startStop[1].y; y++) {
      for (var x = startStop[0].x; x < startStop[1].x; x++) {
        charaster.clearCell(new Point(x, y));
      }
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
}

class Text extends Tool {
  keyDown(e) {
    super.keyDown(e);
    if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
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
    } else if (e.keyCode == 32) {
      charaster.moveCursorRelative(1, 0);   // Spacebar.
    }
  }

  keyPress(e) {
    super.keyPress(e);
    var cursor = Object.assign({}, charaster.cursor);
    charaster.setCell(new Cell(cursor));
    charaster.moveCursorRelative(1, 0);
  }

  mouseMove(e) {
    // Do not need.
  }

  mouseDown(e) {
    // Do not need.
  }
}

class Pencil extends Tool {
  mouseMove(e) {
    if (super.mouseMove(e)) {
      charaster.selectBegin = lineStart;
      charaster.selectClose = charaster.cursor;
      charaster.drawSelect();
    }
  }

  mouseDown(e) {
    super.mouseDown(e);
    lineStart = charaster.cursor;
    charaster.setCell(new Cell(charaster.cursor));
  }

  click(e) {
    super.click(e);
    charaster.setCell(new Cell(charaster.cursor));
  }
}

class Eraser extends Tool {
  click(e) {
    super.click(e);
    charaster.clearCell(charaster.cursor);
  }

  mouseDown(e) {
    super.mouseDown(e);
    charaster.clearCell(charaster.cursor);
  }
}

class Flood extends Tool {
  click(e) {
    super.click(e);
    var cell = charaster.getCell(charaster.cursor);
    var targetCell = cell.copy();
    rasterFlood(cell, targetCell, new Cell(charaster.cursor, charaster.character, charaster.foreground, charaster.background));
  }

  mouseDown(e) {
    // Do not need.
  }
}
