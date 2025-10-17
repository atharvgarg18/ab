// Netlify Function - Main API Handler
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

// MongoDB Models
const timetableSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    required: true 
  },
  metadata: {
    semester: String,
    academicYear: String,
    institutionName: String,
    courseName: String,
    studentName: String,
    section: String,
    any: mongoose.Schema.Types.Mixed
  },
  structuredData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  originalFileUrl: String,
  rawExtractedText: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const conversationSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
  timetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable'
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    sentiment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

// Gemini Service Functions
async function extractTimetableFromBuffer(fileBuffer, mimeType) {
  try {
    console.log('[Gemini] Initializing extraction service');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
    });

    const prompt = `
You are an expert at analyzing and extracting timetable/schedule information from images. 

Analyze this timetable image and extract ALL information in a structured JSON format. Be intelligent and flexible - understand the format and structure it appropriately.

Return ONLY a valid JSON object with this general structure:
{
  "metadata": {
    "semester": "extract if visible",
    "academicYear": "extract if visible", 
    "institutionName": "extract if visible",
    "courseName": "extract if visible",
    "studentName": "extract if visible",
    "section": "extract if visible",
    "any_other_info": "extract any other relevant metadata"
  },
  "schedule": {
    "Monday": [{"time": "9:00-10:00", "subject": "Math", "teacher": "Dr. X", "room": "101"}],
    "Tuesday": [{"time": "9:00-10:00", "subject": "Physics", "teacher": "Dr. Y", "room": "102"}],
    "Wednesday": [],
    "Thursday": [],
    "Friday": [],
    "Saturday": [],
    "Sunday": []
  }
}

Guidelines:
- Extract ALL visible information including: subjects, teachers, rooms, times, days
- Preserve exact names and spellings
- Use time formats like "9:00AM - 10:00AM" or "09:00-10:00"
- If a cell is empty, return empty array for that day
- Include any special notes, lab sessions, tutorial sessions
- Always structure with days of week as keys

Return ONLY the JSON, no markdown formatting, no explanations.
`;

    console.log('[Gemini] Sending request to API');
    const imagePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType
      }
    };
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();
    
    console.log('[Gemini] Response received - parsing data');
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    const parsedData = JSON.parse(text);
    
    console.log('[Gemini] Data parsed successfully');
    
    return {
      success: true,
      data: parsedData,
      rawText: text
    };
  } catch (error) {
    console.error('[Gemini] Extraction failed:', error.message);
    return {
      success: false,
      error: error.message || 'Unknown error occurred during timetable extraction'
    };
  }
}

// Chat Service Function
async function generateChatResponse(message, conversationHistory, timetableContext) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    let prompt = `You are a helpful AI assistant for students. `;
    
    if (timetableContext) {
      prompt += `The student's timetable is: ${JSON.stringify(timetableContext)}. Use this to answer questions about their schedule. `;
    }
    
    prompt += `\n\nConversation history:\n`;
    conversationHistory.forEach(msg => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });
    
    prompt += `\nUser: ${message}\n\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      message: text,
      sentiment: 'neutral'
    };
  } catch (error) {
    console.error('[Chat] Error generating response:', error);
    throw error;
  }
}

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

// ==========================================
// TIMETABLE ROUTES
// ==========================================

// Upload timetable
app.post('/api/timetable/upload', upload.single('timetable'), async (req, res) => {
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
    const extractedData = await extractTimetableFromBuffer(file.buffer, file.mimetype);
    
    if (!extractedData.success) {
      return res.status(500).json({ 
        error: 'Failed to extract timetable',
        details: extractedData.error 
      });
    }
    
    // Save to database
    const timetable = new Timetable({
      studentId,
      rawExtractedText: extractedData.rawText,
      structuredData: extractedData.data,
      metadata: extractedData.data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
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
app.get('/api/timetable/student/:studentId', async (req, res) => {
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
app.get('/api/timetable/:id', async (req, res) => {
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
app.delete('/api/timetable/:id', async (req, res) => {
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
app.post('/api/chat/message', async (req, res) => {
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
    const aiResponse = await generateChatResponse(
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
app.get('/api/chat/conversation/:studentId', async (req, res) => {
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
app.delete('/api/chat/conversation/:id', async (req, res) => {
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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Netlify Function API is running',
    timestamp: new Date().toISOString()
  });
});

// Export as Netlify Function
exports.handler = serverless(app);
