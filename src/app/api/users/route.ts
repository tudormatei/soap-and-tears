import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    console.log('API: Starting users fetch...');
    const db = getDatabase();
    console.log('API: Database instance created');
    
    await db.initialize();
    console.log('API: Database initialized');
    
    const users = await db.getAllUsers();
    console.log('API: Users fetched:', users.length);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('API: Error fetching users:', error);
    console.error('API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code || 'unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    await db.initialize();
    
    const userId = await db.createUser(name);
    
    return NextResponse.json({ 
      message: 'User created successfully',
      userId 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
