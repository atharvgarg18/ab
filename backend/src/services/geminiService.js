const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

/**
 * Convert file to base64
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType
    }
  };
}

/**
 * Extract timetable from image/PDF using Gemini
 */
async function extractTimetable(filePath, mimeType) {
  try {
    console.log('[Gemini] Initializing extraction service');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Initialize GenAI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use gemini-pro-vision for vision tasks (stable) or gemini-2.0-flash-exp (experimental)
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
    const imagePart = fileToGenerativePart(filePath, mimeType);
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
    console.error('[Gemini] Details:', {
      message: error.message,
      type: error.constructor.name
    });
    return {
      success: false,
      error: error.message || 'Unknown error occurred during timetable extraction'
    };
  }
}

module.exports = { extractTimetable };
