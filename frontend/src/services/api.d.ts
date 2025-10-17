import { AxiosInstance } from 'axios';

interface TimetableResponse {
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
  timetables?: any[];
  content?: any;
  events?: any[];
  [key: string]: any;
}

interface ChatMessage {
  studentId: string;
  message: string;
  conversationId?: string | null;
}

interface ConversationParams {
  limit?: number;
  skip?: number;
}

interface AnalyticsParams {
  days?: number;
}

export const timetableAPI: {
  uploadTimetable: (file: File, studentId: string) => Promise<TimetableResponse>;
  getStudentTimetables: (studentId: string) => Promise<TimetableResponse>;
  getTimetableById: (id: string) => Promise<TimetableResponse>;
  deleteTimetable: (id: string) => Promise<TimetableResponse>;
};

export const chatAPI: {
  sendMessage: (studentId: string, message: string, conversationId?: string | null) => Promise<any>;
  getConversation: (conversationId: string) => Promise<any>;
  getStudentConversations: (studentId: string, limit?: number, skip?: number) => Promise<any>;
  endConversation: (conversationId: string) => Promise<any>;
  getMoodAnalytics: (studentId: string, days?: number) => Promise<any>;
  deleteConversation: (conversationId: string) => Promise<any>;
};

declare const api: AxiosInstance;
export default api;
