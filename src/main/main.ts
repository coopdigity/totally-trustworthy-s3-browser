import { app, BrowserWindow, Menu, session, shell } from 'electron'
import { join } from 'path'
import { setupIpcHandlers } from './ipc/handlers'

let mainWindow: BrowserWindow | null = null

const isDev = !!process.env.VITE_DEV_SERVER_URL

function applySecurityPolicies() {
  // Lock down navigation: block in-app navigation away from the app and open
  // any external link in the user's real browser instead of an Electron window.
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, url) => {
      if (url !== contents.getURL()) {
        event.preventDefault()
      }
    })
    contents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://')) {
        shell.openExternal(url)
      }
      return { action: 'deny' }
    })
  })

  // Production-only CSP. Dev is skipped so Vite HMR (ws + eval) keeps working.
  if (isDev) return
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            "script-src 'self'; " +
            // Element Plus injects runtime <style> tags.
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "object-src 'none'; " +
            "base-uri 'none'; " +
            "frame-ancestors 'none'"
        ]
      }
    })
  })
}

function createWindow() {
  // Hide the default menu bar
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Totally Trustworthy S3 Browser',
    icon: join(__dirname, '../../src/renderer/assets/pinky-promise-outline.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  applySecurityPolicies()
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
