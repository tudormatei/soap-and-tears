import { getDatabase } from './database';

async function initializeDatabase() {
  try {
    const db = getDatabase();
    await db.initialize();
    
    console.log('✅ Database initialized successfully!');
    
    // Display some stats
    const users = await db.getAllUsers();
    const chores = await db.getAllChores();
    const contracts = await db.getAllContracts();
    
    console.log(`📊 Database Stats:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Chores: ${chores.length}`);
    console.log(`   Contract entries: ${contracts.length}`);
    
    db.close();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase;
