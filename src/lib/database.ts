import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// Database interface types
export interface User {
  uid: number;
  name: string;
}

export interface Chore {
  cid: number;
  name: string;
  description: string;
  frequency: string;
}

export interface Contract {
  contract_id: number;
  uid: number;
  cid: number;
  completed_date: string;
}

class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'chores.db');
    this.db = new sqlite3.Database(dbPath);
  }

  private async run(sql: string, params?: any[]): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  private async all(sql: string, params?: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  private async get(sql: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params || [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async initialize(): Promise<void> {
    // Ensure data directory exists
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create tables
    await this.createTables();
    
    // Check if data exists, if not initialize with sample data
    const userCount = await this.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      await this.initializeSampleData();
    }
  }

  private async createTables(): Promise<void> {
    // Create users table
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        uid INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    // Create chores table
    await this.run(`
      CREATE TABLE IF NOT EXISTS chores (
        cid INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT NOT NULL
      )
    `);

    // Create contract table (many-to-many relationship with completion tracking)
    await this.run(`
      CREATE TABLE IF NOT EXISTS contract (
        contract_id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid INTEGER NOT NULL,
        cid INTEGER NOT NULL,
        completed_date TEXT NOT NULL,
        FOREIGN KEY (uid) REFERENCES users (uid),
        FOREIGN KEY (cid) REFERENCES chores (cid)
      )
    `);

    // Create indexes for better performance
    await this.run('CREATE INDEX IF NOT EXISTS idx_contract_uid ON contract(uid)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_contract_cid ON contract(cid)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_contract_date ON contract(completed_date)');
  }

  private async initializeSampleData(): Promise<void> {
    // Insert sample users
    await this.run('INSERT INTO users (name) VALUES (?)', ['Tudor']);
    await this.run('INSERT INTO users (name) VALUES (?)', ['Harveer']);
    await this.run('INSERT INTO users (name) VALUES (?)', ['Carlos']);

    // Insert sample chores
    await this.run('INSERT INTO chores (name, description, frequency) VALUES (?, ?, ?)', 
      ['Stove area', 'under and around the burners, wall grease', 'Daily']);
    await this.run('INSERT INTO chores (name, description, frequency) VALUES (?, ?, ?)', 
      ['Vacuum', 'Vacuum ground floor + stairs + broom for kitchen', 'Weekly']);
    await this.run('INSERT INTO chores (name, description, frequency) VALUES (?, ?, ?)', 
      ['Mop', 'just ground floor', 'Weekly']);
    await this.run('INSERT INTO chores (name, description, frequency) VALUES (?, ?, ?)', 
      ['Trash', 'Take out garbage and recycling', 'Weekly']);
    await this.run('INSERT INTO chores (name, description, frequency) VALUES (?, ?, ?)', 
      ['Dust Wiping', 'Wiping down counters (full kitchen, dining table)', 'Daily']);
    await this.run('INSERT INTO chores (name, description, frequency) VALUES (?, ?, ?)', 
      ['Toilet', 'Full clean', 'Weekly']);
  }

  // User operations
  async getAllUsers(): Promise<User[]> {
    return await this.all('SELECT * FROM users ORDER BY name');
  }

  async getUserById(uid: number): Promise<User | null> {
    return await this.get('SELECT * FROM users WHERE uid = ?', [uid]);
  }

  async createUser(name: string): Promise<number> {
    const result = await this.run('INSERT INTO users (name) VALUES (?)', [name]);
    return result.lastID;
  }

  // Chore operations
  async getAllChores(): Promise<Chore[]> {
    return await this.all('SELECT * FROM chores ORDER BY name');
  }

  async getChoreById(cid: number): Promise<Chore | null> {
    return await this.get('SELECT * FROM chores WHERE cid = ?', [cid]);
  }

  async createChore(name: string, description: string, frequency: string): Promise<number> {
    const result = await this.run('INSERT INTO chores (name, description, frequency) VALUES (?, ?, ?)', 
      [name, description, frequency]);
    return result.lastID;
  }

  // Contract operations
  async getAllContracts(): Promise<Contract[]> {
    return await this.all(`
      SELECT c.*, u.name as user_name, ch.name as chore_name 
      FROM contract c
      JOIN users u ON c.uid = u.uid
      JOIN chores ch ON c.cid = ch.cid
      ORDER BY c.completed_date DESC
    `);
  }

  async getContractsByUser(uid: number): Promise<Contract[]> {
    return await this.all(`
      SELECT c.*, u.name as user_name, ch.name as chore_name 
      FROM contract c
      JOIN users u ON c.uid = u.uid
      JOIN chores ch ON c.cid = ch.cid
      WHERE c.uid = ?
      ORDER BY c.completed_date DESC
    `, [uid]);
  }

  async getContractsByChore(cid: number): Promise<Contract[]> {
    return await this.all(`
      SELECT c.*, u.name as user_name, ch.name as chore_name 
      FROM contract c
      JOIN users u ON c.uid = u.uid
      JOIN chores ch ON c.cid = ch.cid
      WHERE c.cid = ?
      ORDER BY c.completed_date DESC
    `, [cid]);
  }

  async createContract(uid: number, cid: number, completedDate: string): Promise<number> {
    const result = await this.run(
      'INSERT INTO contract (uid, cid, completed_date) VALUES (?, ?, ?)', 
      [uid, cid, completedDate]
    );
    return result.lastID;
  }

  // Utility methods
  async getContractStats(): Promise<any[]> {
    return await this.all(`
      SELECT 
        u.name as user_name,
        ch.name as chore_name,
        COUNT(*) as completion_count,
        MAX(c.completed_date) as last_completed
      FROM contract c
      JOIN users u ON c.uid = u.uid
      JOIN chores ch ON c.cid = ch.cid
      GROUP BY u.uid, ch.cid
      ORDER BY u.name, ch.name
    `);
  }

  close(): void {
    this.db.close();
  }
}

// Create a singleton instance
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

export default Database;
