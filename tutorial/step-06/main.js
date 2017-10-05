const {app, BrowserWindow, globalShortcut} = require('electron')
const path = require('path')
const url = require('url')

let win

const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 500,
    height: 900
  })

  // short cut to launch web developer tools
  globalShortcut.register('CmdOrCtrl+Shift+d', () => {
    win.webContents.toggleDevTools()
  })

  // load the index.html
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
