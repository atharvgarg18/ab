import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import './ChatBot.css';

interface ChatBotProps {
  studentId: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sentiment?: {
    score: number;
    label: string;
    emotions: string[];
  };
}

const ChatBot: React.FC<ChatBotProps> = ({ studentId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      // Welcome message
      setMessages([{
        role: 'assistant',
        content: "Hi! 👋 I'm here to check in on how you're feeling. How are you doing today?",
        timestamp: new Date()
      }]);
    }
  }, [isChatOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to UI
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      const response = await chatAPI.sendMessage(studentId, userMessage, conversationId);
      
      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Add AI response to UI
      const aiMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        sentiment: response.sentiment
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Show alert if crisis detected
      if (response.crisisDetected) {
        setTimeout(() => {
          alert('⚠️ I noticed you might be going through a tough time. Please consider reaching out to a counselor or calling a crisis helpline. You\'re not alone.');
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndConversation = async () => {
    if (!conversationId) return;

    try {
      const response = await chatAPI.endConversation(conversationId);
      alert(`Session ended. ${response.analysis.summary}`);
      setMessages([]);
      setConversationId(null);
      setIsChatOpen(false);
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  };

  const getMoodEmoji = (sentiment?: { label: string }) => {
    if (!sentiment) return '💬';
    switch (sentiment.label) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isChatOpen) {
    return (
      <div className="chat-bubble" onClick={() => setIsChatOpen(true)}>
        <div className="bubble-icon">💭</div>
        <div className="bubble-text">How are you feeling?</div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <div className="header-left">
          <div className="bot-avatar">🤖</div>
          <div>
            <h3>Wellbeing Check-in</h3>
            <span className="status">Online</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="icon-btn">
            📊
          </button>
          <button onClick={handleEndConversation} className="icon-btn">
            ⏹️
          </button>
          <button onClick={() => setIsChatOpen(false)} className="icon-btn">
            ✖️
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.role === 'assistant' && (
                <div className="avatar">🤖</div>
              )}
              <div className="bubble">
                <p>{msg.content}</p>
                <span className="timestamp">{formatTime(msg.timestamp)}</span>
                {msg.sentiment && (
                  <span className="mood-indicator">{getMoodEmoji(msg.sentiment)}</span>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="avatar">👤</div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message assistant">
            <div className="message-content">
              <div className="avatar">🤖</div>
              <div className="bubble typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            disabled={isTyping}
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || isTyping}
            className="send-btn"
          >
            ➤
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>

      {showAnalytics && (
        <div className="analytics-overlay">
          <div className="analytics-panel">
            <h3>Your Wellbeing Insights</h3>
            <p>Analytics feature coming soon...</p>
            <button onClick={() => setShowAnalytics(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
