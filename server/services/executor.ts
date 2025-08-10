import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export interface ExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

export class ExecutorService {
  async executeCode(language: string, code: string, projectPath?: string): Promise<ExecutionResult> {
    const workingDir = projectPath || process.cwd();

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'node':
      case 'nodejs':
        return this.executeJavaScript(code, workingDir);
      
      case 'python':
      case 'python3':
        return this.executePython(code, workingDir);
      
      case 'typescript':
      case 'ts':
        return this.executeTypeScript(code, workingDir);
      
      default:
        return {
          success: false,
          error: `Unsupported language: ${language}`
        };
    }
  }

  private async executeJavaScript(code: string, workingDir: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const child = spawn('node', ['-e', code], {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code ?? 1
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          stdout,
          stderr
        });
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        resolve({
          success: false,
          error: 'Execution timeout (30 seconds)',
          stdout,
          stderr
        });
      }, 30000);
    });
  }

  private async executePython(code: string, workingDir: string): Promise<ExecutionResult> {
    try {
      // Create temporary file
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'python-exec-'));
      const tempFile = path.join(tempDir, 'script.py');
      await fs.writeFile(tempFile, code);

      return new Promise((resolve) => {
        const child = spawn('python3', [tempFile], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', async (code) => {
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
            await fs.rmdir(tempDir);
          } catch {}

          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code ?? 1
          });
        });

        child.on('error', async (error) => {
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
            await fs.rmdir(tempDir);
          } catch {}

          resolve({
            success: false,
            error: error.message,
            stdout,
            stderr
          });
        });

        // Set timeout
        setTimeout(() => {
          child.kill();
          resolve({
            success: false,
            error: 'Execution timeout (30 seconds)',
            stdout,
            stderr
          });
        }, 30000);
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async executeTypeScript(code: string, workingDir: string): Promise<ExecutionResult> {
    try {
      // Create temporary file
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ts-exec-'));
      const tempFile = path.join(tempDir, 'script.ts');
      await fs.writeFile(tempFile, code);

      return new Promise((resolve) => {
        // Use ts-node to execute TypeScript directly
        const child = spawn('npx', ['ts-node', tempFile], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', async (code) => {
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
            await fs.rmdir(tempDir);
          } catch {}

          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code ?? 1
          });
        });

        child.on('error', async (error) => {
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
            await fs.rmdir(tempDir);
          } catch {}

          resolve({
            success: false,
            error: error.message,
            stdout,
            stderr
          });
        });

        // Set timeout
        setTimeout(() => {
          child.kill();
          resolve({
            success: false,
            error: 'Execution timeout (30 seconds)',
            stdout,
            stderr
          });
        }, 30000);
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAvailableRuntimes(): Promise<string[]> {
    const runtimes = [];

    // Check for Node.js
    try {
      await this.executeCommand('node --version');
      runtimes.push('javascript', 'nodejs');
    } catch {}

    // Check for Python
    try {
      await this.executeCommand('python3 --version');
      runtimes.push('python', 'python3');
    } catch {}

    // Check for TypeScript
    try {
      await this.executeCommand('npx ts-node --version');
      runtimes.push('typescript');
    } catch {}

    return runtimes;
  }

  private executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, { stdio: 'ignore' });
      
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command failed with code ${code}`));
      });

      child.on('error', reject);
    });
  }
}

export const executorService = new ExecutorService();
