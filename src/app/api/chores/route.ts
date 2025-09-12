import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = getDatabase();
    await db.initialize();
    
    const chores = await db.getAllChores();
    
    return NextResponse.json({ chores });
  } catch (error) {
    console.error('Error fetching chores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, frequency } = await request.json();
    
    if (!name || !frequency) {
      return NextResponse.json(
        { error: 'Name and frequency are required' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    await db.initialize();
    
    const choreId = await db.createChore(name, description || '', frequency);
    
    return NextResponse.json({ 
      message: 'Chore created successfully',
      choreId 
    });
  } catch (error) {
    console.error('Error creating chore:', error);
    return NextResponse.json(
      { error: 'Failed to create chore' },
      { status: 500 }
    );
  }
}
