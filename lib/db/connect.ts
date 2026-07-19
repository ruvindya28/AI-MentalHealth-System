import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Reused across hot-reloads in dev and across route handler invocations
// so we don't open a new connection per request.
declare global {
    var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
    if (cache.conn) {
        return cache.conn;
    }

    if (!MONGODB_URI) {
        throw new Error(
            "MONGODB_URI is not set. Add it to .env.local (see .env.example)."
        );
    }

    if (!cache.promise) {
        cache.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        });
    }

    try {
        cache.conn = await cache.promise;
    } catch (err) {
        cache.promise = null;
        throw err;
    }

    return cache.conn;
}
