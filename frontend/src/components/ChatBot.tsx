import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import './ChatBot.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sentiment?: string;
}

interface ChatBotProps {
  studentId: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ studentId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hi! I\'m your wellbeing assistant. How are you feeling today?'
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const messageText = input.trim();
    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatAPI.sendMessage(
        studentId,
        messageText,
        conversationId || undefined
      );

      if (!conversationId && response?.conversationId) {
        setConversationId(response.conversationId);
      }

      // Handle different response structures safely
      let messageContent = 'No response received';
      let sentimentValue = undefined;

      if (response) {
        messageContent = response.message || response.data?.message || 'Response received';
        
        // Handle sentiment being an object or string
        if (response.sentiment) {
          sentimentValue = typeof response.sentiment === 'object' 
            ? response.sentiment.label 
            : response.sentiment;
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: messageContent,
        sentiment: sentimentValue
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend server is running on port 5000.'
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

  return (
    <>
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          <span className="chat-icon">💬</span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-panel">
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-avatar">🤖</span>
              <div>
                <h3>Wellbeing Assistant</h3>
                <p>Always here to listen</p>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content}
                  {msg.sentiment && (
                    <div className="sentiment-tag">{msg.sentiment}</div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share how you're feeling..."
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="send-button"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
