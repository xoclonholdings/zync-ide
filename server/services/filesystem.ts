import fs from 'fs/promises';
import path from 'path';
import { constants } from 'fs';

export interface FileSystemResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: Date;
}

export class FileSystemService {
  async readFile(filePath: string): Promise<FileSystemResult> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return {
        success: true,
        data: { content, path: filePath }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to read file: ${error.message}`
      };
    }
  }

  async writeFile(filePath: string, content: string): Promise<FileSystemResult> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(filePath, content, 'utf8');
      return {
        success: true,
        data: { path: filePath }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to write file: ${error.message}`
      };
    }
  }

  async readDirectory(dirPath: string): Promise<FileSystemResult> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items: FileInfo[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const stat = await fs.stat(fullPath);
        
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: entry.isFile() ? stat.size : undefined,
          lastModified: stat.mtime
        });
      }

      return {
        success: true,
        data: { items, path: dirPath }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to read directory: ${error.message}`
      };
    }
  }

  async createDirectory(dirPath: string): Promise<FileSystemResult> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return {
        success: true,
        data: { path: dirPath }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create directory: ${error.message}`
      };
    }
  }

  async deleteFile(filePath: string): Promise<FileSystemResult> {
    try {
      await fs.unlink(filePath);
      return {
        success: true,
        data: { path: filePath }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`
      };
    }
  }

  async deleteDirectory(dirPath: string): Promise<FileSystemResult> {
    try {
      await fs.rmdir(dirPath, { recursive: true });
      return {
        success: true,
        data: { path: dirPath }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to delete directory: ${error.message}`
      };
    }
  }

  async moveFile(sourcePath: string, targetPath: string): Promise<FileSystemResult> {
    try {
      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });
      
      await fs.rename(sourcePath, targetPath);
      return {
        success: true,
        data: { from: sourcePath, to: targetPath }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to move file: ${error.message}`
      };
    }
  }

  async copyFile(sourcePath: string, targetPath: string): Promise<FileSystemResult> {
    try {
      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      await fs.mkdir(targetDir, { recursive: true });
      
      await fs.copyFile(sourcePath, targetPath);
      return {
        success: true,
        data: { from: sourcePath, to: targetPath }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to copy file: ${error.message}`
      };
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(filePath: string): Promise<FileSystemResult> {
    try {
      const stats = await fs.stat(filePath);
      return {
        success: true,
        data: {
          path: filePath,
          size: stats.size,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get file stats: ${error.message}`
      };
    }
  }

  // Project template creation
  async createProjectFromTemplate(projectPath: string, template: string): Promise<FileSystemResult> {
    try {
      await fs.mkdir(projectPath, { recursive: true });

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

      return {
        success: true,
        data: { path: projectPath, template }
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create project: ${error.message}`
      };
    }
  }

  private async createNodeProject(projectPath: string): Promise<void> {
    const packageJson = {
      name: path.basename(projectPath),
      version: "1.0.0",
      description: "",
      main: "index.js",
      scripts: {
        test: "echo \"Error: no test specified\" && exit 1",
        start: "node index.js"
      },
      keywords: [],
      author: "",
      license: "ISC"
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    await fs.writeFile(
      path.join(projectPath, 'index.js'),
      `console.log('Hello, World!');
`
    );

    await fs.writeFile(
      path.join(projectPath, 'README.md'),
      `# ${path.basename(projectPath)}

A Node.js project.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`
`
    );
  }

  private async createPythonProject(projectPath: string): Promise<void> {
    await fs.writeFile(
      path.join(projectPath, 'main.py'),
      `#!/usr/bin/env python3

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`
    );

    await fs.writeFile(
      path.join(projectPath, 'requirements.txt'),
      `# Add your dependencies here
`
    );

    await fs.writeFile(
      path.join(projectPath, 'README.md'),
      `# ${path.basename(projectPath)}

A Python project.

## Getting Started

\`\`\`bash
pip install -r requirements.txt
python main.py
\`\`\`
`
    );
  }

  private async createReactProject(projectPath: string): Promise<void> {
    // This would ideally use create-react-app or similar
    // For now, create a minimal React setup
    await fs.writeFile(
      path.join(projectPath, 'index.html'),
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
</head>
<body>
    <div id="root"></div>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="app.js"></script>
</body>
</html>`
    );

    await fs.writeFile(
      path.join(projectPath, 'app.js'),
      `const { useState } = React;

function App() {
    const [count, setCount] = useState(0);

    return React.createElement('div', null,
        React.createElement('h1', null, 'Hello, React!'),
        React.createElement('p', null, \`Count: \${count}\`),
        React.createElement('button', {
            onClick: () => setCount(count + 1)
        }, 'Increment')
    );
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));`
    );
  }

  private async createExpressProject(projectPath: string): Promise<void> {
    const packageJson = {
      name: path.basename(projectPath),
      version: "1.0.0",
      description: "Express server",
      main: "server.js",
      scripts: {
        start: "node server.js",
        dev: "nodemon server.js"
      },
      dependencies: {
        express: "^4.18.0"
      },
      devDependencies: {
        nodemon: "^2.0.20"
      }
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    await fs.writeFile(
      path.join(projectPath, 'server.js'),
      `const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Hello, Express!' });
});

app.listen(port, () => {
    console.log(\`Server running at http://localhost:\${port}\`);
});`
    );
  }

  private async createEmptyProject(projectPath: string): Promise<void> {
    await fs.writeFile(
      path.join(projectPath, 'README.md'),
      `# ${path.basename(projectPath)}

An empty project. Start building!
`
    );
  }
}

export const filesystemService = new FileSystemService();
