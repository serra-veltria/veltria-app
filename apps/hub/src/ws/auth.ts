import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { getBeingsCollection } from '../db/mongo';
import { JwtPayload } from '@veltria/shared';

export function generateToken(beingId: string, orgId: string = 'default'): string {
  return jwt.sign({ beingId, orgId, role: 'being' }, config.jwt.secret, { expiresIn: '30d' });
}

export function verifyToken(token: string): { beingId: string; orgId: string } | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return {
      beingId: decoded.beingId || decoded.userId,
      orgId: decoded.orgId || 'default',
    };
  } catch (err) {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function authenticateWebSocket(
  beingId: string,
  token: string
): Promise<boolean> {
  const beings = getBeingsCollection();
  const tokenHash = hashToken(token);
  
  const being = await beings.findOne({ id: beingId, tokenHash });
  return being !== null;
}
