import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Note from '@/models/Note';
import { getUserFromSession } from '@/lib/auth';
import { notePatchSchema } from '@/lib/validators';

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const note = await Note.findOne({ _id: params.id, userId: session.userId }).lean();
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('GET /api/notes/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = notePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const note = await Note.findOne({ _id: params.id, userId: session.userId });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    Object.assign(note, parsed.data);
    await note.save();

    return NextResponse.json({ note });
  } catch (error) {
    console.error('PUT /api/notes/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
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
  } catch (error) {
    console.error('DELETE /api/notes/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
