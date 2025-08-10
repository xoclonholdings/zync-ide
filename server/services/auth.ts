import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from '../storage-sqlite';
import { encryptionService } from './encryption';
import { type InsertUser, type User } from '@shared/schema-sqlite';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

export class AuthService {
  async register(userData: InsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const user = await storage.createUser({
      ...userData,
      password: userData.password // Store plain password for development
    });

    return user;
  }

  async login(username: string, password: string): Promise<{ 
    success: boolean; 
    token?: string; 
    user?: Omit<User, 'password'>; 
    error?: string 
  }> {
    try {
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // For development - simple password comparison for test users
      let isValidPassword = false;
      if ((username === 'admin' && password === 'admin') || 
          (username === 'admin_dgn' && password === 'admin123')) {
        isValidPassword = true;
      } else {
        try {
          // Try encrypted password first
          const decryptedPassword = await encryptionService.decryptSensitiveData(user.password);
          isValidPassword = await bcrypt.compare(password, decryptedPassword);
        } catch {
          // If decryption fails, try direct comparison (for development)
          isValidPassword = user.password === password;
        }
      }
      
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
      await storage.createSession(user.id, token, expiresAt);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        } as User
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async logout(token: string): Promise<void> {
    await storage.deleteSession(token);
  }

  async getCurrentUser(token: string): Promise<User> {
    if (!token) {
      throw new Error('No token provided');
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
      
      // Check session in storage
      const session = await storage.getSession(token);
      if (!session) {
        throw new Error('Invalid session');
      }

      // Get user
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await this.getCurrentUser(token);
      return true;
    } catch {
      return false;
    }
  }

  // Clean up expired sessions periodically
  async cleanupExpiredSessions(): Promise<void> {
    await storage.deleteExpiredSessions();
  }
}

export const authService = new AuthService();

// Set up periodic cleanup
setInterval(() => {
  authService.cleanupExpiredSessions().catch(console.error);
}, 60 * 60 * 1000); // Every hour
