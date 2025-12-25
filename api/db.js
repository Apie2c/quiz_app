// ============================================
// FILE 7: api/db.js (Database Connection)
// ============================================
import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('quizapp');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}