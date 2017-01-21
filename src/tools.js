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
    }
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

  mouseUp(e) {
    super.mouseUp(e);
    if (draw) {
      var points = rasterRectangle(lineStart, charaster.cursor);
      charaster.drawRaster("temp");
      for (var i = 0; i < points.length; i++) {
        charaster.setCell(new Cell(points[i]));
      }
      endDraw();
    }
  }
}

class Select extends Tool {
  keyDown(e) {
    if (e.keyCode == 46) {  // Delete.
      var startStop = getStartStop(charaster.selectBegin, charaster.selectClose);
      for (var y = startStop[0].y; y < startStop[1].y; y++) {
        for (var x = startStop[0].x; x < startStop[1].x; x++) {
          charaster.clearCell(new Point(x, y));
        }
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

    // Enter.
    if (charaster.cursor.y > charaster.selectBegin.y) {
      charaster.selectBegin.y = charaster.cursor.y;
    }
    if (e.keyCode == 13) {
      charaster.selectBegin.y++;
      charaster.moveCursor(charaster.selectBegin.x, charaster.selectBegin.y);
    }
  }

  keyPress(e) {
    super.keyPress(e);
    var cursor = Object.assign({}, charaster.cursor);
    charaster.setCell(new Cell(cursor));
    charaster.moveCursorRelative(1, 0);
    rasterHistory.add(charaster.raster);
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

  click(e) {
    super.click(e);
    charaster.setCell(new Cell(charaster.cursor));
    rasterHistory.add(charaster.raster);
  }

  mouseUp(e) {
    super.mouseUp(e);
    endDraw();
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

  mouseUp(e) {
    super.mouseUp(e);
    endDraw();
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
