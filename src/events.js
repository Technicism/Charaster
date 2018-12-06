"use strict";

/**
 * When a button is clicked change the tool and visual style of it.
 *
 * @param   {String}  id
 * @param   {Tool}    tool - the is represented by this button.
 * @param   {Boolean} activate
 */
function buttonMode(id, tool, activate) {
  var button = document.getElementById(id);
  button.addEventListener("click", function(e) {

    // Reset other button styles.
    var reset = document.getElementsByClassName("tools");
    for (var i = 0; i < reset.length; i++) {
      buttonStyle(reset[i].id, false);
    }

    // Apply style to current button to indicate it is selected.
    buttonStyle(id, true);

    // Text tool has independent cursor.
    if (charaster.tool.name == charaster.tools.text.name && tool.name != charaster.tools.text.name) {
      charaster.prevCursor = charaster.cursor;
      charaster.drawCursor();
    }
    if (charaster.tool.name != charaster.tools.text.name && tool.name == charaster.tools.text.name) {
      charaster.cursor = charaster.prevCursor;
      charaster.drawCursor();
    }

    // Apply new tool.
    charaster.tool.finish();
    charaster.tool = tool;
    charaster.tool.apply();
  }, false);

  // Buttons may start off styled activated.
  if (activate) {
    buttonStyle(id, true);
  }
}

/**
 * When a button is clicked change the cell property and visual style of it.
 *
 * @param   {String}  id
 * @param   {Boolean} activate
 */
function buttonCell(id, activate) {
  var button = document.getElementById(id);
  button.addEventListener("click", function(e) {

    // Apply new property and style to current button to indicate it is selected or not.
    if (id == "boldCell") {
      charaster.bold = !charaster.bold;
      buttonStyle(id, charaster.bold);
      if (charaster.bold) {
        charaster.preview.style.fontWeight = "bold";
      } else {
        charaster.preview.style.fontWeight = "normal";
      }
    } else if (id == "italicCell") {
      charaster.italic = !charaster.italic;
      buttonStyle(id, charaster.italic);
      if (charaster.italic) {
        charaster.preview.style.fontStyle = "italic";
      } else {
        charaster.preview.style.fontStyle = "normal";
      }
    } else if (id == "underlineCell") {
      charaster.underline = !charaster.underline;
      buttonStyle(id, charaster.underline);
      if (charaster.underline) {
        charaster.preview.style.textDecoration = "underline";
      } else {
        charaster.preview.style.textDecoration = "none";
      }
    } else if (id == "foregroundCell") {
      charaster.foregroundEnabled = !charaster.foregroundEnabled;
      buttonStyle(id, charaster.foregroundEnabled);
    } else if (id == "backgroundCell") {
      charaster.backgroundEnabled = !charaster.backgroundEnabled;
      buttonStyle(id, charaster.backgroundEnabled);
    } else if (id == "characterCell") {
      charaster.characterEnabled = !charaster.characterEnabled;
      buttonStyle(id, charaster.characterEnabled);
    } else if (id == "gridToggleIcon") {
      charaster.gridEnabled = !charaster.gridEnabled;
      buttonStyle(id, charaster.gridEnabled);
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
  for (var i = 0; i < currentTheme.colors.length; i++) {
    charaster.colors.push(document.getElementById("color" + (i + 1)));
  }
  charaster.resetRaster();
  zoom(charaster.defaultFontSize);

  // Apply events to color buttons.
  for (var i = 0; i < charaster.colors.length; i++) {

    // Left click to apply colour to foreground.
    charaster.colors[i].addEventListener("click", function(e) {
      var index = e.target.id.replace("color", "") - 1;
      charaster.foreground = currentTheme.colors[index];
      charaster.foregroundId = index + 1;
      charaster.preview.style.color = currentTheme.colors[index];
    }, false);

    // Right click to apply colour to background.
    charaster.colors[i].addEventListener("contextmenu", function(e) {
      e.preventDefault();
      var index = e.target.id.replace("color", "") - 1;
      charaster.background = currentTheme.colors[index];
      charaster.backgroundId = index + 1;
      charaster.preview.style.backgroundColor = currentTheme.colors[index];
    }, false);
  }

  // Theme list.
  var list = document.getElementById("themeList");
  for (var key in themes) {
    var theme = document.createElement("li");
    theme.appendChild(document.createTextNode(themes[key].name));
    list.appendChild(theme);
    theme.addEventListener("click", function(e) {
      currentTheme = themes[e.target.innerHTML];
      charaster.applyTheme();
      document.getElementById("themeList").style.visibility = "hidden";
    }, false);
  }
  charaster.applyTheme();

  // Setup mode buttons (one mode at a time).
  buttonMode("textMode", charaster.tools.text, false);
  buttonMode("eraserMode", charaster.tools.eraser, false);
  buttonMode("pickerMode", charaster.tools.picker, false);
  buttonMode("pencilMode", charaster.tools.pencil, true);
  buttonMode("lineMode", charaster.tools.line, false);
  buttonMode("rectangleMode", charaster.tools.rectangle, false);
  buttonMode("floodMode", charaster.tools.flood, false);
  buttonMode("selectMode", charaster.tools.select, false);

  // Setup property buttons (multiple properties allowed at a time).
  buttonCell("boldCell", charaster.bold);
  buttonCell("italicCell", charaster.italic);
  buttonCell("underlineCell", charaster.underline);
  buttonCell("characterCell", charaster.characterEnabled);
  buttonCell("foregroundCell", charaster.foregroundEnabled);
  buttonCell("backgroundCell", charaster.backgroundEnabled);

  // Other buttons.
  buttonCell("gridToggleIcon", true);
}, false);

// Left click to reset foreground.
charaster.noColor.addEventListener("click", function(e) {
  charaster.foreground = currentTheme.foreground;
  charaster.foregroundId = "foreground";
  charaster.preview.style.color = currentTheme.foreground;
}, false);

// Right click to reset background.
charaster.noColor.addEventListener("contextmenu", function(e) {
  e.preventDefault();
  charaster.background = currentTheme.background;
  charaster.backgroundId = "background";
  charaster.preview.style.backgroundColor = currentTheme.background;
}, false);

window.addEventListener("keydown", function(e) {
  if (e.target.tagName == "INPUT") {
    return; // Do not interfere with manual character entering.
  }
  if (e.keyCode == 32) {
    e.preventDefault(); // Stop space scrolling.
  }
  charaster.tool.keyDown(e);
}, false);

window.addEventListener("keypress", function(e) {
  if (e.target.tagName == "INPUT") {
    return; // Do not interfere with manual character entering.
  }
  if([13].indexOf(e.keyCode) > -1) {
    return; // Stop enter/return.
  }
  if (e.ctrlKey) {
    return; // Stop shortcuts.
  }
  charaster.tool.keyPress(e);
}, false);

charaster.preview.addEventListener("change", function(e) {
  charaster.character = charaster.preview.value;
}, false);

charaster.cursorCanvas.addEventListener("mousemove", function(e) {
  charaster.tool.mouseMove(e);
}, false);

charaster.cursorCanvas.addEventListener("mouseleave", function(e) {
  charaster.tool.mouseLeave(e);
}, false);

window.addEventListener("click", function(e) {
  if (e.target.tagName != "LI" && e.target.tagName != "INPUT" ) {
    hideLists();
  }
  if (e.target.tagName != "CANVAS") {
    return; // Do not interfere with clicking buttons.
  }
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

document.getElementById("saveButton").addEventListener("click", function(e) {
  e.stopPropagation();
  var list = document.getElementById("saveList");
  hideLists(list.id);
  if (list.style.visibility != "visible") {
    var rect = e.target.getBoundingClientRect();
    list.style.visibility = "visible";
    list.style.left = rect.left + "px";
    list.style.top = rect.top + 38 + "px";
    list.style.visibility = "visible";
  } else {
    list.style.visibility = "hidden";
  }
}, false);

document.getElementById("saveBash").addEventListener("click", function(e) {
  var lines = saveShell(charaster.raster);
  var blob = new Blob([lines], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "charaster.sh");
  hideLists();
}, false);

document.getElementById("savePlain").addEventListener("click", function(e) {
  var lines = savePlain(charaster.raster);
  var blob = new Blob([lines], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "charaster.txt");
  hideLists();
}, false);

document.getElementById("saveImage").addEventListener("click", function(e) {
  charaster.rasterCanvas.toBlob(function(blob) {
    saveAs(blob, "charaster.png");
  });
  hideLists();
}, false);

document.getElementById("saveJson").addEventListener("click", function(e) {
  var string = JSON.stringify(charaster.raster);
  var blob = new Blob([string], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "charaster.json");
  hideLists();
}, false);

document.getElementById("openJson").addEventListener("click", function(e) {
  openMode = "json";
  document.getElementById("upload").click(e);
  hideLists();
}, false);

document.getElementById("openPlain").addEventListener("click", function(e) {
  openMode = "plain";
  document.getElementById("upload").click(e);
  hideLists();
}, false);

document.getElementById("openButton").addEventListener("click", function(e) {
  e.stopPropagation();
  var list = document.getElementById("openList");
  hideLists(list.id);
  if (list.style.visibility != "visible") {
    var rect = e.target.getBoundingClientRect();
    list.style.visibility = "visible";
    list.style.left = rect.left + "px";
    list.style.top = rect.top + 38 + "px";
    list.style.visibility = "visible";
  } else {
    list.style.visibility = "hidden";
  }
}, false);

window.addEventListener("keyup", function(e) {
  if (e.ctrlKey) {

    // Paste: Ctrl + V = text, Ctrl + Shift + V = cell.
    if (e.keyCode == 86 && e.shiftKey) {
      pasteCell(charaster.clipboard);
    } else if (e.keyCode == 86) {
      pasteText(document.getElementById("clipboardPaste").textContent);
    }

    // Reset zoom: Ctrl + 0.
    if (e.key == "0") {
      zoom(charaster.defaultFontSize);
    }

    // History: Ctrl + Z = undo, Ctrl + Y = redo
    if (e.code == "KeyZ") {
      undo();
    } else if (e.code == "KeyY") {
      redo();
    }
  }
}, false);

window.addEventListener("copy", function(e) {
  charaster.tool.copy(e);
}, false);

window.addEventListener("cut", function(e) {
  charaster.tool.cut(e);
}, false);

window.addEventListener("paste", function(e) {
  if (e.target.tagName == "INPUT") {
    return; // Do not interfere with manual character entering.
  }
  e.preventDefault();
  window.focus();

  // Get raw text from clipboard.
  e.stopPropagation();
  var clipboardData = e.clipboardData || window.clipboardData;
  var text = clipboardData.getData("Text");
  document.getElementById("clipboardPaste").innerHTML = text;
}, false);

window.addEventListener("resize", function(e) {
  // zoom(Math.ceil(window.devicePixelRatio * charaster.defaultFontSize));
  var top = document.getElementById("controls").clientHeight + 1;
  charaster.gridCanvas.style.top = top + "px";
  charaster.rasterCanvas.style.top = top + "px";
  charaster.rasterTempCanvas.style.top = top + "px";
  charaster.cursorCanvas.style.top = top + "px";
}, false);

document.getElementById("zoomIn").addEventListener("click", function(e) {
  zoom(parseInt(charaster.fontSize) + 1);
}, false);

document.getElementById("zoomOut").addEventListener("click", function(e) {
  zoom(parseInt(charaster.fontSize) - 1);
}, false);

document.getElementById("gridToggle").addEventListener("click", function(e) {
  var grid = document.getElementById("grid");
  var gridToggle = document.getElementById("gridToggle");
  if (grid.style.visibility == "hidden") {
    grid.style.visibility = "visible";
  } else {
    grid.style.visibility = "hidden";
  }
}, false);

document.getElementById("gridSizeButton").addEventListener("click", function(e) {
  e.stopPropagation();
  var list = document.getElementById("gridList");
  hideLists(list.id);
  var gridWidth = document.getElementById("gridWidth");
  var gridHeight = document.getElementById("gridHeight");
  if (list.style.visibility != "visible") {
    var rect = e.target.getBoundingClientRect();
    gridWidth.value = charaster.gridWidth;
    gridHeight.value = charaster.gridHeight;
    list.style.visibility = "visible";
    list.style.left = rect.left + "px";
    list.style.top = rect.top - list.offsetHeight - 8 + "px";
    list.style.visibility = "visible";
  } else {
    list.style.visibility = "hidden";
  }
}, false);

document.getElementById("resizeGrid").addEventListener("click", function(e) {
  hideLists();
  var inputWidth = Number.parseInt(gridWidth.value);
  if (inputWidth > 0 && inputWidth != "NaN") {
    charaster.gridWidth = inputWidth;
  }
  var inputHeight = Number.parseInt(gridHeight.value);
  if (inputHeight > 0 && inputHeight != "NaN") {
    charaster.gridHeight = inputHeight;
  }
  applyRasterSize();
  document.getElementById("themeList").style.visibility = "hidden";
}, false);

document.getElementById("autoCrop").addEventListener("click", function(e) {
  hideLists();
  autoCrop();
  document.getElementById("themeList").style.visibility = "hidden";
}, false);

charaster.themeSelect.addEventListener("click", function(e) {
  e.stopPropagation();
  var list = document.getElementById("themeList");
  hideLists(list.id);
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

window.addEventListener("mousewheel", function(e) {

  // Zoom In: Ctrl + Mouse Wheel Up
  // Zoom Out: Ctrl + Mouse Wheel Down
  if (e.ctrlKey) {
    e.preventDefault();
    if (e.deltaY > 0) {
      zoom(parseInt(charaster.fontSize) - 1);
    } else if (e.deltaY < 0) {
      zoom(parseInt(charaster.fontSize) + 1);
    }
  }
}, false);

document.getElementById("upload").addEventListener("change", function(e) {
  if (openMode == "plain") {
    openPlain(document.getElementById("upload").files[0]);
  } else if (openMode == "json") {
    openJson(document.getElementById("upload").files[0]);
  }
}, false);

document.getElementById("undo").addEventListener("click", function(e) {
  undo();
}, false);

document.getElementById("redo").addEventListener("click", function(e) {
  redo();
}, false);
