const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const keytar = require('keytar');

// Keep a global reference of the window object
let mainWindow;
let isDevelopment = process.env.NODE_ENV === 'development';

// Auto-updater configuration
function initAutoUpdater(win) {
  if (isDevelopment) return; // Skip in development

  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['Ok'],
      message: 'Update found; downloading in background.'
    });
  });
  
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['Restart', 'Later'],
      message: 'Update downloaded. Restart to apply?'
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'build/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  // Load the web app
  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/public/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    initAutoUpdater(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up auto-updater check interval (every 10 minutes)
  if (!isDevelopment) {
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 10 * 60 * 1000);
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();

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

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-project');
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-project');
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Terminal',
      submenu: [
        {
          label: 'New Terminal',
          accelerator: 'CmdOrCtrl+Shift+`',
          click: () => {
            mainWindow.webContents.send('menu-new-terminal');
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for file system operations
ipcMain.handle('fs-read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs-write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs-read-dir', async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items = entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name)
    }));
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs-create-dir', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC handlers for terminal operations
ipcMain.handle('terminal-execute', async (event, command, cwd) => {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, {
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout,
        stderr,
        exitCode: code
      });
    });

    process.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        stdout,
        stderr
      });
    });
  });
});

// IPC handlers for code execution
ipcMain.handle('execute-code', async (event, language, code, projectPath) => {
  return new Promise((resolve) => {
    let command;
    let tempFile;

    switch (language) {
      case 'javascript':
      case 'node':
        command = `node -e "${code.replace(/"/g, '\\"')}"`;
        break;
      case 'python':
        // Create temporary file for Python execution
        tempFile = path.join(projectPath || process.cwd(), 'temp_script.py');
        fs.writeFile(tempFile, code).then(() => {
          command = `python "${tempFile}"`;
          executeCommand();
        });
        return;
      default:
        resolve({
          success: false,
          error: `Unsupported language: ${language}`
        });
        return;
    }

    executeCommand();

    function executeCommand() {
      const execProcess = spawn(command, [], {
        cwd: projectPath || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      execProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      execProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      execProcess.on('close', (code) => {
        // Clean up temp file if created
        if (tempFile) {
          fs.unlink(tempFile).catch(() => {});
        }

        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code
        });
      });

      execProcess.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          stdout,
          stderr
        });
      });
    }
  });
});

// IPC handlers for secure storage
ipcMain.handle('keytar-get', async (event, service, account) => {
  try {
    const password = await keytar.getPassword(service, account);
    return { success: true, password };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('keytar-set', async (event, service, account, password) => {
  try {
    await keytar.setPassword(service, account, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('keytar-delete', async (event, service, account) => {
  try {
    const deleted = await keytar.deletePassword(service, account);
    return { success: true, deleted };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC handler for dialog operations
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
