import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Note from '@/models/Note';

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();

    const note = await Note.findOne({ _id: params.id }).lean();
    
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.isEncrypted) {
      return NextResponse.json({ error: 'Encrypted notes cannot be shared' }, { status: 403 });
    }

    return NextResponse.json({ 
      title: note.title,
      content: note.content,
      updatedAt: note.updatedAt
    });
  } catch (error) {
    console.error('GET /api/shared/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
