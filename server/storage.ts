import { 
  users, projects, files, integrations, sessions, userSettings,
  type User, type InsertUser, 
  type Project, type InsertProject,
  type File, type InsertFile,
  type Integration, type InsertIntegration,
  type Session
} from "@shared/schema";
// Switch to PostgreSQL for enhanced performance
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject & { userId: number }): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByProjectId(projectId: number): Promise<File[]>;
  getFileByPath(projectId: number, path: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;

  // Integration operations
  getIntegration(id: number): Promise<Integration | undefined>;
  getIntegrationsByUserId(userId: number): Promise<Integration[]>;
  getIntegrationByType(userId: number, type: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration & { userId: number }): Promise<Integration>;
  updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: number): Promise<boolean>;

  // Session operations
  getSession(token: string): Promise<Session | undefined>;
  createSession(userId: number, token: string, expiresAt: Date): Promise<Session>;
  deleteSession(token: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<void>;
  
  // User Settings operations
  getUserSettings(userId: number): Promise<any>;
  saveUserSettings(userId: number, settings: any): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(project: InsertProject & { userId: number }): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount! > 0;
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getFilesByProjectId(projectId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.projectId, projectId));
  }

  async getFileByPath(projectId: number, path: string): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, path)));
    return file;
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined> {
    const [updatedFile] = await db
      .update(files)
      .set({ ...file, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return result.rowCount! > 0;
  }

  // Integration operations
  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration;
  }

  async getIntegrationsByUserId(userId: number): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async getIntegrationByType(userId: number, type: string): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.type, type)));
    return integration;
  }

  async createIntegration(integration: InsertIntegration & { userId: number }): Promise<Integration> {
    const [newIntegration] = await db.insert(integrations).values(integration).returning();
    return newIntegration;
  }

  async updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [updatedIntegration] = await db
      .update(integrations)
      .set({ ...integration, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updatedIntegration;
  }

  async deleteIntegration(id: number): Promise<boolean> {
    const result = await db.delete(integrations).where(eq(integrations.id, id));
    return result.rowCount! > 0;
  }

  // Session operations
  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session;
  }

  async createSession(userId: number, token: string, expiresAt: Date): Promise<Session> {
    const [newSession] = await db
      .insert(sessions)
      .values({ userId, token, expiresAt })
      .returning();
    return newSession;
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.token, token));
    return result.rowCount! > 0;
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(sessions).where(eq(sessions.expiresAt, now));
  }

  // User Settings operations
  async getUserSettings(userId: number): Promise<any> {
    try {
      const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
      return settings?.settings || {};
    } catch (error) {
      console.error('[storage] Error getting user settings:', error);
      return {};
    }
  }

  async saveUserSettings(userId: number, settings: any): Promise<boolean> {
    try {
      await db
        .insert(userSettings)
        .values({
          userId,
          settings,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: {
            settings,
            updatedAt: new Date()
          }
        });
      return true;
    } catch (error) {
      console.error('[storage] Error saving user settings:', error);
      return false;
    }
  }
}

// Create instance with PostgreSQL database storage
export const storage = new DatabaseStorage();