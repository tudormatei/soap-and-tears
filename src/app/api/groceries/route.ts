import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = getDatabase();
    await db.initialize();
    
    const groceries = await db.getAllGroceries();
    
    return NextResponse.json({ groceries });
  } catch (error) {
    console.error('Error fetching groceries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groceries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, addedBy } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    await db.initialize();
    
    const groceryId = await db.createGroceryItem(name, addedBy);
    
    return NextResponse.json({ 
      message: 'Grocery item added successfully',
      groceryId 
    });
  } catch (error) {
    console.error('Error creating grocery item:', error);
    return NextResponse.json(
      { error: 'Failed to create grocery item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    await db.initialize();
    
    await db.deleteGroceryItem(id);
    
    return NextResponse.json({ 
      message: 'Grocery item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting grocery item:', error);
    return NextResponse.json(
      { error: 'Failed to delete grocery item' },
      { status: 500 }
    );
  }
}

