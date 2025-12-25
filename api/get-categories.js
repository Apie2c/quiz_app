// ============================================
// FILE 8: api/get-categories.js
// ============================================
import { connectToDatabase } from './db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    
    const data = await collection.findOne({ _id: 'quiz-categories' });
    
    if (data && data.categories) {
      res.status(200).json({ success: true, categories: data.categories });
    } else {
      res.status(200).json({ success: false, message: 'No data found' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}