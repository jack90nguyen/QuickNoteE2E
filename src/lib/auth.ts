import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = (() => {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production.');
  }
  return 'dev-only-fallback-secret-do-not-use-in-prod';
})();

export function signToken(payload: object, remember: boolean = false) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: remember ? '365d' : '7d',
  });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token) as { userId: string } | null;
  if (!decoded) {
    return null;
  }

  return decoded;
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
