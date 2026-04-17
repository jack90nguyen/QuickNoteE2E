import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Note from '@/models/Note';
import { getUserFromSession } from '@/lib/auth';
import { noteUpsertSchema } from '@/lib/validators';

export async function GET() {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const notes = await Note.find({ userId: session.userId })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/notes failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = noteUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newNote = new Note({
      userId: session.userId,
      ...parsed.data,
    });

    await newNote.save();

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
