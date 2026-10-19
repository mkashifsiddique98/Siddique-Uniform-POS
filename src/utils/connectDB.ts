import mongoose from 'mongoose';
import { assertRuntimeEnv } from '@/lib/runtimeEnv';

assertRuntimeEnv();

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null; listening?: boolean };

const g = global as any;
const cached: Cache = g.mongoose ?? (g.mongoose = { conn: null, promise: null });

const OPTIONS = {
  serverSelectionTimeoutMS: 5000, // fail fast instead of hanging 30s
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  family: 4, // avoids "localhost" resolving to ::1 on Windows while mongod listens on 127.0.0.1
};

// Log connection events once so PM2 logs show what happened
if (!cached.listening) {
  cached.listening = true;
  mongoose.connection.on('connected', () => console.log('[mongo] connected'));
  mongoose.connection.on('disconnected', () => console.warn('[mongo] disconnected'));
  mongoose.connection.on('error', (e) => console.error('[mongo] error:', e.message));
}

async function dbConnect() {
  const state = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting

  if (state === 1) return mongoose; // healthy, reuse
  if (state === 0) cached.promise = null; // dropped or never connected: allow a fresh connect

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, OPTIONS).catch((err) => {
      cached.promise = null; // IMPORTANT: don't cache a failure, so the next request retries
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.conn = null;
    throw err;
  }
  return cached.conn;
}

export default dbConnect;