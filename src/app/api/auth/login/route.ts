import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const token = signToken({ userId: user._id.toString() });
    await setAuthCookie(token);
    
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