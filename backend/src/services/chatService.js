const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI inside functions to ensure env vars are loaded
function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Crisis keywords for detection
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'self harm', 'hurt myself', 'cut myself', 'hate myself', 'no point living'
];

// Concern keywords for categorization
const CONCERN_PATTERNS = {
  academic_pressure: ['exam', 'test', 'assignment', 'grade', 'fail', 'study', 'homework', 'pressure'],
  sleep_issues: ['sleep', 'tired', 'exhausted', 'insomnia', 'cant sleep', 'sleepless'],
  stress: ['stress', 'anxious', 'anxiety', 'worried', 'nervous', 'overwhelmed'],
  social_issues: ['lonely', 'alone', 'friends', 'isolated', 'left out', 'bullied'],
  family_issues: ['family', 'parents', 'home', 'fight', 'argument'],
  health: ['sick', 'pain', 'headache', 'unwell', 'health']
};

/**
 * Analyze sentiment of a message
 */
async function analyzeSentiment(text) {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Analyze the sentiment and emotions in this message. Return ONLY a JSON object:

Message: "${text}"

Return format:
{
  "score": <number between -1 and 1, where -1 is very negative, 0 is neutral, 1 is very positive>,
  "label": "positive" | "negative" | "neutral",
  "emotions": ["happy", "sad", "anxious", "stressed", "excited", "calm", etc.],
  "intensity": <number 0-10 indicating emotional intensity>
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text();
    
    // Clean markdown formatting
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(analysisText);
    return analysis;
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    // Return neutral sentiment on error
    return {
      score: 0,
      label: 'neutral',
      emotions: [],
      intensity: 5
    };
  }
}

/**
 * Detect concerns in a message
 */
function detectConcerns(text) {
  const concerns = [];
  const lowerText = text.toLowerCase();
  
  for (const [concern, keywords] of Object.entries(CONCERN_PATTERNS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      concerns.push(concern);
    }
  }
  
  return concerns;
}

/**
 * Detect crisis keywords
 */
function detectCrisis(text) {
  const lowerText = text.toLowerCase();
  const detectedKeywords = CRISIS_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword)
  );
  
  return {
    isCrisis: detectedKeywords.length > 0,
    keywords: detectedKeywords
  };
}

/**
 * Generate empathetic AI response
 */
async function generateChatResponse(userMessage, conversationHistory = [], studentContext = {}) {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Build context from conversation history
    let historyContext = '';
    if (conversationHistory.length > 0) {
      historyContext = conversationHistory.slice(-10).map(msg => 
        `${msg.role === 'user' ? 'Student' : 'You'}: ${msg.content}`
      ).join('\n');
    }

    // Build student context
    let contextInfo = '';
    if (studentContext.nextClass) {
      contextInfo += `\nStudent's next class: ${studentContext.nextClass.subject} at ${studentContext.nextClass.time}`;
    }
    if (studentContext.upcomingClasses) {
      contextInfo += `\nUpcoming classes today: ${studentContext.upcomingClasses}`;
    }

    const systemPrompt = `You are a caring, empathetic AI counselor chatbot for students. Your role is to:
- Check in on students' mental health and wellbeing
- Listen actively and empathetically
- Provide emotional support and validation
- Help students identify stressors and concerns
- Suggest healthy coping strategies
- Encourage seeking professional help when needed
- Be warm, understanding, and non-judgmental

Guidelines:
- Keep responses concise (2-4 sentences max)
- Ask follow-up questions to understand better
- Acknowledge their feelings
- Never diagnose or provide medical advice
- If serious concerns detected, encourage professional help
- Be natural and conversational, not clinical
- Reference their schedule/context when relevant

${contextInfo}

Previous conversation:
${historyContext || 'This is the start of the conversation.'}

Student's message: "${userMessage}"

Respond empathetically and supportively:`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const responseText = response.text().trim();
    
    return responseText;
  } catch (error) {
    console.error('Chat response generation error:', error);
    return "I'm here to listen. Can you tell me more about how you're feeling?";
  }
}

/**
 * Analyze overall session and generate summary
 */
async function analyzeSession(messages) {
  try {
    if (messages.length === 0) {
      return {
        overallMood: 'neutral',
        moodScore: 0,
        concerns: [],
        summary: 'No messages in session',
        analytics: {}
      };
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const conversationText = messages.map(msg => 
      `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const prompt = `Analyze this counseling conversation and provide insights. Return ONLY a JSON object:

Conversation:
${conversationText}

Return format:
{
  "overallMood": "positive" | "negative" | "neutral" | "mixed",
  "moodScore": <number -1 to 1>,
  "concerns": ["academic_pressure", "sleep_issues", etc.],
  "summary": "Brief 1-2 sentence summary of the conversation",
  "analytics": {
    "academicPressure": <0-10>,
    "sleepQuality": <0-10>,
    "stressLevel": <0-10>,
    "socialWellbeing": <0-10>,
    "overallWellbeing": <0-10>
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text();
    
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(analysisText);
    return analysis;
  } catch (error) {
    console.error('Session analysis error:', error);
    return {
      overallMood: 'neutral',
      moodScore: 0,
      concerns: [],
      summary: 'Conversation completed',
      analytics: {
        academicPressure: 5,
        sleepQuality: 5,
        stressLevel: 5,
        socialWellbeing: 5,
        overallWellbeing: 5
      }
    };
  }
}

module.exports = {
  analyzeSentiment,
  detectConcerns,
  detectCrisis,
  generateChatResponse,
  analyzeSession
};
