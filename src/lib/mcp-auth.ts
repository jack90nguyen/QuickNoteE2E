import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import ApiToken from '@/models/ApiToken';

export const TOKEN_PREFIX_LENGTH = 11;

export function generateApiToken(): { raw: string; prefix: string } {
  const random = randomBytes(32).toString('base64url');
  const raw = `qn_${random}`;
  const prefix = raw.slice(0, TOKEN_PREFIX_LENGTH);
  return { raw, prefix };
}

export async function hashApiToken(raw: string): Promise<string> {
  return bcrypt.hash(raw, 10);
}

export async function authenticateBearer(
  req: Request
): Promise<{ userId: string } | null> {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const raw = match[1].trim();
  if (!raw.startsWith('qn_') || raw.length < TOKEN_PREFIX_LENGTH + 8) return null;

  const prefix = raw.slice(0, TOKEN_PREFIX_LENGTH);

  await connectToDatabase();

  const candidates = await ApiToken.find({ prefix }).lean<
    Array<{ _id: unknown; userId: unknown; tokenHash: string }>
  >();
  if (candidates.length === 0) return null;

  for (const candidate of candidates) {
    const ok = await bcrypt.compare(raw, candidate.tokenHash);
    if (ok) {
      ApiToken.updateOne({ _id: candidate._id }, { $set: { lastUsedAt: new Date() } })
        .exec()
        .catch((err) => console.error('Failed to update lastUsedAt', err));
      return { userId: String(candidate.userId) };
    }
  }

  return null;
}
