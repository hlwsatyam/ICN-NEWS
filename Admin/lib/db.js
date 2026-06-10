import { MongoClient } from 'mongodb';

let client;
let clientPromise;
let indexesEnsured = false;

if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.MONGO_URL);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function getDb() {
  const c = await clientPromise;
  const db = c.db(process.env.DB_NAME || 'indian_crime_news');
  
  // Ensure indexes once per server lifecycle for performance
  if (!indexesEnsured) {
    indexesEnsured = true;
    try {
      // Users collection indexes
      await Promise.all([
        db.collection('users').createIndex({ createdAt: -1 }),
        db.collection('users').createIndex({ role: 1, createdAt: -1 }),
        db.collection('users').createIndex({ paymentStatus: 1, createdAt: -1 }),
        db.collection('users').createIndex({ membershipStatus: 1, createdAt: -1 }),
        db.collection('users').createIndex({ email: 1 }, { sparse: true }),
        db.collection('users').createIndex({ referralCode: 1 }),
        db.collection('users').createIndex({ mobile: 1 }),
        db.collection('users').createIndex({ name: 1 }),
        db.collection('users').createIndex({ applicationStatus: 1 }),
        // Compound indexes for common admin filter combos
        db.collection('users').createIndex({ membershipStatus: 1, role: 1, createdAt: -1 }),
        db.collection('users').createIndex({ role: 1, paymentStatus: 1, createdAt: -1 }),
        // News collection indexes
        db.collection('news').createIndex({ createdAt: -1 }),
        db.collection('news').createIndex({ status: 1, createdAt: -1 }),
        db.collection('news').createIndex({ reporterId: 1, createdAt: -1 }),
        db.collection('news').createIndex({ state: 1, status: 1, createdAt: -1 }),
        db.collection('news').createIndex({ category: 1, status: 1, createdAt: -1 }),
        db.collection('news').createIndex({ isFeatured: 1, featuredUntil: 1 }),
        db.collection('news').createIndex({ headline: 'text' }),
        // Other collections
        db.collection('payouts').createIndex({ userId: 1, createdAt: -1 }),
        db.collection('payouts').createIndex({ status: 1, createdAt: -1 }),
        db.collection('ads').createIndex({ reporterId: 1, createdAt: -1 }),
        db.collection('ads').createIndex({ status: 1, createdAt: -1 }),
        db.collection('breaking').createIndex({ createdAt: -1 }),
        db.collection('social').createIndex({ createdAt: -1 }),
        db.collection('tasks').createIndex({ assignedTo: 1, createdAt: -1 }),
        db.collection('posts').createIndex({ state: 1, status: 1 }),
      ]);
      console.log('[DB] Indexes ensured');
    } catch (err) {
      console.warn('[DB] Index creation warning (non-fatal):', err.message);
      indexesEnsured = false; // retry on next request
    }
  }
  
  return db;
}
