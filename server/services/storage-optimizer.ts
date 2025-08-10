import { storage } from '../storage-sqlite';

/**
 * Storage optimization service for background maintenance tasks
 */
export class StorageOptimizer {
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start periodic cleanup tasks
   */
  start() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      await this.performMaintenance();
    }, 60 * 60 * 1000); // 1 hour
    
    // Run initial cleanup after 5 minutes
    setTimeout(() => {
      this.performMaintenance().catch(console.error);
    }, 5 * 60 * 1000);
    
    console.log('[storage] Optimizer started - periodic maintenance enabled');
  }
  
  /**
   * Stop periodic cleanup tasks
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[storage] Optimizer stopped');
    }
  }
  
  /**
   * Run all maintenance tasks
   */
  async performMaintenance() {
    console.log('[storage] Running maintenance tasks...');
    
    try {
      // Clean expired sessions
      await storage.deleteExpiredSessions();
      
      // Get storage statistics
      const stats = await storage.getStorageStats();
      console.log('[storage] Current stats:', stats);
      
      // Optimize database every 24 hours (check if it's been long enough)
      const now = Date.now();
      const lastOptimization = this.getLastOptimizationTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      if (now - lastOptimization > oneDayMs) {
        console.log('[storage] Running database optimization...');
        await storage.optimizeDatabase();
        this.setLastOptimizationTime(now);
      }
      
      console.log('[storage] Maintenance completed successfully');
    } catch (error) {
      console.error('[storage] Maintenance failed:', error);
    }
  }

  private getLastOptimizationTime(): number {
    try {
      const stored = (global as any).__lastDbOptimization;
      return stored || 0;
    } catch {
      return 0;
    }
  }

  private setLastOptimizationTime(time: number): void {
    try {
      (global as any).__lastDbOptimization = time;
    } catch (error) {
      console.error('[storage] Could not set optimization time:', error);
    }
  }
  
  /**
   * Get storage statistics
   */
  async getStats() {
    // This could be expanded to return database size, table sizes, etc.
    return {
      timestamp: new Date().toISOString(),
      status: 'optimized'
    };
  }
}

export const storageOptimizer = new StorageOptimizer();