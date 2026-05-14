import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, keyLength);

  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, savedHash) {
  const [salt, key] = savedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = await scrypt(password, salt, keyLength);

  return timingSafeEqual(keyBuffer, derivedKey);
}
