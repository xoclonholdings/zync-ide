const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  readFile: (filePath) => ipcRenderer.invoke('fs-read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs-write-file', filePath, content),
  readDir: (dirPath) => ipcRenderer.invoke('fs-read-dir', dirPath),
  createDir: (dirPath) => ipcRenderer.invoke('fs-create-dir', dirPath),

  // Terminal operations
  executeTerminal: (command, cwd) => ipcRenderer.invoke('terminal-execute', command, cwd),

  // Code execution
  executeCode: (language, code, projectPath) => ipcRenderer.invoke('execute-code', language, code, projectPath),

  // Secure storage (keytar)
  getPassword: (service, account) => ipcRenderer.invoke('keytar-get', service, account),
  setPassword: (service, account, password) => ipcRenderer.invoke('keytar-set', service, account, password),
  deletePassword: (service, account) => ipcRenderer.invoke('keytar-delete', service, account),

  // Dialog operations
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Menu event listeners
  onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
  onMenuOpenProject: (callback) => ipcRenderer.on('menu-open-project', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  onMenuNewTerminal: (callback) => ipcRenderer.on('menu-new-terminal', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Platform info
  platform: process.platform,
  isElectron: true
});
