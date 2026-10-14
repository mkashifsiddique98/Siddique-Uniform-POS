import mongoose from 'mongoose';
<<<<<<< HEAD
import { assertRuntimeEnv } from '@/lib/runtimeEnv';

assertRuntimeEnv();

const MONGODB_URI = process.env.MONGODB_URI || "";
=======

const MONGODB_URI = process.env.MONGODB_URI?process.env.MONGODB_URI:"";
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
