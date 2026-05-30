import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ApiToken from '@/models/ApiToken';
import { getUserFromSession } from '@/lib/auth';

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const result = await ApiToken.deleteOne({ _id: params.id, userId: session.userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/auth/tokens/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
