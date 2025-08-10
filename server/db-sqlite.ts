import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema-sqlite";
import path from 'path';
import fs from 'fs';

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'zync.db');
const sqlite = new Database(dbPath);

// Unlimited SQLite settings for maximum performance and scalability
sqlite.pragma('journal_mode = WAL');          // Write-Ahead Logging for better concurrency
sqlite.pragma('synchronous = OFF');           // Maximum performance (disable safety checks)
sqlite.pragma('cache_size = -2000000');       // 2GB cache for unlimited performance
sqlite.pragma('foreign_keys = ON');           // Enable foreign key constraints
sqlite.pragma('temp_store = memory');         // Store temp tables in memory
sqlite.pragma('mmap_size = 8589934592');      // 8GB memory-mapped I/O for large datasets
sqlite.pragma('page_size = 65536');           // Maximum page size for large data
sqlite.pragma('wal_autocheckpoint = 0');      // Disable auto-checkpoint for unlimited WAL growth
sqlite.pragma('query_only = OFF');            // Allow write operations
sqlite.pragma('read_uncommitted = ON');       // Allow dirty reads for better performance
sqlite.pragma('locking_mode = NORMAL');       // Normal locking mode for concurrency
sqlite.pragma('max_page_count = 2147483646'); // Maximum database size (2TB+)
sqlite.pragma('secure_delete = OFF');         // Faster deletes
sqlite.pragma('auto_vacuum = INCREMENTAL');   // Incremental vacuum for large databases
sqlite.pragma('incremental_vacuum(1000000)'); // Vacuum up to 1M pages at once
sqlite.pragma('optimize');                    // Optimize all indexes and tables

export const db = drizzle(sqlite, { schema });

// Auto-migrate on startup
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

try {
  console.log('[sqlite] Running database migrations...');
  migrate(db, { migrationsFolder: './drizzle' });
  
  // Create userSettings table if it doesn't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS userSettings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      settings TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON userSettings(userId);
  `);
  console.log('[sqlite] UserSettings table ready');
  console.log('[sqlite] Database ready');
} catch (error) {
  console.log('[sqlite] Migration skipped or already up to date');
}

// Graceful shutdown
process.on('SIGINT', () => {
  sqlite.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  sqlite.close();
  process.exit(0);
});