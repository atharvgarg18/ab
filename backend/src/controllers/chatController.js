const Conversation = require('../models/Conversation');
const Timetable = require('../models/Timetable');
const { 
  analyzeSentiment, 
  detectConcerns, 
  detectCrisis,
  generateChatResponse,
  analyzeSession 
} = require('../services/chatService');
const { v4: uuidv4 } = require('uuid');

/**
 * Start a new conversation or continue existing one
 */
exports.sendMessage = async (req, res) => {
  try {
    const { studentId, message, conversationId } = req.body;

    if (!studentId || !message) {
      return res.status(400).json({ error: 'studentId and message are required' });
    }

    let conversation;
    let isNewConversation = false;

    // Find or create conversation
    if (conversationId) {
      conversation = await Conversation.findOne({ conversationId, isActive: true });
    }

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        studentId,
        conversationId: conversationId || uuidv4(),
        messages: [],
        session: {
          startTime: new Date()
        }
      });
      isNewConversation = true;
    }

    // Analyze user message
    const sentiment = await analyzeSentiment(message);
    const concerns = detectConcerns(message);
    const crisisCheck = detectCrisis(message);

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      sentiment: {
        score: sentiment.score,
        label: sentiment.label,
        emotions: sentiment.emotions
      },
      concerns
    });

    // Update flags if crisis detected
    if (crisisCheck.isCrisis) {
      conversation.flags.crisisDetected = true;
      conversation.flags.requiresAttention = true;
      conversation.flags.keywords = crisisCheck.keywords;
    }

    // Get student context (timetable)
    let studentContext = {};
    try {
      const timetables = await Timetable.find({ studentId }).sort({ createdAt: -1 }).limit(1);
      if (timetables.length > 0) {
        const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const schedule = timetables[0].structuredData;
        if (schedule && schedule[currentDay]) {
          studentContext.upcomingClasses = schedule[currentDay].length;
          studentContext.nextClass = schedule[currentDay][0];
        }
      }
    } catch (err) {
      console.log('Could not fetch timetable context:', err);
    }

    // Generate AI response
    const conversationHistory = conversation.messages.slice(-10);
    const aiResponse = await generateChatResponse(message, conversationHistory, studentContext);

    // Add assistant message
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Save conversation
    await conversation.save();

    res.json({
      success: true,
      conversationId: conversation.conversationId,
      message: aiResponse,
      sentiment: sentiment,
      concerns: concerns,
      crisisDetected: crisisCheck.isCrisis,
      isNewConversation
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
};

/**
 * Get conversation history
 */
exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

/**
 * Get all conversations for a student
 */
exports.getStudentConversations = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const conversations = await Conversation.find({ studentId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments({ studentId });

    res.json({ 
      conversations,
      total,
      hasMore: total > (parseInt(skip) + conversations.length)
    });
  } catch (error) {
    console.error('Get student conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

/**
 * End a conversation and analyze the session
 */
exports.endConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({ conversationId, isActive: true });

    if (!conversation) {
      return res.status(404).json({ error: 'Active conversation not found' });
    }

    // Analyze the session
    const analysis = await analyzeSession(conversation.messages);

    // Update conversation with analysis
    conversation.session.endTime = new Date();
    conversation.session.duration = Math.round(
      (conversation.session.endTime - conversation.session.startTime) / 60000
    ); // in minutes
    conversation.session.overallMood = analysis.overallMood;
    conversation.session.moodScore = analysis.moodScore;
    conversation.session.concerns = analysis.concerns;
    conversation.session.summary = analysis.summary;
    conversation.analytics = analysis.analytics;
    conversation.isActive = false;

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation ended',
      analysis: {
        overallMood: analysis.overallMood,
        summary: analysis.summary,
        duration: conversation.session.duration
      }
    });
  } catch (error) {
    console.error('End conversation error:', error);
    res.status(500).json({ error: 'Failed to end conversation' });
  }
};

/**
 * Get mood analytics for a student
 */
exports.getMoodAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const conversations = await Conversation.find({
      studentId,
      'session.startTime': { $gte: startDate }
    }).sort({ 'session.startTime': 1 });

    // Aggregate analytics
    const analytics = {
      totalConversations: conversations.length,
      moodTrend: conversations.map(conv => ({
        date: conv.session.startTime,
        mood: conv.session.overallMood,
        score: conv.session.moodScore
      })),
      commonConcerns: {},
      averageWellbeing: 0,
      flags: {
        totalCrises: conversations.filter(c => c.flags.crisisDetected).length,
        needsAttention: conversations.filter(c => c.flags.requiresAttention).length
      }
    };

    // Count concerns
    conversations.forEach(conv => {
      if (conv.session.concerns) {
        conv.session.concerns.forEach(concern => {
          analytics.commonConcerns[concern] = (analytics.commonConcerns[concern] || 0) + 1;
        });
      }
    });

    // Calculate average wellbeing
    const wellbeingScores = conversations
      .filter(c => c.analytics && c.analytics.overallWellbeing)
      .map(c => c.analytics.overallWellbeing);
    
    if (wellbeingScores.length > 0) {
      analytics.averageWellbeing = 
        wellbeingScores.reduce((a, b) => a + b, 0) / wellbeingScores.length;
    }

    // Latest analytics
    if (conversations.length > 0) {
      const latest = conversations[conversations.length - 1];
      analytics.latestMetrics = latest.analytics;
    }

    res.json({ analytics });
  } catch (error) {
    console.error('Get mood analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

/**
 * Delete a conversation
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOneAndDelete({ conversationId });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};
