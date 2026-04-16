import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      user: { 
        id: user._id, 
        email: user.email,
        kdfSalt: user.kdfSalt,
        encryptedMasterKey: user.encryptedMasterKey,
        masterKeyIv: user.masterKeyIv
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}