const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database only
const database = require('./models/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// Test database
app.get('/api/test-db', async (req, res) => {
  try {
    const users = await database.all('SELECT * FROM users LIMIT 5');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await database.init();
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`Simple server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
  }
}

startServer();
