const electron = require('electron')
const app = electron.app
const fs = require('fs')
const os = require('os')
const low = require('lowdb')
const fileAsync = require('lowdb/lib/storages/file-async') // required by database.js
const zlib = require('zlib')
const winston = require('winston')
const logrotate = require('winston-logrotate')
const appdirectory = require('appdirectory')

let appName = 'Quotes' // app.getname is wrong !?
let dirs = new appdirectory(appName)
let baseDir = dirs.userData() + '/'
let dbPath = baseDir + appName + '.json'
let logPath = baseDir + appName + '.log'
let optionsPath = baseDir + appName + '.conf'
let globalOptions = { window: { title: appName, icon: __dirname + '/img/logo.png' } }
let defaultOptions = { window: { width: 800, height: 600 }, player: {} }
let options = { window: { width: 800, height: 600 }, player: {} }
let mainWindow
let mainMenu
let timerOptions
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
    options: options,
    platform: [ os.platform(), os.arch() ]
  } 

}


function importFiles(filenames) {

  if (filenames) {
    for (index in filenames) {
      fs.readFile(filenames[index], 'utf8', function(err, data) {
        if (!err) {
          mainWindow.webContents.send('import-quotes', { 'path': filenames[index], 'data': data })
        } else {
          throw err
        }
      })
    }
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
    
    var bakFiles = files.filter(function(each, index) { return each.indexOf('.bak') >= 0; }).sort()
    
    for (i = 0; i < Math.max(0, bakFiles.length - 9); i++) {
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

function saveOptionsDelayed() {

  clearTimeout(timerOptions)

  timerOptions = setTimeout(function() {
    saveOptions()
  }, 1000)

}

function loadOptions() {

  fs.stat(optionsPath, function(err, stats) {
    if (err) {
      logger.log('error', 'loadOptions.stat', { error: err, path: stats })
    } 
    if (stats && stats.isFile && stats.isFile()) {
      try {
        options = JSON.parse(fs.readFileSync(optionsPath)) || defaultOptions
      } catch (error) {
        logger.log('error', 'loadOptions.json', { error: error, path: stats })
      }
    }
  })

}

function saveOptions() {

  try {
    fs.writeFile(optionsPath, JSON.stringify(options), function(err) {
      if (err) {
        logger.log('error', 'saveOptions.write', { error: err, path: optionsPath })
      }
    });
  } catch (error) {
    logger.log('error', 'saveOptions.json', { error: err, path: stats })
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

  options.desktop = !options.desktop

  if (options.desktop) {
    options.window.frame = false
    options.window.transparent = true
    options.window.type = 'desktop'
  } else {
    delete options.window.frame
    delete options.window.transparent
    delete options.window.type
  }
  
  saveOptionsDelayed()
  
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

  if (options.desktop) {
    options.debug = true
    toggleWindow()
  } else {
    options.debug = !options.debug;
    if (options.debug) {
      mainWindow.webContents.openDevTools()
    } else {
      mainWindow.webContents.closeDevTools()
    }
  }

}

function getWindowOptions () {
  var options = {}
  var _globalOptions = globalOptions.window || defaultOptions.window || {}
  var _options = options.window || defaultOptions.window || {}
  for (key in _globalOptions) {
    if (_globalOptions.hasOwnProperty(key)) {
      options[key] = _globalOptions[key]
    }
  }
  for (key in _options) {
    if (_options.hasOwnProperty(key)) {
      options[key] = _options[key]
    }
  }
 return options;
}

function createWindow () {
  
  loadGlobals()

  mainWindow = new electron.BrowserWindow(getWindowOptions())

  mainWindow.loadURL(`file://${__dirname}/index.html`)

  if (options.debug && !options.desktop) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', function () {
    mainWindow = null
    onClosed()
  })

  mainWindow.on('resize', function(event) {
    options.desktop = false
    options.window = mainWindow.getBounds()
    saveOptionsDelayed()
  })

  mainWindow.on('moved', function(event) {
    options.desktop = false
    options.window = mainWindow.getBounds()
    saveOptionsDelayed()
  })

  mainWindow.webContents.on('devtools-opened', function(event) {
    options.debug = true
    saveOptionsDelayed()
  })

  mainWindow.webContents.on('devtools-closed', function(event) {
    options.debug = false
    saveOptionsDelayed()
  })

  createMenu()

}

function createMenu() {

  var template = [
    {
      label: 'Main',
      submenu: [
        { label: 'Import ...', 
          click(item, focusedWindow) { 
            electron.dialog.showOpenDialog({
              properties: [ 'openFile' ],
              filters: [
                { name: 'Quotes', extensions: [ 'json' ]}
              ]
            }, function(filenames) {
              importFiles(filenames)
            })
          } 
        },
        {
          type: 'separator'
        },
        { label: 'Copy Quote', 
          click(item, focusedWindow) { 
            mainWindow.webContents.send('copy-quote');
          } 
        },
        {
          type: 'separator'
        },
        { label: 'Toggle Play/Pause', 
          click(item, focusedWindow) { 
            mainWindow.webContents.send('player-toggle');
          } 
        },
        { label: 'Next', 
          click(item, focusedWindow) { 
            mainWindow.webContents.send('player-next');
          } 
        },
        { label: 'Previous', 
          click(item, focusedWindow) { 
            mainWindow.webContents.send('player-previous');
          } 
        },
        {
          type: 'separator'
        },
        { label: 'Faster', 
          click(item, focusedWindow) { 
            mainWindow.webContents.send('player-faster');
          } 
        },
        { label: 'Slower', 
          click(item, focusedWindow) { 
            mainWindow.webContents.send('player-slower');
          } 
        },
        { label: 'Reset Defaults', 
          click(item, focusedWindow) { 
            mainWindow.webContents.send('player-reset');
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
    options.desktop ? {} :
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
            focusedWindow.reload()
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
            toggleDevTools()
          } 
        }
      ]
    }
  ]
  
  mainMenu = electron.Menu.buildFromTemplate(template)

  electron.Menu.setApplicationMenu(mainMenu)

}

createLogger()
logger.log('info', 'startup')
createAndCleanupBackups()
loadOptions()

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

electron.ipcMain.on('player-options', function(event, arg) {
  if (arg) {
    options.player = arg
    saveOptionsDelayed()
  }
})