const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

// Try to load electron-is-dev, but don't fail if it's not available
let isDev;
try {
    isDev = require('electron-is-dev');
} catch (error) {
    console.log('electron-is-dev not available:', error.message);
    isDev = () => false; // Default to production mode
}

// Try to load electron-updater, but don't fail if it's not available
let autoUpdater;
try {
    autoUpdater = require('electron-updater').autoUpdater;
} catch (error) {
    console.log('electron-updater not available:', error.message);
    autoUpdater = null;
}

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
        },
        icon: path.join(__dirname, 'assets/darkgenius.png'),
        titleBarStyle: 'default',
        show: false // Don't show until ready
    });

    // Load the app
    const startUrl = isDev 
        ? 'http://localhost:3000' 
        : `file://${path.join(__dirname, 'index.html')}`;
    
    console.log('Loading URL:', startUrl);
    mainWindow.loadURL(startUrl);

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Check for updates on startup
        if (!isDev && autoUpdater) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Prevent navigation to external URLs
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== startUrl) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });
}

// App event listeners
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Auto-updater events (only if autoUpdater is available)
if (autoUpdater) {
    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('Update available.');
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: 'A new version is available. It will be downloaded in the background.',
            buttons: ['OK']
        });
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('Update not available.');
    });

    autoUpdater.on('error', (err) => {
        console.log('Error in auto-updater. ' + err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        console.log(log_message);
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded');
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: 'Update downloaded. The application will restart to apply the update.',
            buttons: ['Restart Now', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
}

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

