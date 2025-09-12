import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Database interface types
export interface User {
  id: string;
  name: string;
}

export interface Chore {
  id: string;
  name: string;
  description: string;
  frequency: string;
}

export interface Contract {
  id: string;
  uid: string;
  cid: string;
  completed_date: string;
  created_at: Timestamp;
  user_name?: string;
  chore_name?: string;
}

export interface ContractStats {
  user_name: string;
  chore_name: string;
  completion_count: number;
  last_completed: string;
}

class Database {
  private usersCollection = collection(db, 'users');
  private choresCollection = collection(db, 'chores');
  private contractsCollection = collection(db, 'contracts');

  async initialize(): Promise<void> {
    try {
      // Check if data exists, if not initialize with sample data
      const usersSnapshot = await getDocs(this.usersCollection);
      console.log(`Found ${usersSnapshot.size} users in database`);
      
      if (usersSnapshot.empty) {
        console.log('Initializing sample data...');
        await this.initializeSampleData();
        console.log('Sample data initialization complete');
      } else {
        console.log('Database already has data, skipping initialization');
      }
    } catch (error) {
      console.error('Error during database initialization:', error);
      throw error;
    }
  }

  private async initializeSampleData(): Promise<void> {
    // Insert sample users
    await addDoc(this.usersCollection, { name: 'Tudor' });
    await addDoc(this.usersCollection, { name: 'Harveer' });
    await addDoc(this.usersCollection, { name: 'Carlos' });

    // Insert sample chores
    await addDoc(this.choresCollection, {
      name: 'Stove area',
      description: 'under and around the burners, wall grease',
      frequency: 'Daily'
    });
    await addDoc(this.choresCollection, {
      name: 'Vacuum',
      description: 'Vacuum ground floor + stairs + broom for kitchen',
      frequency: 'Weekly'
    });
    await addDoc(this.choresCollection, {
      name: 'Mop',
      description: 'just ground floor',
      frequency: 'Weekly'
    });
    await addDoc(this.choresCollection, {
      name: 'Trash',
      description: 'Take out garbage and recycling',
      frequency: 'Weekly'
    });
    await addDoc(this.choresCollection, {
      name: 'Dust Wiping',
      description: 'Wiping down counters (full kitchen, dining table)',
      frequency: 'Daily'
    });
    await addDoc(this.choresCollection, {
      name: 'Toilet',
      description: 'Full clean',
      frequency: 'Weekly'
    });
  }

  // User operations
  async getAllUsers(): Promise<User[]> {
    const snapshot = await getDocs(query(this.usersCollection, orderBy('name')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  }

  async getUserById(uid: string): Promise<User | null> {
    const docRef = doc(this.usersCollection, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as User;
    }
    return null;
  }

  async createUser(name: string): Promise<string> {
    const docRef = await addDoc(this.usersCollection, { name });
    return docRef.id;
  }

  // Chore operations
  async getAllChores(): Promise<Chore[]> {
    const snapshot = await getDocs(query(this.choresCollection, orderBy('name')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Chore));
  }

  async getChoreById(cid: string): Promise<Chore | null> {
    const docRef = doc(this.choresCollection, cid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Chore;
    }
    return null;
  }

  async createChore(name: string, description: string, frequency: string): Promise<string> {
    const docRef = await addDoc(this.choresCollection, {
      name,
      description,
      frequency
    });
    return docRef.id;
  }

  // Contract operations
  async getAllContracts(): Promise<Contract[]> {
    const snapshot = await getDocs(query(this.contractsCollection, orderBy('completed_date', 'desc')));
    const contracts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const user = await this.getUserById(data.uid);
        const chore = await this.getChoreById(data.cid);
        
        return {
          id: doc.id,
          uid: data.uid,
          cid: data.cid,
          completed_date: data.completed_date,
          created_at: data.created_at,
          user_name: user?.name,
          chore_name: chore?.name
        } as Contract;
      })
    );
    return contracts;
  }

  async getContractsByUser(uid: string): Promise<Contract[]> {
    const q = query(
      this.contractsCollection,
      where('uid', '==', uid),
      orderBy('completed_date', 'desc')
    );
    const snapshot = await getDocs(q);
    const contracts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const user = await this.getUserById(data.uid);
        const chore = await this.getChoreById(data.cid);
        
        return {
          id: doc.id,
          uid: data.uid,
          cid: data.cid,
          completed_date: data.completed_date,
          created_at: data.created_at,
          user_name: user?.name,
          chore_name: chore?.name
        } as Contract;
      })
    );
    return contracts;
  }

  async getContractsByChore(cid: string): Promise<Contract[]> {
    const q = query(
      this.contractsCollection,
      where('cid', '==', cid),
      orderBy('completed_date', 'desc')
    );
    const snapshot = await getDocs(q);
    const contracts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const user = await this.getUserById(data.uid);
        const chore = await this.getChoreById(data.cid);
        
        return {
          id: doc.id,
          uid: data.uid,
          cid: data.cid,
          completed_date: data.completed_date,
          created_at: data.created_at,
          user_name: user?.name,
          chore_name: chore?.name
        } as Contract;
      })
    );
    return contracts;
  }

  async createContract(uid: string, cid: string, completedDate: string): Promise<string> {
    const docRef = await addDoc(this.contractsCollection, {
      uid,
      cid,
      completed_date: completedDate,
      created_at: serverTimestamp()
    });
    return docRef.id;
  }

  // Utility methods
  async getContractStats(): Promise<ContractStats[]> {
    const contracts = await this.getAllContracts();
    const statsMap = new Map();
    
    contracts.forEach(contract => {
      const key = `${contract.uid}-${contract.cid}`;
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          user_name: contract.user_name,
          chore_name: contract.chore_name,
          completion_count: 0,
          last_completed: contract.completed_date
        });
      }
      const stat = statsMap.get(key);
      stat.completion_count++;
      if (contract.completed_date > stat.last_completed) {
        stat.last_completed = contract.completed_date;
      }
    });
    
    return Array.from(statsMap.values()).sort((a, b) => 
      a.user_name.localeCompare(b.user_name) || a.chore_name.localeCompare(b.chore_name)
    );
  }

  // Clear all data (for development/reset purposes)
  async clearAllData(): Promise<void> {
    console.log('Clearing all data...');
    
    // Clear contracts first (due to foreign key relationships)
    const contractsSnapshot = await getDocs(this.contractsCollection);
    for (const docSnap of contractsSnapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
    
    // Clear chores
    const choresSnapshot = await getDocs(this.choresCollection);
    for (const docSnap of choresSnapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
    
    // Clear users
    const usersSnapshot = await getDocs(this.usersCollection);
    for (const docSnap of usersSnapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
    
    console.log('All data cleared');
  }

  // Reset database with fresh sample data
  async resetDatabase(): Promise<void> {
    await this.clearAllData();
    await this.initializeSampleData();
    console.log('Database reset complete');
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