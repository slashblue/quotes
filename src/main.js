const electron = require('electron')
const app = electron.app
const fs = require('fs')
const os = require('os')
const low = require('lowdb')
const fileAsync = require('lowdb/lib/file-async')
const logger = require('winston')
const loggerRotate = require('winston-logrotate')
const appdirectory = require('appdirectory')

let appName = 'Quotes' // app.getname is wrong !?
let dirs = new appdirectory(appName)
let baseDir = dirs.userData() + '/'
let dbPath = baseDir + appName + '.json'
let logPath = baseDir + appName + '.log'
let configPath = baseDir + appName + '.conf'
let defaultConfig = { window: { width: 800, height: 600 } }
let config = defaultConfig
let mainWindow
let mainMenu
let timerConfig
let db = null
let onClosed = function() {}

function loadGlobals() {
  global.settings = {
    name: appName,
    log: logPath,
    db: dbPath,
    config: config,
    platform: [ os.platform(), os.arch() ]
  } 
}

function pad(n, width, z) {

  n = n + '';
  width = width || 0;
  z = z || '0';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n

}

function copyFromToSync(from, to) {

  fs.createReadStream(from).pipe(fs.createWriteStream(to))

}

function cleanupBackupsSync(baseDir) {

  fs.readdir(baseDir, function(err, files) {
    
    var bakFiles = files.filter(function(each, index) { return each.indexOf('.bak') >= 0; }).sort().reverse()
    
    for (i = 9; i < bakFiles.length; i++) {
      fs.unlink(baseDir + files[i], function(err) {
        // ignore
      });
    }

  }) 

}

function humanReadableTimestamp() {

  var now = new Date()
  return [ now.getFullYear(), pad(now.getMonth(), 2), pad(now.getDay(), 2), pad(now.getHours(), 2), pad(now.getMinutes(), 2), pad(now.getSeconds(), 2), pad(now.getMilliseconds(), 3) ].join('.')

}

function saveConfigDelayed() {

  clearTimeout(timerConfig)

  timerConfig = setTimeout(function() {
    saveConfig()
  }, 1000)

}

function loadConfig() {

  fs.stat(configPath, function(err, stats) {
    if (err) {
      console.log(err);
    } 
    if (stats && stats.isFile && stats.isFile()) {
      try {
        config = JSON.parse(fs.readFileSync(configPath)) || defaultConfig
      } catch (error) {
        console.log(error)
      }
    }
  })

}

function saveConfig() {

  try {
    fs.writeFile(configPath, JSON.stringify(config), function(err) {
      if (err) {
        console.log(err);
      }
    });
  } catch (error) {
    console.log(error)
  }

}

function createAndCleanupBackups() {

  fs.stat(dbPath, function(err, stats) {
    if (err) {
      console.log(err);
    } 
    if (stats && stats.isFile && stats.isFile()) {
      copyFromToSync(dbPath, baseDir + humanReadableTimestamp() + '.bak')
      cleanupBackupsSync(baseDir)
    } 
  })

}

function loadDB() {
  
  db = low(dbPath, {
    storage: fileAsync
  })

}

function toggleWindow() {

  config.desktop = !config.desktop

  if (config.desktop) {
    config.window.frame = false
    config.window.transparent = true
    config.window.type = 'desktop'
  } else {
    delete config.window.frame
    delete config.window.transparent
    delete config.window.type
  }
  
  saveConfigDelayed()
  
  reopenWindow()

}

function reopenWindow() {

  if (mainWindow) {
    onClosed = function() {
      onClosed = function() {}
      createWindow() 
    }
    mainWindow.close()
  } else {
    onClosed = function() {}
    createWindow()
  }

}

function toggleDevTools() {

  if (config.desktop) {
    config.debug = true
    toggleWindow()
  } else {
    config.debug = !config.debug;
    if (config.debug) {
      mainWindow.webContents.openDevTools()
    } else {
      mainWindow.webContents.closeDevTools()
    }
  }

}

function createWindow () {
  
  loadGlobals()

  mainWindow = new electron.BrowserWindow(config.window)

  mainWindow.loadURL(`file://${__dirname}/index.html`)

  if (config.debug && !config.desktop) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', function () {
    mainWindow = null
    onClosed()
  })

  mainWindow.on('resize', function(event) {
    config.desktop = false
    config.window = mainWindow.getBounds()
    saveConfigDelayed()
  })

  mainWindow.on('moved', function(event) {
    config.desktop = false
    config.window = mainWindow.getBounds()
    saveConfigDelayed()
  })

  mainWindow.on('devtools-opened', function(event) {
    config.debug = true
    saveConfigDelayed()
  })

  mainWindow.on('devtools-closed', function(event) {
    config.debug = false
    saveConfigDelayed()
  })

  createMenu()

}

function createMenu() {

  var template = [
    {
      label: 'Main',
      submenu: [
        { label: 'Quit', 
          accelerator: 'Command+Q',
          click() { 
            app.quit(); 
          } 
        }
      ]
    },
    config.desktop ? {} :
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Paste and Match Style',
          accelerator: 'Shift+Command+V',
          role: 'pasteandmatchstyle'
        },
        {
          label: 'Delete',
          role: 'delete'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        },
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Desktop/Window', 
          click() { 
            toggleWindow()
          } 
        },
        { label: 'Toggle Development tools', 
          click() { 
            toggleDevTools()
          } 
        }
      ]
    }
  ]
  
  mainMenu = electron.Menu.buildFromTemplate(template);

  electron.Menu.setApplicationMenu(mainMenu);

}

createAndCleanupBackups()
loadConfig()
loadDB()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
  createWindow()
})

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
