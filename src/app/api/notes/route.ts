import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Note from '@/models/Note';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch user's notes, sorted by updated date descending
    const notes = await Note.find({ userId: session.userId })
      .sort({ updatedAt: -1 });
      
    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { title, content, isEncrypted, iv, tags } = body;
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    const newNote = new Note({
      userId: session.userId,
      title,
      content: content || '',
      isEncrypted: !!isEncrypted,
      iv,
      tags: tags || [],
    });
    
    await newNote.save();
    
    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}