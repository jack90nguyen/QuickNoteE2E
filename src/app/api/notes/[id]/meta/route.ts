import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Note from '@/models/Note';
import { getUserFromSession } from '@/lib/auth';

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const note = await Note.findOne({ _id: params.id, userId: session.userId })
      .select('updatedAt')
      .lean<{ updatedAt: Date } | null>();

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ updatedAt: note.updatedAt });
  } catch (error) {
    console.error('GET /api/notes/[id]/meta failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
