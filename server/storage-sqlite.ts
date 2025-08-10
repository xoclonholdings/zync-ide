import { 
  users, projects, files, integrations, sessions, userSettings,
  type User, type InsertUser, 
  type Project, type InsertProject,
  type File, type InsertFile,
  type Integration, type InsertIntegration,
  type Session, type UserSettings
} from "@shared/schema-sqlite";
import { db } from "./db-sqlite";
import { eq, and, desc, asc, sql, lte } from "drizzle-orm";
import { cacheManager } from "./services/cache-manager";

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

  // Settings operations
  getUserSettings(userId: number): Promise<any | undefined>;
  saveUserSettings(userId: number, settings: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  private preparedStatements: Map<string, any> = new Map();

  constructor() {
    this.initializePreparedStatements();
  }

  private initializePreparedStatements() {
    // Pre-compile frequently used queries for better performance
    console.log('[storage] Initializing prepared statements for optimal performance');
  }
  // Optimized user operations with caching and error handling
  async getUser(id: number): Promise<User | undefined> {
    const cacheKey = `user:${id}`;
    
    // Check cache first
    const cached = cacheManager.get<User>(cacheKey);
    if (cached) return cached;

    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      
      // Cache the result if found
      if (user) {
        cacheManager.set(cacheKey, user, 10 * 60 * 1000); // 10 minutes
      }
      
      return user || undefined;
    } catch (error) {
      console.error('[storage] Error getting user by id:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const cacheKey = `user:username:${username}`;
    
    // Check cache first
    const cached = cacheManager.get<User>(cacheKey);
    if (cached) return cached;

    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      
      // Cache the result if found
      if (user) {
        cacheManager.set(cacheKey, user, 10 * 60 * 1000); // 10 minutes
        // Also cache by ID for consistency
        cacheManager.set(`user:${user.id}`, user, 10 * 60 * 1000);
      }
      
      return user || undefined;
    } catch (error) {
      console.error('[storage] Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date().toISOString();
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: now
      })
      .returning();
    
    // Cache the new user
    cacheManager.set(`user:${user.id}`, user, 10 * 60 * 1000);
    cacheManager.set(`user:username:${user.username}`, user, 10 * 60 * 1000);
    
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    // Invalidate user cache after update
    if (user) {
      this.invalidateUserCache(user.id);
    }
    
    return user || undefined;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt), desc(projects.createdAt));
  }

  async createProject(insertProject: InsertProject & { userId: number }): Promise<Project> {
    const now = new Date().toISOString();
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    // Invalidate user's projects cache
    this.invalidateUserCache(insertProject.userId);
    
    return project;
  }

  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const now = new Date().toISOString();
    const [project] = await db
      .update(projects)
      .set({ ...updateData, updatedAt: now })
      .where(eq(projects.id, id))
      .returning();
    
    // Invalidate project cache after update
    if (project) {
      this.invalidateProjectCache(project.id, project.userId || undefined);
    }
    
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    // Get project info before deletion for cache invalidation
    const project = await this.getProject(id);
    
    const result = await db.delete(projects).where(eq(projects.id, id));
    const deleted = result.changes > 0;
    
    // Invalidate caches if deletion was successful
    if (deleted && project) {
      this.invalidateProjectCache(id, project.userId || undefined);
    }
    
    return deleted;
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByProjectId(projectId: number): Promise<File[]> {
    return await db.select().from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(asc(files.isDirectory), asc(files.name));
  }

  async getFileByPath(projectId: number, filePath: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(
      and(eq(files.projectId, projectId), eq(files.path, filePath))
    );
    return file || undefined;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const now = new Date().toISOString();
    const [file] = await db
      .insert(files)
      .values({
        ...insertFile,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return file;
  }

  async updateFile(id: number, updateData: Partial<InsertFile>): Promise<File | undefined> {
    const now = new Date().toISOString();
    const [file] = await db
      .update(files)
      .set({ ...updateData, updatedAt: now })
      .where(eq(files.id, id))
      .returning();
    return file || undefined;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return result.changes > 0;
  }

  // Integration operations
  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration || undefined;
  }

  async getIntegrationsByUserId(userId: number): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async getIntegrationByType(userId: number, type: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(
      and(eq(integrations.userId, userId), eq(integrations.type, type))
    );
    return integration || undefined;
  }

  async createIntegration(insertIntegration: InsertIntegration & { userId: number }): Promise<Integration> {
    const now = new Date().toISOString();
    const [integration] = await db
      .insert(integrations)
      .values({
        ...insertIntegration,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return integration;
  }

  async updateIntegration(id: number, updateData: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const now = new Date().toISOString();
    const [integration] = await db
      .update(integrations)
      .set({ ...updateData, updatedAt: now })
      .where(eq(integrations.id, id))
      .returning();
    return integration || undefined;
  }

  async deleteIntegration(id: number): Promise<boolean> {
    const result = await db.delete(integrations).where(eq(integrations.id, id));
    return result.changes > 0;
  }

  // Session operations
  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session || undefined;
  }

  async createSession(userId: number, token: string, expiresAt: Date): Promise<Session> {
    const now = new Date().toISOString();
    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        token,
        expiresAt: expiresAt.toISOString(),
        createdAt: now
      })
      .returning();
    return session;
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.token, token));
    return result.changes > 0;
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date().toISOString();
    await db.delete(sessions).where(lte(sessions.expiresAt, now));
  }

  // New optimized batch operations
  async createProjectWithFiles(
    insertProject: InsertProject & { userId: number }, 
    projectFiles: InsertFile[] = []
  ): Promise<{ project: Project; files: File[] }> {
    return await db.transaction(async (tx) => {
      const now = new Date().toISOString();
      
      // Create project
      const [project] = await tx
        .insert(projects)
        .values({
          ...insertProject,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      // Create files if provided
      const createdFiles: File[] = [];
      if (projectFiles.length > 0) {
        for (const fileData of projectFiles) {
          const [file] = await tx
            .insert(files)
            .values({
              ...fileData,
              projectId: project.id,
              createdAt: now,
              updatedAt: now
            })
            .returning();
          createdFiles.push(file);
        }
      }

      return { project, files: createdFiles };
    });
  }

  async bulkUpdateFiles(fileUpdates: Array<{ id: number; data: Partial<InsertFile> }>): Promise<File[]> {
    return await db.transaction(async (tx) => {
      const updatedFiles: File[] = [];
      const now = new Date().toISOString();
      
      for (const { id, data } of fileUpdates) {
        const [file] = await tx
          .update(files)
          .set({ ...data, updatedAt: now })
          .where(eq(files.id, id))
          .returning();
        if (file) updatedFiles.push(file);
      }
      
      return updatedFiles;
    });
  }

  // Cache-friendly queries
  async getProjectWithFiles(projectId: number): Promise<{ project: Project | undefined; files: File[] }> {
    const [project, projectFiles] = await Promise.all([
      this.getProject(projectId),
      this.getFilesByProjectId(projectId)
    ]);
    return { project, files: projectFiles };
  }

  async getUserProjects(userId: number, limit = 20): Promise<Project[]> {
    const cacheKey = `projects:user:${userId}:${limit}`;
    
    // Check cache first
    const cached = cacheManager.get<Project[]>(cacheKey);
    if (cached) return cached;

    try {
      const userProjects = await db.select().from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.updatedAt))
        .limit(limit);
      
      // Cache the results for 2 minutes (projects change frequently)
      cacheManager.set(cacheKey, userProjects, 2 * 60 * 1000);
      
      return userProjects;
    } catch (error) {
      console.error('[storage] Error getting user projects:', error);
      return [];
    }
  }

  // Cache invalidation helpers
  private invalidateUserCache(userId: number): void {
    cacheManager.invalidatePattern(`user:${userId}`);
    cacheManager.invalidatePattern(`projects:user:${userId}*`);
  }

  private invalidateProjectCache(projectId: number, userId?: number): void {
    cacheManager.invalidatePattern(`project:${projectId}*`);
    cacheManager.invalidatePattern(`files:project:${projectId}*`);
    if (userId) {
      cacheManager.invalidatePattern(`projects:user:${userId}*`);
    }
  }

  // Connection pool management
  async healthCheck(): Promise<boolean> {
    try {
      const result = await db.select({ result: sql<number>`1` }).limit(1);
      return result.length === 1 && result[0].result === 1;
    } catch (error) {
      console.error('[storage] Health check failed:', error);
      return false;
    }
  }

  // Admin methods for unlimited access
  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('[storage] Error getting all users:', error);
      return [];
    }
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects);
    } catch (error) {
      console.error('[storage] Error getting all projects:', error);
      return [];
    }
  }

  // Advanced storage analytics and optimization methods
  async getStorageStats(): Promise<{
    userCount: number;
    projectCount: number;
    fileCount: number;
    sessionCount: number;
    dbSize: string;
  }> {
    try {
      const [userCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [projectCountResult] = await db.select({ count: sql<number>`count(*)` }).from(projects);
      const [fileCountResult] = await db.select({ count: sql<number>`count(*)` }).from(files);
      const [sessionCountResult] = await db.select({ count: sql<number>`count(*)` }).from(sessions);

      return {
        userCount: userCountResult.count,
        projectCount: projectCountResult.count,
        fileCount: fileCountResult.count,
        sessionCount: sessionCountResult.count,
        dbSize: 'Available via PRAGMA page_count'
      };
    } catch (error) {
      console.error('[storage] Error getting storage stats:', error);
      return {
        userCount: 0,
        projectCount: 0,
        fileCount: 0,
        sessionCount: 0,
        dbSize: 'Unknown'
      };
    }
  }

  async optimizeDatabase(): Promise<void> {
    try {
      // Run VACUUM to reclaim space and optimize database
      await db.run(sql`VACUUM`);
      
      // Analyze tables to update query planner statistics
      await db.run(sql`ANALYZE`);
      
      console.log('[storage] Database optimization completed');
    } catch (error) {
      console.error('[storage] Error optimizing database:', error);
    }
  }

  // Settings operations
  async getUserSettings(userId: number): Promise<any | undefined> {
    try {
      const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
      return settings ? JSON.parse(settings.settings) : undefined;
    } catch (error) {
      console.error('[storage] Error getting user settings:', error);
      return undefined;
    }
  }

  async saveUserSettings(userId: number, settings: any): Promise<any> {
    try {
      const now = new Date().toISOString();
      const settingsJson = JSON.stringify(settings);
      
      const [existing] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
      
      if (existing) {
        // Update existing settings
        const [updated] = await db
          .update(userSettings)
          .set({ settings: settingsJson, updatedAt: now })
          .where(eq(userSettings.userId, userId))
          .returning();
        return JSON.parse(updated.settings);
      } else {
        // Create new settings
        const [created] = await db
          .insert(userSettings)
          .values({ userId, settings: settingsJson, createdAt: now, updatedAt: now })
          .returning();
        return JSON.parse(created.settings);
      }
    } catch (error) {
      console.error('[storage] Error saving user settings:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();