import { createContext, useContext, ReactNode } from "react";

interface ElectronAPI {
  // File system operations
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readDir: (dirPath: string) => Promise<{ success: boolean; items?: any[]; error?: string }>;
  createDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;

  // Terminal operations
  executeTerminal: (command: string, cwd?: string) => Promise<any>;

  // Code execution
  executeCode: (language: string, code: string, projectPath?: string) => Promise<any>;

  // Secure storage
  getPassword: (service: string, account: string) => Promise<{ success: boolean; password?: string; error?: string }>;
  setPassword: (service: string, account: string, password: string) => Promise<{ success: boolean; error?: string }>;
  deletePassword: (service: string, account: string) => Promise<{ success: boolean; deleted?: boolean; error?: string }>;

  // Dialog operations
  showOpenDialog: (options: any) => Promise<{ success: boolean; canceled?: boolean; filePaths?: string[]; error?: string }>;
  showSaveDialog: (options: any) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;

  // Menu event listeners
  onMenuNewProject: (callback: () => void) => void;
  onMenuOpenProject: (callback: () => void) => void;
  onMenuSave: (callback: () => void) => void;
  onMenuNewTerminal: (callback: () => void) => void;

  // Platform info
  platform: string;
  isElectron: boolean;
}

interface ElectronContextType {
  isElectron: boolean;
  platform: string;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readDir: (dirPath: string) => Promise<{ success: boolean; items?: any[]; error?: string }>;
  createDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  executeTerminal: (command: string, cwd?: string) => Promise<any>;
  executeCode: (language: string, code: string, projectPath?: string) => Promise<any>;
  getPassword: (service: string, account: string) => Promise<{ success: boolean; password?: string; error?: string }>;
  setPassword: (service: string, account: string, password: string) => Promise<{ success: boolean; error?: string }>;
  deletePassword: (service: string, account: string) => Promise<{ success: boolean; deleted?: boolean; error?: string }>;
  showOpenDialog: (options: any) => Promise<{ success: boolean; canceled?: boolean; filePaths?: string[]; error?: string }>;
  showSaveDialog: (options: any) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
  onMenuNewProject: (callback: () => void) => void;
  onMenuOpenProject: (callback: () => void) => void;
  onMenuSave: (callback: () => void) => void;
  onMenuNewTerminal: (callback: () => void) => void;
}

const ElectronContext = createContext<ElectronContextType | undefined>(undefined);

interface ElectronProviderProps {
  children: ReactNode;
}

export function ElectronProvider({ children }: ElectronProviderProps) {
  // Check if we're running in Electron
  const isElectron = typeof window !== 'undefined' && 
                   window.electronAPI && 
                   window.electronAPI.isElectron;

  const platform = isElectron ? window.electronAPI.platform : 'web';

  // Wrapper functions that handle both Electron and web environments
  const readFile = async (filePath: string) => {
    if (isElectron) {
      return window.electronAPI.readFile(filePath);
    }
    // In web environment, we can't directly read files from file system
    return { success: false, error: "File system access not available in web environment" };
  };

  const writeFile = async (filePath: string, content: string) => {
    if (isElectron) {
      return window.electronAPI.writeFile(filePath, content);
    }
    return { success: false, error: "File system access not available in web environment" };
  };

  const readDir = async (dirPath: string) => {
    if (isElectron) {
      return window.electronAPI.readDir(dirPath);
    }
    return { success: false, error: "Directory access not available in web environment" };
  };

  const createDir = async (dirPath: string) => {
    if (isElectron) {
      return window.electronAPI.createDir(dirPath);
    }
    return { success: false, error: "Directory creation not available in web environment" };
  };

  const executeTerminal = async (command: string, cwd?: string) => {
    if (isElectron) {
      return window.electronAPI.executeTerminal(command, cwd);
    }
    // In web environment, we'll fall back to API calls
    const response = await fetch('/api/terminal/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, cwd }),
    });
    return response.json();
  };

  const executeCode = async (language: string, code: string, projectPath?: string) => {
    if (isElectron) {
      return window.electronAPI.executeCode(language, code, projectPath);
    }
    // In web environment, use API
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, projectPath }),
    });
    return response.json();
  };

  const getPassword = async (service: string, account: string) => {
    if (isElectron) {
      return window.electronAPI.getPassword(service, account);
    }
    return { success: false, error: "Secure storage not available in web environment" };
  };

  const setPassword = async (service: string, account: string, password: string) => {
    if (isElectron) {
      return window.electronAPI.setPassword(service, account, password);
    }
    return { success: false, error: "Secure storage not available in web environment" };
  };

  const deletePassword = async (service: string, account: string) => {
    if (isElectron) {
      return window.electronAPI.deletePassword(service, account);
    }
    return { success: false, error: "Secure storage not available in web environment" };
  };

  const showOpenDialog = async (options: any) => {
    if (isElectron) {
      return window.electronAPI.showOpenDialog(options);
    }
    return { success: false, error: "Native dialogs not available in web environment" };
  };

  const showSaveDialog = async (options: any) => {
    if (isElectron) {
      return window.electronAPI.showSaveDialog(options);
    }
    return { success: false, error: "Native dialogs not available in web environment" };
  };

  const onMenuNewProject = (callback: () => void) => {
    if (isElectron) {
      window.electronAPI.onMenuNewProject(callback);
    }
  };

  const onMenuOpenProject = (callback: () => void) => {
    if (isElectron) {
      window.electronAPI.onMenuOpenProject(callback);
    }
  };

  const onMenuSave = (callback: () => void) => {
    if (isElectron) {
      window.electronAPI.onMenuSave(callback);
    }
  };

  const onMenuNewTerminal = (callback: () => void) => {
    if (isElectron) {
      window.electronAPI.onMenuNewTerminal(callback);
    }
  };

  const value: ElectronContextType = {
    isElectron,
    platform,
    readFile,
    writeFile,
    readDir,
    createDir,
    executeTerminal,
    executeCode,
    getPassword,
    setPassword,
    deletePassword,
    showOpenDialog,
    showSaveDialog,
    onMenuNewProject,
    onMenuOpenProject,
    onMenuSave,
    onMenuNewTerminal,
  };

  return (
    <ElectronContext.Provider value={value}>
      {children}
    </ElectronContext.Provider>
  );
}

export function useElectron() {
  const context = useContext(ElectronContext);
  if (context === undefined) {
    throw new Error('useElectron must be used within an ElectronProvider');
  }
  return context;
}

// Extend Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
