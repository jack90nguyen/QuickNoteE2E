import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ApiToken from '@/models/ApiToken';
import { getUserFromSession } from '@/lib/auth';
import { apiTokenCreateSchema } from '@/lib/validators';
import { generateApiToken, hashApiToken } from '@/lib/mcp-auth';

export async function GET() {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const tokens = await ApiToken.find({ userId: session.userId })
      .select('name prefix lastUsedAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('GET /api/auth/tokens failed', error);
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
    const parsed = apiTokenCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { raw, prefix } = generateApiToken();
    const tokenHash = await hashApiToken(raw);

    const doc = await ApiToken.create({
      userId: session.userId,
      name: parsed.data.name,
      prefix,
      tokenHash,
    });

    return NextResponse.json(
      {
        token: raw,
        record: {
          _id: doc._id,
          name: doc.name,
          prefix: doc.prefix,
          createdAt: doc.createdAt,
          lastUsedAt: doc.lastUsedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/tokens failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
