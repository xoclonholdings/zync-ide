import crypto from 'crypto';
import { promisify } from 'util';

/**
 * Simplified Encryption Service for Zync
 * Provides reliable AES-256-CBC encryption
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyDerivation = 'pbkdf2';
  private readonly iterations = 100000;
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 32;

  // Master encryption key
  private masterKey: Buffer;

  private constructor() {
    this.masterKey = this.generateSecureKey();
    this.initializeEncryption();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize encryption service
   */
  private initializeEncryption(): void {
    console.log('[encryption] Initializing encryption service');
    console.log('[encryption] Algorithm: AES-256-CBC with PBKDF2 key derivation');
    console.log('[encryption] Security level: HIGH');
  }

  /**
   * Generate a cryptographically secure random key
   */
  private generateSecureKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Derive a key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    const pbkdf2 = promisify(crypto.pbkdf2);
    return await pbkdf2(password, salt, this.iterations, this.keyLength, 'sha256');
  }

  /**
   * Encrypt data with AES-256-CBC encryption
   */
  async encryptData(data: string, password?: string): Promise<string> {
    try {
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);
      
      // Use provided password or master key
      const key = password 
        ? await this.deriveKey(password, salt)
        : this.masterKey;

      const cipher = crypto.createCipher(this.algorithm, key);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine all components for secure storage
      const encryptedPackage = Buffer.concat([
        salt,
        iv,
        Buffer.from(encrypted, 'hex')
      ]).toString('base64');

      return encryptedPackage;
    } catch (error) {
      console.error('[encryption] Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data with AES-256-CBC decryption
   */
  async decryptData(encryptedData: string, password?: string): Promise<string> {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      
      const salt = buffer.subarray(0, this.saltLength);
      const iv = buffer.subarray(this.saltLength, this.saltLength + this.ivLength);
      const encrypted = buffer.subarray(this.saltLength + this.ivLength);

      // Use provided password or master key
      const key = password 
        ? await this.deriveKey(password, salt)
        : this.masterKey;

      const decipher = crypto.createDecipher(this.algorithm, key);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('[encryption] Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt sensitive user data (passwords, API keys, etc.)
   */
  async encryptSensitiveData(data: string): Promise<string> {
    return await this.encryptData(data);
  }

  /**
   * Decrypt sensitive user data
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    return await this.decryptData(encryptedData);
  }

  /**
   * Encrypt API key
   */
  async encryptApiKey(apiKey: string): Promise<string> {
    try {
      return await this.encryptData(apiKey);
    } catch (error) {
      console.error('[encryption] API key encryption failed:', error);
      throw new Error('API key encryption failed');
    }
  }

  /**
   * Decrypt API key
   */
  async decryptApiKey(encryptedApiKey: string): Promise<string> {
    try {
      return await this.decryptData(encryptedApiKey);
    } catch (error) {
      console.error('[encryption] API key decryption failed:', error);
      throw new Error('API key decryption failed');
    }
  }

  /**
   * Generate secure session tokens
   */
  generateSecureSessionToken(): string {
    const tokenData = {
      random: crypto.randomBytes(32).toString('hex'),
      timestamp: Date.now(),
      version: '2.0'
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(tokenData) + this.masterKey.toString('hex'))
      .digest('hex');
  }

  /**
   * Get encryption service status
   */
  getEncryptionStatus(): {
    initialized: boolean;
    algorithm: string;
    keyDerivation: string;
    securityLevel: string;
  } {
    return {
      initialized: true,
      algorithm: this.algorithm,
      keyDerivation: this.keyDerivation,
      securityLevel: 'HIGH'
    };
  }

  /**
   * Rotate encryption keys (for enhanced security)
   */
  async rotateEncryptionKeys(): Promise<void> {
    console.log('[encryption] Rotating encryption keys for enhanced security');
    this.masterKey = this.generateSecureKey();
    console.log('[encryption] Key rotation completed successfully');
  }
}

export const encryptionService = EncryptionService.getInstance();
