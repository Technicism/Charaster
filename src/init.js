"use strict";

// Check web browser using method sourced from http://stackoverflow.com/a/9851769
var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isFirefox = typeof InstallTrigger !== 'undefined';
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
var isIE = /*@cc_on!@*/false || !!document.documentMode;
var isEdge = !isIE && !!window.StyleMedia;
var isChrome = !!window.chrome && !!window.chrome.webstore;
var isBlink = (isChrome || isOpera) && !!window.CSS;

// Warning.
if (isOpera)  {
  document.getElementById("details").innerHTML += " (OPERA IS UNSUPPORTED)";
} else if (isFirefox)  {
  document.getElementById("details").innerHTML += " (FIREFOX IS UNSUPPORTED)";
} else if (isSafari)  {
  document.getElementById("details").innerHTML += " (SAFARI IS UNSUPPORTED)";
} else if (isIE)  {
  document.getElementById("details").innerHTML += " (IE IS UNSUPPORTED)";
} else if (isEdge)  {
  document.getElementById("details").innerHTML += " (EDGE IS UNSUPPORTED)";
} else if (isBlink)  {
  document.getElementById("details").innerHTML += " (BLINK IS UNSUPPORTED)";
}

// Globals.
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

// More globals.
var mouseDown = false;
var draw = false;
var drawList = [];
var lineStart;
var rasterHistory = new History(
  document.getElementById("undo").children[1],
  document.getElementById("redo").children[1]
);
var openMode = "plain";
