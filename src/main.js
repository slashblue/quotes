const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const fs = require('fs');
const low = require('lowdb')
const fileAsync = require('lowdb/lib/file-async')
const logger = require('winston'); 
const loggerRotate = require('winston-logrotate')
const appdirectory = require('appdirectory')

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function copyFromTo(from, to) {
  fs.createReadStream(from).pipe(fs.createWriteStream(to));
}

function humanReadableTimestamp() {
  var now = new Date()
  return now.getFullYear() + '.' + pad(now.getMonth(), 2) + '.' + pad(now.getDay(), 2) + '.' + pad(now.getHours(), 2) + '.' + pad(now.getMinutes(), 2) + '.' + pad(now.getSeconds(), 2) + '.' + pad(now.getMilliseconds(), 3);
}

function setUp() {
  var appName = 'Quotes' // app.getname is wrong !?
  var dirs = new appdirectory(appName)
  var baseDir = dirs.userData()+ '/'
  var dbPath = baseDir + appName + '.json'
  var logPath = baseDir + appName + '.log'
  fs.stat(dbPath, function() {
    copyFromTo(dbPath, humanReadableTimestamp())
  })
  fs.readdir(baseDir, function(err, files) {
    var bakFiles = files.filter(function(each, index) { return each.indexOf('.bak') >= 0; }).sort().reverse()
    for (i = 9; i < bakFiles.length; i++) {
      fs.unlink(baseDir + files[i], function(err) {
        // ignore
      });
    }
  })
  var db = low(dbPath, {
    storage: fileAsync
  })
  global.settings = {
    log: logPath,
    db: dbPath
  }
}

setUp()

// Module to create native browser window.

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
