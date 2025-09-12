import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function POST() {
  try {
    const db = getDatabase();
    await db.resetDatabase();
    
    return NextResponse.json({ 
      message: 'Database reset successfully',
      status: 'success'
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    );
  }
}
