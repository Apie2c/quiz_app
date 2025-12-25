// ============================================
// FILE 9: api/save-categories.js
// ============================================
import { connectToDatabase } from './db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { categories } = req.body;
    
    if (!categories) {
      return res.status(400).json({ success: false, error: 'No categories provided' });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    
    await collection.updateOne(
      { _id: 'quiz-categories' },
      { $set: { categories, updatedAt: new Date() } },
      { upsert: true }
    );
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}