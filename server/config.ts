import fs from 'fs';
import path from 'path';

interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  path?: string;
  url?: string;
  sqlite?: {
    cacheSize: number;
    mmapSize: number;
    walAutocheckpoint: number;
    synchronous: string;
    journalMode: string;
  };
  backup?: {
    enabled: boolean;
    interval: string;
    retention: number;
    path: string;
  };
}

interface ServerConfig {
  port: number;
  host: string;
  cors?: {
    enabled: boolean;
    origins: string[];
  };
  rateLimit?: {
    enabled: boolean;
    windowMs: number;
    max: number;
  };
}

interface AuthConfig {
  jwtSecret: string;
  sessionTimeout: string;
  maxLoginAttempts: number;
  lockoutDuration: string;
  requireEmailVerification: boolean;
}

interface IntegrationConfig {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  timeout: number;
}

interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  storage: {
    maxFileSize: string;
    maxProjectSize: string;
    allowedFileTypes: string[];
    compression: {
      enabled: boolean;
      algorithm: string;
      level: number;
    };
  };
  integrations: {
    fantasmaFirewall: IntegrationConfig;
    zebulonOracle: IntegrationConfig;
  };
  features: {
    terminal: {
      enabled: boolean;
      allowedCommands: string[];
      maxOutputLines: number;
    };
    codeExecution: {
      enabled: boolean;
      timeout: number;
      memoryLimit: string;
    };
    fileWatcher: {
      enabled: boolean;
      debounceMs: number;
    };
  };
  security: {
    contentSecurityPolicy: {
      enabled: boolean;
      directives: Record<string, string[]>;
    };
    helmet: {
      enabled: boolean;
      options: Record<string, any>;
    };
  };
  monitoring: {
    logging: {
      level: string;
      file: string;
      maxSize: string;
      maxFiles: number;
    };
    metrics: {
      enabled: boolean;
      interval: string;
    };
  };
  ui: {
    theme: {
      default: string;
      allowToggle: boolean;
    };
    branding: {
      appName: string;
      logoPath: string;
      favicon: string;
    };
    editor: {
      defaultLanguage: string;
      fontSize: number;
      tabSize: number;
      wordWrap: string;
      minimap: boolean;
    };
  };
}

class ConfigManager {
  private config: Config;
  private configPath: string;

  constructor() {
    const env = process.env.NODE_ENV || 'development';
    this.configPath = path.join(process.cwd(), 'config');
    this.config = this.loadConfig(env);
  }

  private loadConfig(env: string): Config {
    try {
      // Load default config
      const defaultConfigPath = path.join(this.configPath, 'default.json');
      const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));

      // Load environment specific config if it exists
      const envConfigPath = path.join(this.configPath, `${env}.json`);
      let envConfig = {};
      
      if (fs.existsSync(envConfigPath)) {
        envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
      }

      // Load local config overrides if they exist
      const localConfigPath = path.join(this.configPath, 'local.json');
      let localConfig = {};
      
      if (fs.existsSync(localConfigPath)) {
        localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
      }

      // Merge configs (local overrides env, env overrides default)
      const mergedConfig = this.deepMerge(defaultConfig, envConfig, localConfig);

      // Override with environment variables
      this.applyEnvironmentOverrides(mergedConfig);

      console.log(`[config] Loaded configuration for environment: ${env}`);
      return mergedConfig;
    } catch (error) {
      console.error('[config] Failed to load configuration:', error);
      throw new Error('Configuration loading failed');
    }
  }

  private deepMerge(...objects: any[]): any {
    return objects.reduce((prev, obj) => {
      if (obj === null || obj === undefined) return prev;
      
      Object.keys(obj).forEach(key => {
        const pVal = prev[key];
        const oVal = obj[key];

        if (Array.isArray(pVal) && Array.isArray(oVal)) {
          prev[key] = oVal;
        } else if (pVal !== null && typeof pVal === 'object' && oVal !== null && typeof oVal === 'object') {
          prev[key] = this.deepMerge(pVal, oVal);
        } else {
          prev[key] = oVal;
        }
      });

      return prev;
    }, {});
  }

  private applyEnvironmentOverrides(config: any): void {
    // Server overrides
    if (process.env.PORT) config.server.port = parseInt(process.env.PORT, 10);
    if (process.env.HOST) config.server.host = process.env.HOST;

    // Database overrides
    if (process.env.DATABASE_URL) {
      config.database.type = 'postgresql';
      config.database.url = process.env.DATABASE_URL;
    }
    if (process.env.DB_PATH) config.database.path = process.env.DB_PATH;

    // Auth overrides
    if (process.env.JWT_SECRET) config.auth.jwtSecret = process.env.JWT_SECRET;

    // Integration overrides
    if (process.env.FANTASMA_ENDPOINT) config.integrations.fantasmaFirewall.endpoint = process.env.FANTASMA_ENDPOINT;
    if (process.env.FANTASMA_API_KEY) config.integrations.fantasmaFirewall.apiKey = process.env.FANTASMA_API_KEY;
    if (process.env.ZEBULON_ENDPOINT) config.integrations.zebulonOracle.endpoint = process.env.ZEBULON_ENDPOINT;
    if (process.env.ZEBULON_API_KEY) config.integrations.zebulonOracle.apiKey = process.env.ZEBULON_API_KEY;
  }

  public get(): Config {
    return this.config;
  }

  public reload(): void {
    const env = process.env.NODE_ENV || 'development';
    this.config = this.loadConfig(env);
  }

  public validate(): boolean {
    try {
      // Validate required fields
      if (!this.config.auth.jwtSecret || this.config.auth.jwtSecret === 'your-secret-key-change-this') {
        console.warn('[config] WARNING: Using default JWT secret. Change this in production!');
      }

      if (this.config.server.port < 1 || this.config.server.port > 65535) {
        throw new Error('Invalid server port');
      }

      console.log('[config] Configuration validation passed');
      return true;
    } catch (error) {
      console.error('[config] Configuration validation failed:', error);
      return false;
    }
  }

  public getIntegrationConfig(name: 'fantasmaFirewall' | 'zebulonOracle'): IntegrationConfig {
    return this.config.integrations[name];
  }

  public isFeatureEnabled(feature: string): boolean {
    const parts = feature.split('.');
    let current: any = this.config.features;
    
    for (const part of parts) {
      if (current[part] === undefined) return false;
      current = current[part];
    }
    
    return current === true;
  }
}

export const configManager = new ConfigManager();
export type { Config, IntegrationConfig };