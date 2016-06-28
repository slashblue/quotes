const electron = require('electron')
const app = electron.app
const fs = require('fs')
const os = require('os')
const low = require('lowdb')
const fileAsync = require('lowdb/lib/file-async')
const zlib = require('zlib')
const gzipme = require('gzipme')
const winston = require('winston')
const logrotate = require('winston-logrotate')
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
let logger
let onClosed = function() {}

function createLogger() {
  logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ 
        level: 'warn'
      }),
      (logrotate && logrotate.Rotate) ? 
        (new logrotate.Rotate({
          file: logPath, 
          timestamp: true,
          max: '100m',
          keep: 7,
          compress: true,
          level: 'info' 
        })) : 
        (new (winston.transports.File)({
          filename: logPath, 
          level: 'info'
        }))
    ]
  });
}

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

function copyAndZipFromToSync(from, to) {

  fs.createReadStream(from).pipe(zlib.createGzip()).pipe(fs.createWriteStream(to))

}

function cleanupBackupsSync(baseDir) {

  fs.readdir(baseDir, function(err, files) {
    
    var bakFiles = files.filter(function(each, index) { return each.indexOf('.bak') >= 0; }).sort().reverse()
    
    for (i = 9; i < bakFiles.length; i++) {
      logger.log('info', 'cleanupBackupsSync', { path: baseDir + files[i] })
      fs.unlink(baseDir + files[i], function(err) {
        if (err) {
          logger.log('error', 'cleanupBackupsSync', { path: baseDir + files[i], error: err })
        }
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
      logger.log('error', 'loadConfig.stat', { error: err, path: stats })
    } 
    if (stats && stats.isFile && stats.isFile()) {
      try {
        config = JSON.parse(fs.readFileSync(configPath)) || defaultConfig
      } catch (error) {
        logger.log('error', 'loadConfig.json', { error: error, path: stats })
      }
    }
  })

}

function saveConfig() {

  try {
    fs.writeFile(configPath, JSON.stringify(config), function(err) {
      if (err) {
        logger.log('error', 'saveConfig.write', { error: err, path: configPath })
      }
    });
  } catch (error) {
    logger.log('error', 'saveConfig.json', { error: err, path: stats })
  }

}

function createAndCleanupBackups() {

  fs.stat(dbPath, function(err, stats) {
    if (err) {
      logger.log('error', 'createAndCleanupBackups', { error: err, stats: stats, path: dbPath })
    } 
    if (stats && stats.isFile && stats.isFile()) {
      copyAndZipFromToSync(dbPath, baseDir + humanReadableTimestamp() + '.bak.gz')
      cleanupBackupsSync(baseDir)
    } 
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

  mainWindow.webContents.on('devtools-opened', function(event) {
    config.debug = true
    saveConfigDelayed()
  })

  mainWindow.webContents.on('devtools-closed', function(event) {
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
        { label: 'Copy Quote', 
          click(item, focusedWindow) { 
            if (focusedWindow) {
              mainWindow.webContents.send('copy-quote');
            }
          } 
        },
        {
          type: 'separator'
        },
        { label: 'Toggle Play/Pause', 
          click(item, focusedWindow) { 
            if (focusedWindow) {
              mainWindow.webContents.send('player-toggle');
            }
          } 
        },
        { label: 'Next', 
          click(item, focusedWindow) { 
            if (focusedWindow) {
              mainWindow.webContents.send('player-next');
            }
          } 
        },
        { label: 'Previous', 
          click(item, focusedWindow) { 
            if (focusedWindow) {
              mainWindow.webContents.send('player-previous');
            }
          } 
        },
        {
          type: 'separator'
        },
        { label: 'Faster', 
          click(item, focusedWindow) { 
            if (focusedWindow) {
              mainWindow.webContents.send('player-faster');
            }
          } 
        },
        { label: 'Slower', 
          click(item, focusedWindow) { 
            if (focusedWindow) {
              mainWindow.webContents.send('player-slower');
            }
          } 
        },
        {
          type: 'separator'
        },
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
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          type: 'separator'
        },
        { label: 'Toggle Desktop/Window', 
          click() { 
            toggleWindow()
          } 
        },
        { label: 'Toggle Development tools', 
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) { 
            if (focusedWindow) {
              toggleDevTools()
            }
          } 
        }
      ]
    }
  ]
  
  mainMenu = electron.Menu.buildFromTemplate(template);

  electron.Menu.setApplicationMenu(mainMenu);

}

createLogger()
logger.log('info', 'startup')
createAndCleanupBackups()
loadConfig()

app.on('ready', function() {
  createWindow()
})

app.on('window-all-closed', function () {
  logger.log('info', 'shutdown')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

electron.ipcMain.on('copy-quote', function(event, arg) {
  electron.clipboard.writeText(arg);
})