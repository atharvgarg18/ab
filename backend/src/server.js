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
let mongoConnected = false;
let mongoError = null;

if (process.env.MONGODB_URI) {
  mongoose.set('strictQuery', false);
  
  const connectDB = async () => {
    try {
      console.log('[Database] Attempting to connect to MongoDB...');
      
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        retryWrites: false,
        maxPoolSize: 10,
        minPoolSize: 5
      });
      
      mongoConnected = true;
      mongoError = null;
      console.log('[Database] Successfully connected to MongoDB Atlas');
    } catch (err) {
      mongoConnected = false;
      mongoError = err.message;
      console.error('[Database] Connection error:', err.message);
      // Try to reconnect after 3 seconds
      setTimeout(connectDB, 3000);
    }
  };
  
  // Start connection immediately
  connectDB();

  // Monitor connection events
  mongoose.connection.on('error', (err) => {
    console.error('[Database] Runtime error:', err.message);
    mongoConnected = false;
    mongoError = err.message;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Connection lost');
    mongoConnected = false;
  });

  mongoose.connection.on('connected', () => {
    console.log('[Database] MongoDB connected');
    mongoConnected = true;
    mongoError = null;
  });
} else {
  console.warn('[Database] MONGODB_URI not configured - database operations will fail');
}

// Basic test route
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  res.json({ 
    message: 'Timetable API is running!',
    database: dbStatus === 1 ? 'Connected' : 'Disconnected',
    mongodbConfigured: !!process.env.MONGODB_URI,
    env: {
      mongodb: process.env.MONGODB_URI ? 'Set' : 'NOT SET',
      gemini: process.env.GEMINI_API_KEY ? 'Set' : 'NOT SET'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Debug endpoint - test database connection
app.get('/debug', (req, res) => {
  res.json({
    mongoUri: process.env.MONGODB_URI ? '***SET***' : 'NOT SET',
    mongoStatus: mongoose.connection.readyState,
    mongoStatusText: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[mongoose.connection.readyState],
    nodeEnv: process.env.NODE_ENV,
    mongoError: mongoError || null,
    error: mongoose.connection.readyState !== 1 ? 'Database not connected' : null
  });
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
