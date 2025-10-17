const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Send a message and get AI response
router.post('/message', chatController.sendMessage);

// Get a specific conversation
router.get('/conversation/:conversationId', chatController.getConversation);

// Get all conversations for a student
router.get('/student/:studentId/conversations', chatController.getStudentConversations);

// End a conversation
router.post('/conversation/:conversationId/end', chatController.endConversation);

// Get mood analytics for a student
router.get('/student/:studentId/analytics', chatController.getMoodAnalytics);

// Delete a conversation
router.delete('/conversation/:conversationId', chatController.deleteConversation);

module.exports = router;
