// Quick script to create admin user in SQLite database
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, 'data', 'zync.db');
const db = new Database(dbPath);

async function createAdmin() {
  try {
    // Create admin_dgn user with simple password for development
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (username, email, password, createdAt, updatedAt) 
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    stmt.run('admin_dgn', 'admin@dgn.com', 'admin123'); // Simple password for dev
    
    console.log('Created admin_dgn user with password: admin123');
    
    // List all users
    const users = db.prepare('SELECT username, email, createdAt FROM users').all();
    console.log('All users:', users);
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    db.close();
  }
}

createAdmin();