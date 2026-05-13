import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Maximize2, Send, Plus } from 'lucide-react';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';
import BookingForm from './BookingForm';
import './ChatBot.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  actionType?: 'booking' | 'faq' | 'conversation';
}

type ChatState = 'closed' | 'open' | 'minimized';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const CHAT_HISTORY_STORAGE_KEY = 'doctors-farms-chat-history';

const defaultMessages: Message[] = [
  {
    id: '1',
    text: 'Welcome to Doctors Farms Resort 🌴\nHow can I assist you today?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

function loadStoredMessages(): Message[] {
  if (typeof window === 'undefined') return defaultMessages;

  try {
    const stored = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!stored) return defaultMessages;

    const parsed = JSON.parse(stored) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultMessages;

    return parsed.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }));
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return defaultMessages;
  }
}

function createDefaultMessages(): Message[] {
  return [
    {
      id: '1',
      text: 'Welcome to Doctors Farms Resort 🌴\nHow can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ];
}

export default function ChatBotWidget() {
  const [chatState, setChatState] = useState<ChatState>('closed');
  const [messages, setMessages] = useState<Message[]>(loadStoredMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasHydratedRef = useRef(false);

  const startNewChat = () => {
    const freshMessages = createDefaultMessages();
    const separatorMessage: Message = {
      id: generateId(),
      text: 'New chat started. Your previous conversation is still saved above.',
      sender: 'bot',
      timestamp: new Date(),
      actionType: 'conversation',
    };

    setMessages((prev) => [...prev, separatorMessage, ...freshMessages]);
    setInput('');
    setLoading(false);
    setShowBookingForm(false);
    setChatState('open');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const generateId = () => `msg_${Date.now()}_${Math.random()}`;

  const handleQuickAction = async (action: string) => {
    const userMsg: Message = {
      id: generateId(),
      text: action,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    if (action === 'Book Room') {
      setShowBookingForm(true);
      const botMsg: Message = {
        id: generateId(),
        text: 'Let me help you book a room. Please fill out the booking form below:',
        sender: 'bot',
        timestamp: new Date(),
        actionType: 'booking',
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    await sendMessageToAI(action, 'quick_action');
  };

  const sendMessageToAI = async (userMessage: string, type: string = 'general') => {
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: userMessage,
        conversationHistory: messages.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
        messageType: type,
      });

      const botMsg: Message = {
        id: generateId(),
        text: response.data.reply,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: generateId(),
        text: 'Sorry, I encountered an error. Please try again or contact our support team.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: generateId(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    await sendMessageToAI(input);
  };

  const handleBookingSubmit = async (bookingData: any) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/booking-inquiry`, bookingData);
      
      const confirmMsg: Message = {
        id: generateId(),
        text: `Great! Your booking inquiry has been submitted. Confirmation ID: ${response.data.inquiryId}. Our team will contact you shortly.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMsg]);
      setShowBookingForm(false);
    } catch (error) {
      console.error('Booking error:', error);
      const errorMsg: Message = {
        id: generateId(),
        text: 'Error submitting booking. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="chatbot-widget">
      {/* Chat Button */}
      {chatState === 'closed' && (
        <button
          onClick={() => setChatState('open')}
          className="chatbot-button"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {chatState !== 'closed' && (
        <div className={`chatbot-window ${chatState === 'minimized' ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-title">
              <h3>Doctors Farms Assistant</h3>
              <p>Online - Ready to help</p>
            </div>
            <div className="chatbot-controls">
              <button onClick={startNewChat} className="control-btn new-chat-btn" title="Start new chat">
                <Plus size={16} />
                <span>New Chat</span>
              </button>
              <button
                onClick={() => setChatState(chatState === 'minimized' ? 'open' : 'minimized')}
                className="control-btn"
              >
                {chatState === 'minimized' ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button onClick={() => setChatState('closed')} className="control-btn">
                <X size={18} />
              </button>
            </div>
          </div>

          {chatState === 'open' && (
            <>
              {/* Messages */}
              <div className="chatbot-messages">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Show booking form if needed */}
              {showBookingForm && (
                <BookingForm
                  onSubmit={handleBookingSubmit}
                  onCancel={() => setShowBookingForm(false)}
                />
              )}

              {/* Quick Actions or Input */}
              {!showBookingForm && messages.length === 1 && (
                <QuickActions onAction={handleQuickAction} />
              )}

              {/* Input Area */}
              {!showBookingForm && (
                <form onSubmit={handleSendMessage} className="chatbot-input-area">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="chatbot-input"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading || !input.trim()} className="send-button">
                    <Send size={18} />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
