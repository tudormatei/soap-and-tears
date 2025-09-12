import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const choreId = searchParams.get('choreId');
    
    const db = getDatabase();
    await db.initialize();
    
    let contracts;
    if (userId) {
      contracts = await db.getContractsByUser(parseInt(userId));
    } else if (choreId) {
      contracts = await db.getContractsByChore(parseInt(choreId));
    } else {
      contracts = await db.getAllContracts();
    }
    
    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, cid, completedDate } = await request.json();
    
    if (!uid || !cid || !completedDate) {
      return NextResponse.json(
        { error: 'User ID, Chore ID, and completed date are required' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    await db.initialize();
    
    const contractId = await db.createContract(uid, cid, completedDate);
    
    return NextResponse.json({ 
      message: 'Contract created successfully',
      contractId 
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
