const { app, BrowserWindow, session ,ipcMain} = require("electron");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true, // ✅ Secure isolation
      nodeIntegration: false, // ✅ Prevent Node.js access in renderer
    },
  });

  mainWindow.loadURL("http://localhost:3000");
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
  // ✅ Inject secure Content-Security-Policy (CSP)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' http://localhost:3000; script-src 'self' 'unsafe-inline' http://localhost:3000; style-src 'self' 'unsafe-inline' http://localhost:3000; object-src 'none'; base-uri 'none';",
        ],
      },
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // macOS specific behavior: recreate window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // On non-macOS, quit when all windows are closed
  if (process.platform !== "darwin") app.quit();
});

//  For Slient Printing
ipcMain.on('print-silent', (event, contentHTML) => {
  // Create a hidden window for printing
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the content as a data URL
  printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(contentHTML));

  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({ silent: true, printBackground: true }, (success, errorType) => {
      if (!success) console.error('Silent print failed:', errorType);
      else console.log('Silent print success');

      printWindow.close();
    });
  });
});