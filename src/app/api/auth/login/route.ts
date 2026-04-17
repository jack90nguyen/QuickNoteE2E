import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';
import { loginApiSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const parsed = loginApiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { email, password, remember } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ userId: user._id.toString() }, remember);
    await setAuthCookie(token, remember);
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user._id, 
        email: user.email,
        kdfSalt: user.kdfSalt,
        encryptedMasterKey: user.encryptedMasterKey,
        masterKeyIv: user.masterKeyIv
      } 
    });
  } catch (error) {
    console.error('POST /api/auth/login failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}