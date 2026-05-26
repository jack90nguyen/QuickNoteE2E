import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getUserFromSession, signToken, setAuthCookie } from '@/lib/auth';
import { changePasswordApiSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordApiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { currentPassword, newPassword, kdfSalt, encryptedMasterKey, masterKeyIv } = parsed.data;

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.kdfSalt = kdfSalt;
    user.encryptedMasterKey = encryptedMasterKey;
    user.masterKeyIv = masterKeyIv;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    const token = signToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion }, false);
    await setAuthCookie(token, false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/auth/change-password failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
