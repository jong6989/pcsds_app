
const electron = require('electron')
const Menu = electron.Menu
const app = electron.app
const BrowserWindow = electron.BrowserWindow
var path = require('path')
var ipc = electron.ipcMain
var remote = electron.remote
var fs = require('fs')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({show: false,width: 1020, height: 780,minWidth: 400, icon: path.join(__dirname, 'images/pcsdlogo.png')})

  mainWindow.loadFile('index.html')

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  ipc.on('open_child_window',(event,arg)=>{
    console.log(arg)
    var w = BrowserWindow.getAllWindows();
    w[0].openDevTools();
  })


  var application_menu = [
    {
      label: 'Options',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.loadFile('index.html')
          }
        },
        {
          label: 'Open Dev Tools',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.openDevTools();
          }
        }
      ]}, {
        label: "Edit",
        submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]
    }
  ];
  if (process.platform == 'darwin') {
    const name = app.getName();
    application_menu.unshift({
      label: name,
      submenu: [
        {
          label: 'About ' + name,
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide ' + name,
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => { app.quit(); }
        },
      ]
    });
  }

  menu = Menu.buildFromTemplate(application_menu);
  Menu.setApplicationMenu(menu);

}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

