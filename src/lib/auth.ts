import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = (() => {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  return 'dev-only-fallback-secret-do-not-use-in-prod';
})();

export interface SessionPayload {
  userId: string;
  tokenVersion: number;
}

export function signToken(payload: SessionPayload, remember: boolean = false) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: remember ? '365d' : '7d',
  });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getUserFromSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token) as Partial<SessionPayload> | null;
  if (!decoded?.userId || typeof decoded.tokenVersion !== 'number') {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(decoded.userId).select('tokenVersion').lean<{ tokenVersion: number } | null>();
  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    return null;
  }

  return { userId: decoded.userId, tokenVersion: decoded.tokenVersion };
}

export async function setAuthCookie(token: string, remember: boolean = false) {
  const cookieStore = await cookies();
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  cookieStore.set(
    'auth-token',
    token,
    remember ? { ...base, maxAge: 365 * 24 * 60 * 60 } : base,
  );
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
