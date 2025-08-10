import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface TerminalResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

export interface TerminalSession {
  id: string;
  process?: ChildProcess;
  cwd: string;
  isActive: boolean;
}

export class TerminalService extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private sessionCounter = 0;

  async executeCommand(command: string, cwd?: string): Promise<TerminalResult> {
    return new Promise((resolve) => {
      const workingDir = cwd || process.cwd();
      
      // Parse command and arguments
      const [cmd, ...args] = this.parseCommand(command);
      
      const child = spawn(cmd, args, {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0
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

      // Set timeout to prevent hanging processes
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
        
        resolve({
          success: false,
          error: 'Command timeout (60 seconds)',
          stdout,
          stderr
        });
      }, 60000);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  createSession(cwd?: string): string {
    const id = `session_${++this.sessionCounter}_${Date.now()}`;
    const session: TerminalSession = {
      id,
      cwd: cwd || process.cwd(),
      isActive: true
    };
    
    this.sessions.set(id, session);
    return id;
  }

  async executeInSession(sessionId: string, command: string): Promise<TerminalResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    if (!session.isActive) {
      return {
        success: false,
        error: 'Session is not active'
      };
    }

    // Update session CWD if command changes directory
    if (command.trim().startsWith('cd ')) {
      const newPath = command.trim().substring(3).trim();
      if (newPath) {
        session.cwd = newPath;
      }
    }

    return this.executeCommand(command, session.cwd);
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  closeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.isActive = false;
    if (session.process && !session.process.killed) {
      session.process.kill();
    }

    this.sessions.delete(sessionId);
    return true;
  }

  private parseCommand(command: string): string[] {
    // Simple command parsing - in a real implementation you'd want more robust parsing
    const parts = command.trim().split(/\s+/);
    return parts;
  }

  // Get available shell environments
  async getAvailableShells(): Promise<string[]> {
    const shells = [];
    
    // Check for common shells
    const commonShells = ['bash', 'zsh', 'fish', 'sh'];
    
    for (const shell of commonShells) {
      try {
        const result = await this.executeCommand(`which ${shell}`);
        if (result.success && result.stdout?.trim()) {
          shells.push(shell);
        }
      } catch {
        // Shell not available
      }
    }

    return shells;
  }

  // Get system information
  async getSystemInfo(): Promise<any> {
    const info: any = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cwd: process.cwd()
    };

    try {
      // Get OS info
      if (process.platform === 'darwin') {
        const result = await this.executeCommand('sw_vers');
        info.osVersion = result.stdout;
      } else if (process.platform === 'linux') {
        const result = await this.executeCommand('cat /etc/os-release');
        info.osVersion = result.stdout;
      } else if (process.platform === 'win32') {
        const result = await this.executeCommand('ver');
        info.osVersion = result.stdout;
      }

      // Get available shells
      info.availableShells = await this.getAvailableShells();

      // Get environment variables (filtered for security)
      info.environment = {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        USER: process.env.USER,
        SHELL: process.env.SHELL
      };

    } catch (error) {
      info.error = 'Failed to get some system information';
    }

    return info;
  }

  // Execute common development commands
  async installDependencies(projectPath: string, packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm'): Promise<TerminalResult> {
    const commands = {
      npm: 'npm install',
      yarn: 'yarn install',
      pnpm: 'pnpm install'
    };

    return this.executeCommand(commands[packageManager], projectPath);
  }

  async runScript(projectPath: string, scriptName: string, packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm'): Promise<TerminalResult> {
    const commands = {
      npm: `npm run ${scriptName}`,
      yarn: `yarn ${scriptName}`,
      pnpm: `pnpm run ${scriptName}`
    };

    return this.executeCommand(commands[packageManager], projectPath);
  }

  async initializeGitRepo(projectPath: string): Promise<TerminalResult> {
    return this.executeCommand('git init', projectPath);
  }

  async gitStatus(projectPath: string): Promise<TerminalResult> {
    return this.executeCommand('git status', projectPath);
  }
}

export const terminalService = new TerminalService();
