import bcrypt from 'bcryptjs';
import { hashPassword, compareOrMigratePassword } from '../password';

function fakeUser(password) {
  return { password, updateOne: jest.fn().mockResolvedValue({}) };
}

describe('password helpers', () => {
  test('hashPassword produces a bcrypt hash that is not the plain text', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare('secret123', hash)).toBe(true);
  });

  test('accepts a correct bcrypt password without rewriting it', async () => {
    const user = fakeUser(await bcrypt.hash('secret123', 4));
    expect(await compareOrMigratePassword(user, 'secret123')).toBe(true);
    expect(user.updateOne).not.toHaveBeenCalled();
  });

  test('rejects a wrong bcrypt password', async () => {
    const user = fakeUser(await bcrypt.hash('secret123', 4));
    expect(await compareOrMigratePassword(user, 'nope')).toBe(false);
  });

  test('legacy plain-text password logs in once and is upgraded to a hash', async () => {
    const user = fakeUser('plain-pass');
    expect(await compareOrMigratePassword(user, 'plain-pass')).toBe(true);
    expect(user.updateOne).toHaveBeenCalledTimes(1);
    const { $set } = user.updateOne.mock.calls[0][0];
    expect($set.password).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare('plain-pass', $set.password)).toBe(true);
  });

  test('wrong plain-text password fails and does not migrate', async () => {
    const user = fakeUser('plain-pass');
    expect(await compareOrMigratePassword(user, 'plain-xxxx')).toBe(false);
    expect(await compareOrMigratePassword(user, 'other')).toBe(false);
    expect(user.updateOne).not.toHaveBeenCalled();
  });

  test('empty or missing input fails', async () => {
    expect(await compareOrMigratePassword(fakeUser('x'), '')).toBe(false);
    expect(await compareOrMigratePassword(null, 'x')).toBe(false);
  });
});
