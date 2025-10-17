const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const timetableRoutes = require('./routes/timetableRoutes');
const chatRoutes = require('./routes/chatRoutes');

console.log('[Server] Starting initialization...');

// Load environment variables only if .env file exists (not needed on Vercel)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

console.log('[Config] Environment variables loaded');
console.log('[Config] MONGODB_URI:', process.env.MONGODB_URI ? 'Configured' : 'Missing');
console.log('[Config] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Configured' : 'Missing');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('[Middleware] CORS and JSON parsing configured');

// MongoDB Connection with proper options
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
    .then(() => console.log('[Database] Successfully connected to MongoDB Atlas'))
    .catch((err) => {
      console.error('[Database] Connection failed:', err.message);
    });

  // Monitor connection errors
  mongoose.connection.on('error', (err) => {
    console.error('[Database] Runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Connection lost - will attempt to reconnect');
  });
} else {
  console.warn('[Database] MONGODB_URI not configured - database operations will fail');
}

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Timetable API is running!' });
});

// Routes
app.use('/api/timetable', timetableRoutes);
app.use('/api/chat', chatRoutes);

// Start server only if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('[Server] Application running on http://localhost:' + PORT);
    console.log('[Server] Ready to accept requests');
  });
}

// Export for serverless environments (Vercel)
module.exports = app;
