const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const timetableRoutes = require('./routes/timetableRoutes');
const chatRoutes = require('./routes/chatRoutes');

console.log('[Server] Starting initialization...');

// Load environment variables from backend/.env (only for local development)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

console.log('[Config] Environment variables loaded');
console.log('[Config] PORT:', process.env.PORT);
console.log('[Config] MONGODB_URI:', process.env.MONGODB_URI ? 'Configured' : 'Missing');
console.log('[Config] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Configured' : 'Missing');
console.log('[Config] NODE_ENV:', process.env.NODE_ENV);

// Verify environment variables exist
if (!process.env.MONGODB_URI) {
  console.error('[Config] ERROR: MONGODB_URI is not set!');
}
if (!process.env.GEMINI_API_KEY) {
  console.error('[Config] ERROR: GEMINI_API_KEY is not set!');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('[Middleware] CORS and JSON parsing configured');

// MongoDB Connection with proper options
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
})
  .then(() => console.log('[Database] Successfully connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('[Database] Connection failed:', err.message);
    console.error('[Database] Error details:', err);
  });

// Monitor connection errors
mongoose.connection.on('error', (err) => {
  console.error('[Database] Runtime error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] Connection lost - will attempt to reconnect');
});

// Basic test route
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    message: 'Timetable API is running!',
    database: dbStatus,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/timetable', timetableRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error] Caught error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

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
