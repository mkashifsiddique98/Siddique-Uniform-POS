import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function compareOrMigratePassword(user, suppliedPassword) {
  if (!user || !suppliedPassword) {
    return false;
  }

  const storedPassword = String(user.password || '');

  if (storedPassword.startsWith('$2') || storedPassword.startsWith('$2a') || storedPassword.startsWith('$2b')) {
    const matches = await bcrypt.compare(suppliedPassword, storedPassword);
    return matches;
  }

  const suppliedBuffer = Buffer.from(suppliedPassword);
  const storedBuffer = Buffer.from(storedPassword);

  if (suppliedBuffer.length !== storedBuffer.length) {
    return false;
  }

  const matches = timingSafeEqual(suppliedBuffer, storedBuffer);

  if (matches) {
    const nextHash = await bcrypt.hash(suppliedPassword, 10);
    await user.updateOne({ $set: { password: nextHash } });
  }

  return matches;
}
