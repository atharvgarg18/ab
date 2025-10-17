const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sentiment: {
    score: Number, // -1 to 1 (negative to positive)
    label: String, // 'positive', 'negative', 'neutral'
    emotions: [String] // ['happy', 'stressed', 'anxious', etc.]
  },
  concerns: [String], // Detected concerns like 'academic_pressure', 'sleep_issues'
  metadata: mongoose.Schema.Types.Mixed
});

const conversationSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  messages: [messageSchema],
  session: {
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    duration: Number, // in minutes
    overallMood: String, // 'positive', 'negative', 'neutral', 'mixed'
    moodScore: Number, // -1 to 1
    concerns: [String], // Aggregated concerns from all messages
    summary: String // AI-generated summary of conversation
  },
  analytics: {
    academicPressure: Number, // 0-10 scale
    sleepQuality: Number, // 0-10 scale
    stressLevel: Number, // 0-10 scale
    socialWellbeing: Number, // 0-10 scale
    overallWellbeing: Number // 0-10 scale
  },
  flags: {
    requiresAttention: {
      type: Boolean,
      default: false
    },
    crisisDetected: {
      type: Boolean,
      default: false
    },
    keywords: [String] // Crisis keywords if detected
  },
  metadata: {
    deviceType: String,
    location: String,
    any: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
conversationSchema.index({ studentId: 1, createdAt: -1 });
conversationSchema.index({ 'session.startTime': -1 });
conversationSchema.index({ 'flags.requiresAttention': 1 });
conversationSchema.index({ 'flags.crisisDetected': 1 });

// Update the updatedAt timestamp on save
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
