"use strict";

// When a button is clicked change the mode and visual style of it.
function buttonMode(id, mode, activate) {
  var button = document.getElementById(id);
  button.addEventListener("click", function(e) {

    // Reset other button styles.
    var reset = document.getElementsByClassName("tools");
    for (var i = 0; i < reset.length; i++) {
      buttonStyle(reset[i].id, false);
    }

    // Apply style to current button to indicate it is selected.
    buttonStyle(id, true);

    // Apply new mode.
    if (charaster.mode == "TEXT" && (mode == "PENCIL") || mode == "ERASER") {
      charaster.prevCursor = charaster.cursor;
      charaster.drawCursor();
    }
    if ((charaster.mode == "PENCIL" || charaster.mode == "ERASER") && mode == "TEXT") {
      charaster.cursor = charaster.prevCursor;
      charaster.drawCursor();
    }
    charaster.mode = mode;

    // TODO replace this.
    if (mode == "SELECT") {
      charaster.tool = charaster.tools.select;
    } else if (mode == "TEXT") {
      charaster.tool = charaster.tools.text;
    } else if (mode == "PENCIL") {
      charaster.tool = charaster.tools.pencil;
    } else if (mode == "LINE") {
      charaster.tool = charaster.tools.line;
    } else if (mode == "RECTANGLE") {
      charaster.tool = charaster.tools.rectangle;
    } else if (mode == "ERASER") {
      charaster.tool = charaster.tools.eraser;
    } else if (mode == "FLOOD") {
      charaster.tool = charaster.tools.flood;
    }
  }, false);

  // Buttons may start off styled activated.
  if (activate) {
    buttonStyle(id, true);
  }
}

function buttonCell(id, activate) {
  var button = document.getElementById(id);
  button.addEventListener("click", function(e) {

    // Apply new property and style to current button to indicate it is selected or not.
    if (id == "boldCell") {
      charaster.bold = !charaster.bold;
      buttonStyle(id, charaster.bold);
    } else if (id == "italicCell") {
      charaster.italic = !charaster.italic;
      buttonStyle(id, charaster.italic);
    } else if (id == "foregroundCell") {
      charaster.foregroundEnabled = !charaster.foregroundEnabled;
      buttonStyle(id, charaster.foregroundEnabled);
    } else if (id == "backgroundCell") {
      charaster.backgroundEnabled = !charaster.backgroundEnabled;
      buttonStyle(id, charaster.backgroundEnabled);
    } else if (id == "characterCell") {
      charaster.characterEnabled = !charaster.characterEnabled;
      buttonStyle(id, charaster.characterEnabled);
    }
  }, false);

  // Buttons may start off styled activated.
  if (activate) {
    buttonStyle(id, true);
  }
}

window.addEventListener("load", function(e) {

  // Setup raster.
  measureCharacter(charaster.font);
  charaster.preview.value = charaster.character;
  for (var i = 0; i < charaster.theme.colors.length; i++) {
    charaster.colors.push(document.getElementById("color" + (i + 1)));
  }
  charaster.resetRaster(charaster.gridWidth, charaster.gridHeight);
  zoom(charaster.defaultFontSize);

  // Apply events to color buttons.
  for (var i = 0; i < charaster.colors.length; i++) {

    // Left click to apply colour to foreground.
    charaster.colors[i].addEventListener("click", function(e) {
      var index = e.target.id.replace("color", "") - 1;
      charaster.foreground = charaster.theme.colors[index];
      charaster.foregroundId = index + 1;
      charaster.preview.style.color = charaster.theme.colors[index];
    }, false);

    // Right click to apply colour to background.
    charaster.colors[i].addEventListener("contextmenu", function(e) {
      e.preventDefault();
      var index = e.target.id.replace("color", "") - 1;
      charaster.background = charaster.theme.colors[index];
      charaster.backgroundId = index + 1;
      charaster.preview.style.backgroundColor = charaster.theme.colors[index];
    }, false);
  }

  // Theme list.
  var list = document.getElementById("themeList");
  for (var key in charaster.themes) {
    var theme = document.createElement("li");
    theme.appendChild(document.createTextNode(charaster.themes[key].name));
    list.appendChild(theme);
    theme.addEventListener("click", function(e) {
      charaster.theme = charaster.themes[e.target.innerHTML];
      charaster.applyTheme();
      document.getElementById("themeList").style.visibility = "hidden";
    }, false);
  }
  charaster.applyTheme();

  // Setup mode buttons (one mode at a time).
  buttonMode("textMode", "TEXT", false);
  buttonMode("eraserMode", "ERASER", false);
  buttonMode("pencilMode", "PENCIL", true);
  buttonMode("lineMode", "LINE", false);
  buttonMode("rectangleMode", "RECTANGLE", false);
  buttonMode("floodMode", "FLOOD", false);
  buttonMode("selectMode", "SELECT", false);

  // Setup property buttons (multiple properties allowed at a time).
  buttonCell("boldCell", charaster.bold);
  buttonCell("italicCell", charaster.italic);
  buttonCell("characterCell", charaster.characterEnabled);
  buttonCell("foregroundCell", charaster.foregroundEnabled);
  buttonCell("backgroundCell", charaster.backgroundEnabled);
}, false);

// Left click to reset foreground.
charaster.noColor.addEventListener("click", function(e) {
  charaster.foreground = charaster.theme.foreground;
  charaster.foregroundId = "foreground";
  charaster.preview.style.color = charaster.theme.foreground;
}, false);

// Right click to reset background.
charaster.noColor.addEventListener("contextmenu", function(e) {
  e.preventDefault();
  charaster.background = charaster.theme.background;
  charaster.backgroundId = "background";
  charaster.preview.style.backgroundColor = charaster.theme.background;
}, false);

window.addEventListener("keydown", function(e) {
  if (e.keyCode == 32) {
    e.preventDefault(); // Stop space scrolling.
  }
  charaster.tool.keyDown(e);
}, false);

window.addEventListener("keypress", function(e) {
  if([13].indexOf(e.keyCode) > -1) {
    return; // Stop enter/return.
  }
  charaster.tool.keyPress(e);
}, false);

charaster.cursorCanvas.addEventListener("mousemove", function(e) {
  charaster.tool.mouseMove(e);
  if (!draw) {
    return;
  }
  if (charaster.mode == "PENCIL" || charaster.mode == "ERASER" || charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {
    var cell = new Cell(charaster.cursor, charaster.character);
    if (charaster.mode == "LINE" || charaster.mode == "RECTANGLE") {

    } else if (drawList.length >= 1 && !drawList[drawList.length - 1].equalForDraw(cell)) {
      drawList.push(cell);
      if (drawList.length >= 2) {
        var line = rasterLine(drawList[0].point, drawList[1].point);

        // Draw lines between cells.
        for (var i = 0; i < line.length; i++) {
          if (charaster.mode == "PENCIL") {
            charaster.setCell(new Cell(line[i]));
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
}, false);

charaster.cursorCanvas.addEventListener("mouseleave", function(e) {
  charaster.tool.mouseLeave(e);
}, false);

charaster.cursorCanvas.addEventListener("click", function(e) {
  charaster.tool.click(e);
}, false);

charaster.cursorCanvas.addEventListener("mousedown", function(e) {
  if (e.which != 1) { // Only draw with left mouse button.
    return;
  }
  charaster.tool.mouseDown(e);
}, false);

window.addEventListener("mouseup", function(e) {
  charaster.tool.mouseUp(e);
}, false);


charaster.cursorCanvas.addEventListener("contextmenu", function(e) {
  e.preventDefault(); // Stop right click menu on canvas.
}, false);

document.getElementById("boldCell").addEventListener("click", function(e) {
  if (charaster.bold) {
    charaster.preview.style.fontWeight = "bold";
  } else {
    charaster.preview.style.fontWeight = "normal";
  }
}, false);

document.getElementById("italicCell").addEventListener("click", function(e) {
  if (charaster.italic) {
    charaster.preview.style.fontStyle = "italic";
  } else {
    charaster.preview.style.fontStyle = "normal";
  }
}, false);

document.getElementById("underlineCell").addEventListener("click", function(e) {

}, false);

document.getElementById("saveButton").addEventListener("click", function(e) {
  var list = document.getElementById("saveList");
  if (list.style.visibility != "visible") {
    var rect = e.target.getBoundingClientRect();
    list.style.visibility = "visible";
    list.style.left = rect.left + "px";
    list.style.top = rect.top + 32 + "px";
    list.style.visibility = "visible";
  } else {
    list.style.visibility = "hidden";
  }
}, false);

document.getElementById("saveBash").addEventListener("click", function(e) {
  var lines = saveShell();
  var blob = new Blob([lines], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "charaster.sh");
}, false);

document.getElementById("savePlain").addEventListener("click", function(e) {
  var lines = saveText();
  var blob = new Blob([lines], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "charaster.txt");
}, false);

document.getElementById("saveImage").addEventListener("click", function(e) {
  charaster.rasterCanvas.toBlob(function(blob) {
      saveAs(blob, "charaster.png");
  });
}, false);

window.addEventListener("keyup", function(e) {

  // Paste: Ctrl + V = text, Ctrl + Shift + V = cell.
  if (e.ctrlKey && e.keyCode == 86) {
    if (e.shiftKey) {
      pasteCell(charaster.clipboard);
    } else {
      pasteText(document.getElementById("clipboardPaste").innerHTML);
    }
  }
}, false);

window.addEventListener("copy", function(e) {
  charaster.tool.copy(e);
}, false);

window.addEventListener("paste", function(e) {
  e.preventDefault();
  window.focus();

  // Get raw text from clipboard.
  e.stopPropagation();
  var clipboardData = e.clipboardData || window.clipboardData;
  var text = clipboardData.getData("Text");
  document.getElementById("clipboardPaste").innerHTML = text;
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

document.getElementById("gridSize").addEventListener("click", function(e) {
  charaster.gridHeight++;
  charaster.drawAll();
}, false);

charaster.themeSelect.addEventListener("click", function(e) {
  var list = document.getElementById("themeList");
  if (list.style.visibility != "visible") {
    var rect = charaster.themeSelect.getBoundingClientRect();
    list.style.visibility = "visible";
    list.style.left = rect.left + "px";
    list.style.top = rect.top + 24 + "px";
    list.style.visibility = "visible";
  } else {
    list.style.visibility = "hidden";
  }
}, false);
