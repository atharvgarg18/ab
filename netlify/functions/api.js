// Netlify Function - Main API Handler
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    cachedDb = connection;
    console.log('[Netlify Function] MongoDB Connected');
    return connection;
  } catch (error) {
    console.error('[Netlify Function] MongoDB connection error:', error);
    throw error;
  }
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Import models
const Timetable = require('../../backend/src/models/Timetable');
const Conversation = require('../../backend/src/models/Conversation');

// Import services
const geminiService = require('../../backend/src/services/geminiService');
const chatService = require('../../backend/src/services/chatService');

// ==========================================
// TIMETABLE ROUTES
// ==========================================

// Upload timetable
app.post('/timetable/upload', upload.single('timetable'), async (req, res) => {
  try {
    await connectToDatabase();

    const { studentId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    console.log(`[Upload] Processing timetable for student: ${studentId}`);

    // Extract timetable using Gemini
    const extractedData = await geminiService.extractTimetableFromImage(file.buffer);
    
    // Save to database
    const timetable = new Timetable({
      studentId,
      rawText: extractedData.rawText,
      structuredData: extractedData.structuredData,
      uploadDate: new Date()
    });

    await timetable.save();
    console.log(`[Upload] Timetable saved for student: ${studentId}`);

    res.json({
      success: true,
      message: 'Timetable uploaded successfully',
      data: {
        studentId: timetable.studentId,
        structuredData: timetable.structuredData
      }
    });
  } catch (error) {
    console.error('[Upload Error]:', error);
    res.status(500).json({ 
      error: 'Failed to process timetable',
      details: error.message 
    });
  }
});

// Get timetables for student
app.get('/timetable/student/:studentId', async (req, res) => {
  try {
    await connectToDatabase();

    const { studentId } = req.params;
    const timetables = await Timetable.find({ studentId }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('[Get Timetables Error]:', error);
    res.status(500).json({ 
      error: 'Failed to fetch timetables',
      details: error.message 
    });
  }
});

// Get specific timetable
app.get('/timetable/:id', async (req, res) => {
  try {
    await connectToDatabase();

    const timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('[Get Timetable Error]:', error);
    res.status(500).json({ 
      error: 'Failed to fetch timetable',
      details: error.message 
    });
  }
});

// Delete timetable
app.delete('/timetable/:id', async (req, res) => {
  try {
    await connectToDatabase();

    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    res.json({
      success: true,
      message: 'Timetable deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Timetable Error]:', error);
    res.status(500).json({ 
      error: 'Failed to delete timetable',
      details: error.message 
    });
  }
});

// ==========================================
// CHAT ROUTES
// ==========================================

// Send message
app.post('/chat/message', async (req, res) => {
  try {
    await connectToDatabase();

    const { studentId, message, timetableId } = req.body;

    if (!studentId || !message) {
      return res.status(400).json({ error: 'Student ID and message are required' });
    }

    console.log(`[Chat] Processing message for student: ${studentId}`);

    // Get or create conversation
    let conversation = await Conversation.findOne({ studentId, timetableId });
    
    if (!conversation) {
      conversation = new Conversation({
        studentId,
        timetableId,
        messages: []
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get timetable context
    let timetableContext = null;
    if (timetableId) {
      const timetable = await Timetable.findById(timetableId);
      timetableContext = timetable?.structuredData;
    }

    // Generate AI response
    const aiResponse = await chatService.generateResponse(
      message,
      conversation.messages.slice(0, -1),
      timetableContext
    );

    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.message,
      sentiment: aiResponse.sentiment,
      timestamp: new Date()
    });

    await conversation.save();
    console.log(`[Chat] Response generated for student: ${studentId}`);

    res.json({
      success: true,
      data: {
        message: aiResponse.message,
        sentiment: aiResponse.sentiment,
        conversationId: conversation._id
      }
    });
  } catch (error) {
    console.error('[Chat Error]:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
});

// Get conversation
app.get('/chat/conversation/:studentId', async (req, res) => {
  try {
    await connectToDatabase();

    const { studentId } = req.params;
    const { timetableId } = req.query;

    const conversation = await Conversation.findOne({ studentId, timetableId });

    res.json({
      success: true,
      data: conversation || { messages: [] }
    });
  } catch (error) {
    console.error('[Get Conversation Error]:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversation',
      details: error.message 
    });
  }
});

// Delete conversation
app.delete('/chat/conversation/:id', async (req, res) => {
  try {
    await connectToDatabase();

    await Conversation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Conversation Error]:', error);
    res.status(500).json({ 
      error: 'Failed to delete conversation',
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Netlify Function API is running',
    timestamp: new Date().toISOString()
  });
});

// Export as Netlify Function
exports.handler = serverless(app);
