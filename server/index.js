import express from 'express';
import dotenv from 'dotenv';
import './database.js';  // This will initialize the database
import { pool } from './database.js';

dotenv.config();

const app = express();
app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Store summary endpoint
app.post('/api/store-summary', async (req, res) => {
  try {
    const { conversation_id, summary } = req.body;
    
    if (!conversation_id || !summary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO call_summaries (conversation_id, summary)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await pool.query(query, [conversation_id, summary]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error storing summary:', error);
    res.status(500).json({ error: 'Failed to store summary' });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 