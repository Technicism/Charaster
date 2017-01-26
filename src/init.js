"use strict";

var currentTheme = themes["Stereokai"];
var charaster = new Charaster();

// Canvases.
charaster.gridCanvas = document.getElementById("grid");
charaster.gridContext = charaster.gridCanvas.getContext("2d");
charaster.rasterCanvas = document.getElementById("raster");
charaster.rasterContext = charaster.rasterCanvas.getContext("2d");
charaster.rasterTempCanvas = document.getElementById("rasterTemp");
charaster.rasterTempContext = charaster.rasterTempCanvas.getContext("2d");
charaster.cursorCanvas = document.getElementById("cursor");
charaster.cursorContext = charaster.cursorCanvas.getContext("2d");
charaster.selectCanvas = document.getElementById("select");
charaster.selectContext = charaster.selectCanvas.getContext("2d");

// Info.
charaster.cursorPos = document.getElementById("cursorPos");
charaster.gridSizeText = document.getElementById("gridSizeText");
charaster.gridSizeText.innerHTML = "[" + charaster.gridWidth + ", " + charaster.gridHeight + "]";

// Chrome.
charaster.body = document.body;
charaster.controls = document.getElementById("controls");
charaster.info = document.getElementById("info");
charaster.bars = document.getElementsByClassName("bar");
charaster.foreground = document.getElementById("foreground");
charaster.icons = document.getElementsByClassName("icon");
charaster.iconStrokes = document.getElementsByClassName("iconStroke");
charaster.preview = document.getElementById("preview");
charaster.noColor = document.getElementById("noColor");
charaster.themeSelect = document.getElementById("themeSelect");
charaster.themeList = document.getElementById("themeList");

var mouseDown = false;
var draw = false;
var drawList = [];
var lineStart;
var rasterHistory = new History(
  document.getElementById("undo").children[1],
  document.getElementById("redo").children[1]
);
var openMode = "plain";
