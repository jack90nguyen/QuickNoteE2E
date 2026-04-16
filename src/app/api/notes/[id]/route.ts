import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Note from '@/models/Note';
import { getUserFromSession } from '@/lib/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const note = await Note.findOne({ _id: params.id, userId: session.userId });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
      
    return NextResponse.json({ note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { title, content, isEncrypted, iv, tags } = body;
    
    const note = await Note.findOne({ _id: params.id, userId: session.userId });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (isEncrypted !== undefined) note.isEncrypted = isEncrypted;
    if (iv !== undefined) note.iv = iv;
    if (tags !== undefined) note.tags = tags;
    
    await note.save();
    
    return NextResponse.json({ note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const result = await Note.deleteOne({ _id: params.id, userId: session.userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}