import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { email, password, kdfSalt, encryptedMasterKey, masterKeyIv } = body;
    
    if (!email || !password || !kdfSalt || !encryptedMasterKey || !masterKeyIv) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
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
    
    const token = signToken({ userId: user._id.toString() });
    await setAuthCookie(token);
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user._id, 
        email: user.email 
      } 
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}