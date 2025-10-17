import axios from 'axios';

// For production (Vercel), use VITE_API_URL from .env.production
// For local development, use localhost:5000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Timetable API calls
export const timetableAPI = {
  // Upload timetable
  uploadTimetable: async (file, studentId) => {
    const formData = new FormData();
    formData.append('timetable', file);
    formData.append('studentId', studentId);

    try {
      console.log('📤 Uploading file:', file.name, 'Student ID:', studentId);
      const response = await api.post('/api/timetable/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      console.error('❌ Response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      throw error;
    }
  },

  // Get all timetables for a student
  getStudentTimetables: async (studentId) => {
    const response = await api.get(`/api/timetable/student/${studentId}`);
    return response.data;
  },

  // Get specific timetable by ID
  getTimetableById: async (id) => {
    const response = await api.get(`/api/timetable/${id}`);
    return response.data;
  },

  // Delete timetable
  deleteTimetable: async (id) => {
    const response = await api.delete(`/api/timetable/${id}`);
    return response.data;
  },
};

// Chat API calls
export const chatAPI = {
  sendMessage: async (studentId, message, conversationId = null) => {
    const response = await api.post('/api/chat/message', {
      studentId,
      message,
      conversationId
    });
    return response.data;
  },

  getConversation: async (conversationId) => {
    const response = await api.get(`/api/chat/conversation/${conversationId}`);
    return response.data;
  },

  getStudentConversations: async (studentId, limit = 10, skip = 0) => {
    const response = await api.get(`/api/chat/student/${studentId}/conversations`, {
      params: { limit, skip }
    });
    return response.data;
  },

  endConversation: async (conversationId) => {
    const response = await api.post(`/api/chat/conversation/${conversationId}/end`);
    return response.data;
  },

  getMoodAnalytics: async (studentId, days = 30) => {
    const response = await api.get(`/api/chat/student/${studentId}/analytics`, {
      params: { days }
    });
    return response.data;
  },

  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/api/chat/conversation/${conversationId}`);
    return response.data;
  }
};

export default api;
