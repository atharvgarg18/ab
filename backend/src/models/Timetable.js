const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    required: true 
  },
  // Flexible fields that Gemini might extract
  metadata: {
    semester: String,
    academicYear: String,
    institutionName: String,
    courseName: String,
    studentName: String,
    section: String,
    any: mongoose.Schema.Types.Mixed // Any other metadata
  },
  // Store the structured timetable data as flexible JSON
  // This allows for different timetable formats
  structuredData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  originalFileUrl: String,
  rawExtractedText: String, // Store original Gemini output for debugging
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Timetable', timetableSchema);
