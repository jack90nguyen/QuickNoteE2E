import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';
import { registerApiSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerApiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, kdfSalt, encryptedMasterKey, masterKeyIv, remember } = parsed.data;

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      passwordHash,
      kdfSalt,
      encryptedMasterKey,
      masterKeyIv,
    });

    await user.save();

    const token = signToken({ userId: user._id.toString() }, remember);
    await setAuthCookie(token, remember);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/register failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
