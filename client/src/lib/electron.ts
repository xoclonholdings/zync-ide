// Electron-specific utilities and helpers for the IDE
import type { Project } from "@shared/schema";

export interface ElectronFileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: Date;
}

export interface ElectronExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

export interface ElectronDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  properties?: Array<
    | 'openFile'
    | 'openDirectory' 
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'promptToCreate'
    | 'noResolveAliases'
    | 'treatPackageAsDirectory'
  >;
}

export class ElectronService {
  private static instance: ElectronService;
  
  private constructor() {}
  
  static getInstance(): ElectronService {
    if (!ElectronService.instance) {
      ElectronService.instance = new ElectronService();
    }
    return ElectronService.instance;
  }

  get isElectron(): boolean {
    return typeof window !== 'undefined' && 
           window.electronAPI && 
           window.electronAPI.isElectron;
  }

  get platform(): string {
    return this.isElectron ? window.electronAPI.platform : 'web';
  }

  // File System Operations
  async readFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: "File system access not available in web environment" };
    }
    
    try {
      return await window.electronAPI.readFile(filePath);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async writeFile(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: "File system access not available in web environment" };
    }
    
    try {
      return await window.electronAPI.writeFile(filePath, content);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async readDirectory(dirPath: string): Promise<{ success: boolean; items?: ElectronFileInfo[]; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: "Directory access not available in web environment" };
    }
    
    try {
      const result = await window.electronAPI.readDir(dirPath);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createDirectory(dirPath: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: "Directory creation not available in web environment" };
    }
    
    try {
      return await window.electronAPI.createDir(dirPath);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    if (!this.isElectron) return false;
    
    try {
      const result = await window.electronAPI.readFile(filePath);
      return result.success;
    } catch {
      return false;
    }
  }

  // Terminal Operations
  async executeCommand(command: string, cwd?: string): Promise<ElectronExecutionResult> {
    if (!this.isElectron) {
      return { success: false, error: "Terminal access not available in web environment" };
    }
    
    try {
      return await window.electronAPI.executeTerminal(command, cwd);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async executeCode(language: string, code: string, projectPath?: string): Promise<ElectronExecutionResult> {
    if (!this.isElectron) {
      return { success: false, error: "Code execution not available in web environment" };
    }
    
    try {
      return await window.electronAPI.executeCode(language, code, projectPath);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Secure Storage Operations (using keytar)
  async getSecurePassword(service: string, account: string): Promise<string | null> {
    if (!this.isElectron) {
      return null;
    }
    
    try {
      const result = await window.electronAPI.getPassword(service, account);
      return result.success ? (result.password || null) : null;
    } catch {
      return null;
    }
  }

  async setSecurePassword(service: string, account: string, password: string): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }
    
    try {
      const result = await window.electronAPI.setPassword(service, account, password);
      return result.success;
    } catch {
      return false;
    }
  }

  async deleteSecurePassword(service: string, account: string): Promise<boolean> {
    if (!this.isElectron) {
      return false;
    }
    
    try {
      const result = await window.electronAPI.deletePassword(service, account);
      return result.success;
    } catch {
      return false;
    }
  }

  // Dialog Operations
  async showOpenDialog(options: ElectronDialogOptions): Promise<{ 
    success: boolean; 
    canceled?: boolean; 
    filePaths?: string[]; 
    error?: string 
  }> {
    if (!this.isElectron) {
      return { success: false, error: "Native dialogs not available in web environment" };
    }
    
    try {
      return await window.electronAPI.showOpenDialog(options);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async showSaveDialog(options: ElectronDialogOptions): Promise<{ 
    success: boolean; 
    canceled?: boolean; 
    filePath?: string; 
    error?: string 
  }> {
    if (!this.isElectron) {
      return { success: false, error: "Native dialogs not available in web environment" };
    }
    
    try {
      return await window.electronAPI.showSaveDialog(options);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Project Utilities
  async selectProjectDirectory(): Promise<string | null> {
    const result = await this.showOpenDialog({
      title: 'Select Project Directory',
      properties: ['openDirectory', 'createDirectory']
    });
    
    if (result.success && !result.canceled && result.filePaths && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    
    return null;
  }

  async selectProjectFile(): Promise<string | null> {
    const result = await this.showOpenDialog({
      title: 'Open File',
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'JavaScript', extensions: ['js', 'jsx', 'mjs'] },
        { name: 'TypeScript', extensions: ['ts', 'tsx'] },
        { name: 'Python', extensions: ['py', 'pyw'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'CSS', extensions: ['css', 'scss', 'sass', 'less'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'Text', extensions: ['txt', 'log'] },
      ]
    });
    
    if (result.success && !result.canceled && result.filePaths && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    
    return null;
  }

  async saveFileAs(): Promise<string | null> {
    const result = await this.showSaveDialog({
      title: 'Save File As',
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'TypeScript', extensions: ['ts'] },
        { name: 'Python', extensions: ['py'] },
        { name: 'HTML', extensions: ['html'] },
        { name: 'CSS', extensions: ['css'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] },
      ]
    });
    
    if (result.success && !result.canceled && result.filePath) {
      return result.filePath;
    }
    
    return null;
  }

  // Project Template Creation
  async createProjectFromTemplate(projectPath: string, template: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron) {
      return { success: false, error: "Project creation not available in web environment" };
    }

    try {
      // Create project directory
      const createResult = await this.createDirectory(projectPath);
      if (!createResult.success) {
        return createResult;
      }

      // Generate template files based on type
      switch (template) {
        case 'node':
          await this.createNodeProject(projectPath);
          break;
        case 'python':
          await this.createPythonProject(projectPath);
          break;
        case 'react':
          await this.createReactProject(projectPath);
          break;
        case 'express':
          await this.createExpressProject(projectPath);
          break;
        default:
          await this.createEmptyProject(projectPath);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async createNodeProject(projectPath: string): Promise<void> {
    const packageJson = {
      name: projectPath.split('/').pop() || 'node-project',
      version: "1.0.0",
      description: "A Node.js project created with Local IDE",
      main: "index.js",
      scripts: {
        start: "node index.js",
        test: "echo \"Error: no test specified\" && exit 1"
      },
      keywords: [],
      author: "",
      license: "ISC",
      dependencies: {},
      devDependencies: {}
    };

    await this.writeFile(`${projectPath}/package.json`, JSON.stringify(packageJson, null, 2));
    
    await this.writeFile(`${projectPath}/index.js`, `console.log('Hello from Node.js!');

// Your code here
function main() {
    console.log('Welcome to your Node.js project!');
}

main();
`);

    await this.writeFile(`${projectPath}/README.md`, `# ${packageJson.name}

A Node.js project created with Local IDE.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Project Structure

- \`index.js\` - Main entry point
- \`package.json\` - Project configuration and dependencies
- \`README.md\` - This file
`);
  }

  private async createPythonProject(projectPath: string): Promise<void> {
    const projectName = projectPath.split('/').pop() || 'python-project';
    
    await this.writeFile(`${projectPath}/main.py`, `#!/usr/bin/env python3
"""
${projectName} - A Python project created with Local IDE
"""

def main():
    """Main function."""
    print("Hello from Python!")
    print(f"Welcome to {projectName}!")

if __name__ == "__main__":
    main()
`);

    await this.writeFile(`${projectPath}/requirements.txt`, `# Project dependencies
# Add your required packages here
# Example:
# requests==2.31.0
# numpy==1.24.0
`);

    await this.writeFile(`${projectPath}/README.md`, `# ${projectName}

A Python project created with Local IDE.

## Getting Started

\`\`\`bash
# Install dependencies
pip install -r requirements.txt

# Run the project
python main.py
\`\`\`

## Project Structure

- \`main.py\` - Main entry point
- \`requirements.txt\` - Project dependencies
- \`README.md\` - This file
`);
  }

  private async createReactProject(projectPath: string): Promise<void> {
    const projectName = projectPath.split('/').pop() || 'react-project';
    
    await this.writeFile(`${projectPath}/index.html`, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .app {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            text-align: center;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 20px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .counter {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 0 10px;
            transition: background 0.2s;
        }
        button:hover {
            background: #5a6fd8;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" src="app.js"></script>
</body>
</html>`);

    await this.writeFile(`${projectPath}/app.js`, `const { useState } = React;

function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div className="counter">
            <h2>React Counter</h2>
            <p style={{ fontSize: '24px', margin: '20px 0' }}>
                Count: <strong>{count}</strong>
            </p>
            <button onClick={() => setCount(count - 1)}>-</button>
            <button onClick={() => setCount(count + 1)}>+</button>
            <button onClick={() => setCount(0)}>Reset</button>
        </div>
    );
}

function App() {
    return (
        <div className="app">
            <div className="header">
                <h1>${projectName}</h1>
                <p>A React project created with Local IDE</p>
            </div>
            <Counter />
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));`);

    await this.writeFile(`${projectPath}/README.md`, `# ${projectName}

A React project created with Local IDE.

## Getting Started

Simply open \`index.html\` in your browser to see the app running.

## Features

- Interactive counter component
- Modern React hooks (useState)
- Responsive design
- No build process required

## Project Structure

- \`index.html\` - Main HTML file with React CDN links
- \`app.js\` - React components and application logic
- \`README.md\` - This file

## Development

This is a simple React setup using CDN links. For production applications, consider using a build tool like Create React App or Vite.
`);
  }

  private async createExpressProject(projectPath: string): Promise<void> {
    const projectName = projectPath.split('/').pop() || 'express-project';
    
    const packageJson = {
      name: projectName,
      version: "1.0.0",
      description: "An Express.js project created with Local IDE",
      main: "server.js",
      scripts: {
        start: "node server.js",
        dev: "nodemon server.js",
        test: "echo \"Error: no test specified\" && exit 1"
      },
      keywords: ["express", "nodejs", "server"],
      author: "",
      license: "ISC",
      dependencies: {
        express: "^4.18.2",
        cors: "^2.8.5",
        helmet: "^7.0.0"
      },
      devDependencies: {
        nodemon: "^3.0.1"
      }
    };

    await this.writeFile(`${projectPath}/package.json`, JSON.stringify(packageJson, null, 2));
    
    await this.writeFile(`${projectPath}/server.js`, `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static('public')); // Serve static files

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to ${projectName}!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/users', (req, res) => {
    // Example API endpoint
    res.json([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]);
});

app.post('/api/users', (req, res) => {
    // Example POST endpoint
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({
            error: 'Name and email are required'
        });
    }
    
    // In a real app, you would save to a database
    const newUser = {
        id: Date.now(),
        name,
        email,
        createdAt: new Date().toISOString()
    };
    
    res.status(201).json(newUser);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: \`Route \${req.method} \${req.url} not found\`
    });
});

app.listen(PORT, () => {
    console.log(\`🚀 Server is running on http://localhost:\${PORT}\`);
    console.log(\`📊 Health check: http://localhost:\${PORT}/api/health\`);
});
`);

    await this.writeFile(`${projectPath}/README.md`, `# ${projectName}

An Express.js server project created with Local IDE.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start the server
npm start

# Or run in development mode with nodemon
npm run dev
\`\`\`

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /api/health\` - Health check
- \`GET /api/users\` - Get all users (example)
- \`POST /api/users\` - Create a new user (example)

## Features

- Express.js framework
- CORS enabled
- Security headers with Helmet
- JSON and URL-encoded body parsing
- Static file serving
- Error handling middleware
- Example API endpoints

## Project Structure

- \`server.js\` - Main server file
- \`package.json\` - Project configuration and dependencies
- \`public/\` - Static files directory (create as needed)
- \`README.md\` - This file

## Environment Variables

You can set the following environment variables:

- \`PORT\` - Server port (default: 3000)

## Development

The server will restart automatically when you make changes if you use \`npm run dev\`.
`);

    // Create public directory with a simple index.html
    await this.createDirectory(`${projectPath}/public`);
    await this.writeFile(`${projectPath}/public/index.html`, `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .api-list { background: #f9f9f9; padding: 20px; border-radius: 4px; margin-top: 20px; }
        .endpoint { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid #007bff; }
        .method { font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${projectName}</h1>
        <p>Welcome to your Express.js server! This is a static file served from the <code>public</code> directory.</p>
        
        <div class="api-list">
            <h2>Available API Endpoints:</h2>
            <div class="endpoint">
                <span class="method">GET</span> /api/health - Server health check
            </div>
            <div class="endpoint">
                <span class="method">GET</span> /api/users - Get all users
            </div>
            <div class="endpoint">
                <span class="method">POST</span> /api/users - Create a new user
            </div>
        </div>
        
        <p><strong>Server Status:</strong> <span id="status">Checking...</span></p>
    </div>

    <script>
        // Check server status
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').textContent = 'Running ✅';
                document.getElementById('status').style.color = 'green';
            })
            .catch(error => {
                document.getElementById('status').textContent = 'Error ❌';
                document.getElementById('status').style.color = 'red';
            });
    </script>
</body>
</html>`);
  }

  private async createEmptyProject(projectPath: string): Promise<void> {
    const projectName = projectPath.split('/').pop() || 'empty-project';
    
    await this.writeFile(`${projectPath}/README.md`, `# ${projectName}

An empty project created with Local IDE.

## Getting Started

This is a blank project. You can start adding your files and building your application.

## Suggested Structure

\`\`\`
${projectName}/
├── src/           # Source code
├── docs/          # Documentation
├── tests/         # Test files
├── assets/        # Static assets
└── README.md      # This file
\`\`\`

Happy coding! 🚀
`);
  }

  // Menu Event Handlers
  setupMenuHandlers(callbacks: {
    onNewProject?: () => void;
    onOpenProject?: () => void;
    onSave?: () => void;
    onNewTerminal?: () => void;
  }): void {
    if (!this.isElectron) return;

    if (callbacks.onNewProject) {
      window.electronAPI.onMenuNewProject(callbacks.onNewProject);
    }
    if (callbacks.onOpenProject) {
      window.electronAPI.onMenuOpenProject(callbacks.onOpenProject);
    }
    if (callbacks.onSave) {
      window.electronAPI.onMenuSave(callbacks.onSave);
    }
    if (callbacks.onNewTerminal) {
      window.electronAPI.onMenuNewTerminal(callbacks.onNewTerminal);
    }
  }

  cleanup(): void {
    if (!this.isElectron) return;

    // Remove all event listeners
    window.electronAPI.removeAllListeners('menu-new-project');
    window.electronAPI.removeAllListeners('menu-open-project');
    window.electronAPI.removeAllListeners('menu-save');
    window.electronAPI.removeAllListeners('menu-new-terminal');
  }

  // Integration helpers for secure storage
  async storeIntegrationCredentials(integrationType: 'fantasma' | 'zebulon', credentials: {
    apiKey: string;
    endpoint?: string;
    [key: string]: any;
  }): Promise<boolean> {
    const service = `LocalIDE-${integrationType}`;
    const account = 'default';
    
    try {
      const credentialData = JSON.stringify(credentials);
      return await this.setSecurePassword(service, account, credentialData);
    } catch {
      return false;
    }
  }

  async retrieveIntegrationCredentials(integrationType: 'fantasma' | 'zebulon'): Promise<{
    apiKey: string;
    endpoint?: string;
    [key: string]: any;
  } | null> {
    const service = `LocalIDE-${integrationType}`;
    const account = 'default';
    
    try {
      const credentialData = await this.getSecurePassword(service, account);
      if (credentialData) {
        return JSON.parse(credentialData);
      }
    } catch {
      // Ignore parsing errors
    }
    
    return null;
  }

  async removeIntegrationCredentials(integrationType: 'fantasma' | 'zebulon'): Promise<boolean> {
    const service = `LocalIDE-${integrationType}`;
    const account = 'default';
    
    return await this.deleteSecurePassword(service, account);
  }
}

// Export singleton instance
export const electronService = ElectronService.getInstance();

// Helper functions
export const isElectron = () => electronService.isElectron;
export const getPlatform = () => electronService.platform;
export const readFile = (filePath: string) => electronService.readFile(filePath);
export const writeFile = (filePath: string, content: string) => electronService.writeFile(filePath, content);
export const readDirectory = (dirPath: string) => electronService.readDirectory(dirPath);
export const createDirectory = (dirPath: string) => electronService.createDirectory(dirPath);
export const executeCommand = (command: string, cwd?: string) => electronService.executeCommand(command, cwd);
export const executeCode = (language: string, code: string, projectPath?: string) => electronService.executeCode(language, code, projectPath);
export const selectProjectDirectory = () => electronService.selectProjectDirectory();
export const selectProjectFile = () => electronService.selectProjectFile();
export const saveFileAs = () => electronService.saveFileAs();

// Secure storage helpers
export const storeIntegrationCredentials = (type: 'fantasma' | 'zebulon', credentials: any) => 
  electronService.storeIntegrationCredentials(type, credentials);
export const retrieveIntegrationCredentials = (type: 'fantasma' | 'zebulon') => 
  electronService.retrieveIntegrationCredentials(type);
export const removeIntegrationCredentials = (type: 'fantasma' | 'zebulon') => 
  electronService.removeIntegrationCredentials(type);
