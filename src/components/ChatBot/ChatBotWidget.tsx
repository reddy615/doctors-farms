import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Maximize2, Send, Plus } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';
import BookingForm from './BookingForm';
import { apiFetch } from '../../config/api';
import DateCalendarPicker from '../DateCalendarPicker';
import { useBlockedDates } from '../../hooks/useBlockedDates';
import { toDateKey } from '../../utils/dateHelpers';
import './ChatBot.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  actionType?: 'booking' | 'booking-summary' | 'booking-confirmation' | 'faq' | 'conversation';
  options?: Array<{
    label: string;
    value: string;
  }>;
}

type ChatState = 'closed' | 'open' | 'minimized';
type BookingFlowStep =
  | 'idle'
  | 'choose-experience'
  | 'check-in-date'
  | 'check-out-date'
  | 'guests'
  | 'room-type'
  | 'customer-name'
  | 'phone-number'
  | 'email'
  | 'confirmation';

interface BookingDraft {
  customerName?: string;
  phoneNumber?: string;
  email?: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  roomType?: string;
  totalPrice?: number;
}

interface ChatHistoryPayload {
  startedAt: string;
  messages: Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
}

const CHAT_HISTORY_STORAGE_KEY = 'doctors-farms-chat-history';
const CHAT_HISTORY_TTL_MS = 24 * 60 * 60 * 1000;
const HERITAGE_COTTAGE_PRICE = 15000;

const defaultMessages: Message[] = [
  {
    id: '1',
    text: 'Welcome to Doctors Farms Resort 🌴\nHow can I assist you today?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

// Popular questions removed per user request

function isPersistentChatMessage(message: Message) {
  return message.actionType === 'booking-summary' || message.actionType === 'booking-confirmation';
}

function normalizeStoredMessages(messages: ChatHistoryPayload['messages']): Message[] {
  return messages.map((message) => ({
    ...message,
    timestamp: new Date(message.timestamp),
  }));
}

function loadStoredChatHistory(): { messages: Message[]; startedAt: string } {
  if (typeof window === 'undefined') {
    return {
      messages: defaultMessages,
      startedAt: new Date().toISOString(),
    };
  }

  try {
    const stored = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!stored) {
      return {
        messages: defaultMessages,
        startedAt: new Date().toISOString(),
      };
    }

    const parsed = JSON.parse(stored) as ChatHistoryPayload | Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
    const now = Date.now();

    let startedAt = new Date().toISOString();
    let messages: Message[] = defaultMessages;

    if (Array.isArray(parsed)) {
      messages = normalizeStoredMessages(parsed);
      const earliestMessage = messages.reduce((earliest, message) => (
        message.timestamp.getTime() < earliest.getTime() ? message.timestamp : earliest
      ), messages[0]?.timestamp || new Date());
      startedAt = earliestMessage.toISOString();
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.messages)) {
      startedAt = parsed.startedAt || startedAt;
      messages = normalizeStoredMessages(parsed.messages);
    }

    const startedAtTime = new Date(startedAt).getTime();
    const isExpired = Number.isFinite(startedAtTime) && now - startedAtTime >= CHAT_HISTORY_TTL_MS;

    if (isExpired) {
      const persistentMessages = messages.filter(isPersistentChatMessage);
      return {
        messages: persistentMessages.length > 0 ? persistentMessages : defaultMessages,
        startedAt: persistentMessages.length > 0 ? startedAt : new Date().toISOString(),
      };
    }

    return {
      messages: messages.length > 0 ? messages : defaultMessages,
      startedAt,
    };
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return {
      messages: defaultMessages,
      startedAt: new Date().toISOString(),
    };
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
  const initialChatHistory = loadStoredChatHistory();
  const [messages, setMessages] = useState<Message[]>(initialChatHistory.messages);
  const [chatHistoryStartedAt] = useState(initialChatHistory.startedAt);
  const [showQuickActions, setShowQuickActions] = useState(initialChatHistory.messages.length === 1);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingFlowStep, setBookingFlowStep] = useState<BookingFlowStep>('idle');
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({});
  const [editingSummaryId, setEditingSummaryId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<BookingDraft | null>(null);
  const { blockedDates } = useBlockedDates();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasHydratedRef = useRef(false);
  const hasPrunedExpiredHistoryRef = useRef(false);

  const openChatWindow = () => {
    setChatState('open');
    setShowQuickActions(true);
    setShowBookingForm(false);
  };

  const closeChatWindow = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setChatState('closed');
    setShowQuickActions(true);
    setShowBookingForm(false);
    setBookingFlowStep('idle');
    setBookingDraft({});
  };

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
    setShowQuickActions(true);
    setChatState('open');
    setBookingFlowStep('idle');
    setBookingDraft({});
  };

  const appendBotMessage = (text: string, options?: Message['options'], actionType: Message['actionType'] = 'conversation') => {
    const botMsg: Message = {
      id: generateId(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      actionType,
      options,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  const resetBookingFlow = () => {
    setBookingFlowStep('idle');
    setBookingDraft({});
  };

  const parseGuestCounts = (text: string) => {
    const lowerText = text.toLowerCase();
    const numberWords: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
    };

    const extractNumbers = () => {
      const digitMatches = text.match(/\d+/g)?.map(Number) || [];
      if (digitMatches.length > 0) return digitMatches;

      const foundWords = Object.entries(numberWords)
        .filter(([word]) => new RegExp(`\\b${word}\\b`, 'i').test(lowerText))
        .map(([, value]) => value);

      return foundWords;
    };

    const values = extractNumbers();
    let adults = 1;
    let children = 0;

    if (values.length === 1) {
      adults = values[0];
    } else if (values.length >= 2) {
      if (/child|kid/i.test(lowerText)) {
        adults = values[0];
        children = values[1];
      } else if (/adult/i.test(lowerText)) {
        adults = values[0];
        children = values[1];
      } else {
        adults = values[0];
        children = values[1];
      }
    }

    const totalGuests = adults + children;
    if (totalGuests < 1 || totalGuests > 20) {
      return null;
    }

    return { adults, children };
  };



  const calculateEstimatedPrice = (checkInDate?: string, checkOutDate?: string) => {
    if (!checkInDate || !checkOutDate) {
      return HERITAGE_COTTAGE_PRICE;
    }

    const checkInTime = Date.parse(checkInDate);
    const checkOutTime = Date.parse(checkOutDate);

    if (Number.isNaN(checkInTime) || Number.isNaN(checkOutTime) || checkOutTime <= checkInTime) {
      return HERITAGE_COTTAGE_PRICE;
    }

    const diffMs = checkOutTime - checkInTime;
    const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return HERITAGE_COTTAGE_PRICE * nights;
  };

  const createBookingSummary = (draft: BookingDraft) => {
    return [
      'Thank you 😊',
      'Here is your booking summary:',
      `📅 Check-in date: ${draft.checkInDate || '-'}`,
      `📅 Check-out date: ${draft.checkOutDate || '-'}`,
      `👥 Guests: ${(draft.adults || 1)} adult(s), ${(draft.children || 0)} child(ren)`,
      `🏨 Room type: ${draft.roomType || 'Heritage Cottage'}`,
      `👤 Name: ${draft.customerName || '-'}`,
      `📞 Phone: ${draft.phoneNumber || '-'}`,
      `✉️ Email: ${draft.email || '-'}`,
      `💰 Estimated total: ₹${(draft.totalPrice || HERITAGE_COTTAGE_PRICE).toLocaleString('en-IN')}`,
      '',
      'Would you like to confirm this booking?',
    ].join('\n');
  };

  const startAssistedBooking = () => {
    setShowBookingForm(false);
    setBookingFlowStep('check-in-date');
    setBookingDraft({ roomType: 'Heritage Cottage' });
    setLoading(true);
    setTimeout(() => {
      appendBotMessage('Thank you for choosing assisted booking 😊\nCould you please share your\n📅 Check-in date');
      setLoading(false);
    }, 1500);
  };

  const handleCalendarDateSelect = (selectedDate: string) => {
    if (!selectedDate) return;

    if (bookingFlowStep === 'check-in-date') {
      setBookingDraft((prev) => ({ ...prev, checkInDate: selectedDate }));
      setBookingFlowStep('check-out-date');
      appendBotMessage('Thank you 😊\nMay I know your\n📅 Check-out date');
      return;
    }

    if (bookingFlowStep === 'check-out-date') {
      setBookingDraft((prev) => ({ ...prev, checkOutDate: selectedDate }));
      setBookingFlowStep('guests');
      appendBotMessage('Perfect 👌\n👥 Number of guests');
    }
  };

  const sendBookingToBackend = async (payload: BookingDraft) => {
    const response = await apiFetch('/api/booking-inquiry', {
      method: 'POST',
      body: JSON.stringify({
        customerName: payload.customerName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        checkInDate: payload.checkInDate,
        checkOutDate: payload.checkOutDate,
        adults: payload.adults || 1,
        children: payload.children || 0,
        roomType: payload.roomType || 'Heritage Cottage',
        totalPrice: payload.totalPrice || HERITAGE_COTTAGE_PRICE,
        message: 'Booking created through assisted chatbot flow',
      }),
    });

    return response.json();
  };

  const handleBookingOptionAction = async (value: string) => {
    const normalizedValue = value.toLowerCase();

    if (normalizedValue === 'book-manually') {
      setShowBookingForm(true);
      setBookingFlowStep('idle');
      setBookingDraft({});
      setTimeout(() => {
        appendBotMessage('Perfect, the booking form is now open below. Please fill in your details and submit it.');
      }, 1500);
      return;
    }

    if (normalizedValue === 'let-me-assist-you') {
      startAssistedBooking();
      return;
    }

    if (normalizedValue === 'heritage-cottage') {
      setBookingDraft((prev) => ({
        ...prev,
        roomType: 'Heritage Cottage',
        totalPrice: calculateEstimatedPrice(prev.checkInDate, prev.checkOutDate),
      }));
      setBookingFlowStep('customer-name');
      appendBotMessage('Excellent choice 😊\nCould you please share your full name?');
      return;
    }

    if (normalizedValue === 'yes') {
      const payload = {
        ...bookingDraft,
        roomType: bookingDraft.roomType || 'Heritage Cottage',
        totalPrice: bookingDraft.totalPrice || HERITAGE_COTTAGE_PRICE,
      };

      try {
        setLoading(true);
        const responseData = await sendBookingToBackend(payload);
        appendBotMessage(
          `Wonderful 🎉\nYour booking has been successfully confirmed.\nAnd our team will contact you soon\n\nBooking ID: ${responseData.inquiryId || 'Pending'}`,
          undefined,
          'booking-confirmation',
        );
      } catch (error) {
        appendBotMessage(
          error instanceof Error
            ? `Sorry, I could not confirm the booking right now. ${error.message}`
            : 'Sorry, I could not confirm the booking right now. Please try again.',
        );
      } finally {
        setLoading(false);
        resetBookingFlow();
      }
      return;
    }

    if (normalizedValue === 'edit') {
      // enter inline-edit mode for the latest booking-summary message
      const lastSummary = [...messages].reverse().find((m) => m.actionType === 'booking-summary');
      if (!lastSummary) return;
      setEditingSummaryId(lastSummary.id);
      setEditingDraft(bookingDraft);
      return;
    }

    if (normalizedValue === 'no') {
      appendBotMessage('No problem. You can choose another booking option or ask me anything else.', [
        { label: 'Book Manually', value: 'book-manually' },
        { label: 'Let Me Assist You', value: 'let-me-assist-you' },
      ], 'booking');
      resetBookingFlow();
    }
  };

  const handleAssistantMessage = async (userText: string) => {
    const step = bookingFlowStep;

    if (step === 'check-in-date' || step === 'check-out-date') {
      return;
    }

    if (step === 'guests') {
      const guests = parseGuestCounts(userText);
      if (!guests) {
        appendBotMessage('Please share the guest count as a number between 1 and 20, or like "2 adults and 1 child".');
        return;
      }

      setBookingDraft((prev) => ({ ...prev, ...guests }));
      setBookingFlowStep('room-type');
      appendBotMessage('Great!\nPlease choose your preferred room type:\n🏨 Heritage Cottage\nprice is 15000 for 24 hours', [
        { label: 'Heritage Cottage', value: 'heritage-cottage' },
      ], 'booking');
      return;
    }

    if (step === 'room-type') {
      if (!/heritage/i.test(userText)) {
        appendBotMessage('Please select the Heritage Cottage option to continue with assisted booking.', [
          { label: 'Heritage Cottage', value: 'heritage-cottage' },
        ], 'booking');
        return;
      }

      setBookingDraft((prev) => ({
        ...prev,
        roomType: 'Heritage Cottage',
        totalPrice: calculateEstimatedPrice(prev.checkInDate, prev.checkOutDate),
      }));
      setBookingFlowStep('customer-name');
      appendBotMessage('Excellent choice 😊\nCould you please share your full name?');
      return;
    }

    if (step === 'customer-name') {
      const name = userText.trim();
      if (name.length < 2) {
        appendBotMessage('Please provide your full name (at least 2 characters).');
        return;
      }

      setBookingDraft((prev) => ({ ...prev, customerName: name }));
      setBookingFlowStep('phone-number');
      appendBotMessage('Thank you! 😊\nCould you please share your 10-digit phone number?');
      return;
    }

    if (step === 'phone-number') {
      const phoneMatch = userText.replace(/\D/g, '');
      if (phoneMatch.length !== 10 && phoneMatch.length !== 12) {
        appendBotMessage('Please provide a valid 10-digit phone number.');
        return;
      }

      setBookingDraft((prev) => ({ ...prev, phoneNumber: phoneMatch }));
      setBookingFlowStep('email');
      appendBotMessage('Perfect 👍\nCould you also provide your email address for booking confirmation?');
      return;
    }

    if (step === 'email') {
      const email = userText.trim();
      if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
        appendBotMessage('Please provide a valid Gmail address ending with @gmail.com.');
        return;
      }

      const nextDraft = {
        ...bookingDraft,
        email,
        totalPrice: calculateEstimatedPrice(bookingDraft.checkInDate, bookingDraft.checkOutDate),
      };
      setBookingDraft(nextDraft);
      setBookingFlowStep('confirmation');
      appendBotMessage(createBookingSummary(nextDraft), [
        { label: 'YES', value: 'yes' },
        { label: 'NO', value: 'no' },
        { label: 'EDIT', value: 'edit' },
      ], 'booking-summary');
      return;
    }
  };

  const handleEditChange = (field: keyof BookingDraft, value: any) => {
    setEditingDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveEditedSummary = () => {
    if (!editingSummaryId || !editingDraft) return;
    // update the booking draft and replace the summary message text
    setBookingDraft(editingDraft);
    setMessages((prev) => prev.map((m) => m.id === editingSummaryId ? { ...m, text: createBookingSummary(editingDraft) } : m));
    setEditingSummaryId(null);
    setEditingDraft(null);
  };

  const cancelEditSummary = () => {
    setEditingSummaryId(null);
    setEditingDraft(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    const payload: ChatHistoryPayload = {
      startedAt: chatHistoryStartedAt,
      messages: messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
    };

    window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(payload));
  }, [messages, loading, chatHistoryStartedAt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startedAtTime = new Date(chatHistoryStartedAt).getTime();
    if (!Number.isFinite(startedAtTime)) return;

    const remainingTime = startedAtTime + CHAT_HISTORY_TTL_MS - Date.now();

    if (remainingTime <= 0) {
      if (hasPrunedExpiredHistoryRef.current) return;
      hasPrunedExpiredHistoryRef.current = true;
      setMessages((currentMessages) => {
        const preservedMessages = currentMessages.filter(isPersistentChatMessage);
        return preservedMessages.length > 0 ? preservedMessages : defaultMessages;
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      hasPrunedExpiredHistoryRef.current = true;
      setMessages((currentMessages) => {
        const preservedMessages = currentMessages.filter(isPersistentChatMessage);
        return preservedMessages.length > 0 ? preservedMessages : defaultMessages;
      });
    }, remainingTime);

    return () => window.clearTimeout(timeoutId);
  }, [chatHistoryStartedAt]);

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
      await sendMessageToAI('Book Room', 'booking');
      return;
    }

    await sendMessageToAI(action, 'faq');
  };

  // FAQ buttons removed — user requested they be hidden

  const sendMessageToAI = async (userMessage: string, type: string = 'general') => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
        message: userMessage,
        conversationHistory: messages.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
        messageType: type,
        }),
      });

      const responseData = await response.json();

      const botMsg: Message = {
        id: generateId(),
        text: responseData.reply,
        sender: 'bot',
        timestamp: new Date(),
        actionType: responseData.actionType || (type === 'booking' ? 'booking' : 'conversation'),
        options: responseData.options,
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

    if (bookingFlowStep !== 'idle') {
      const normalizedInput = input.trim().toLowerCase();

      if (
        normalizedInput === 'book manually' ||
        normalizedInput === 'book-manually' ||
        normalizedInput === 'let me assist you' ||
        normalizedInput === 'let-me-assist-you' ||
        normalizedInput === 'yes' ||
        normalizedInput === 'no'
      ) {
        await handleBookingOptionAction(normalizedInput.replace(/\s+/g, '-'));
        return;
      }

      await handleAssistantMessage(input.trim());
      return;
    }

    const normalizedInput = input.trim().toLowerCase();
    if (normalizedInput === 'book manually' || normalizedInput === 'book-manually') {
      await handleBookingOptionAction('book-manually');
      return;
    }

    if (normalizedInput === 'let me assist you' || normalizedInput === 'let-me-assist-you') {
      await handleBookingOptionAction('let-me-assist-you');
      return;
    }

    await sendMessageToAI(input);
  };

  const handleBookingSubmit = async (bookingData: any) => {
    try {
      const response = await apiFetch('/api/booking-inquiry', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });

      const responseData = await response.json();
      
      const confirmMsg: Message = {
        id: generateId(),
        text: `Great! Your booking inquiry has been submitted. Confirmation ID: ${responseData.inquiryId}. Our team will contact you shortly.`,
        sender: 'bot',
        timestamp: new Date(),
        actionType: 'booking-confirmation',
      };
      setMessages((prev) => [...prev, confirmMsg]);
      setShowBookingForm(false);
    } catch (error) {
      console.error('Booking error:', error);
      const errorDetails = error instanceof Error ? error.message : 'Error submitting booking.';
      const errorMsg: Message = {
        id: generateId(),
        text: errorDetails.includes('Validation failed')
          ? `Error submitting booking. ${errorDetails}`
          : errorDetails || 'Error submitting booking. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="chatbot-widget">
      {/* Chat Button */}
      <button
        onClick={openChatWindow}
        className="chatbot-button"
        aria-label={chatState === 'closed' ? 'Open chat' : 'Chat launcher'}
        title={chatState === 'closed' ? 'Open chat' : 'Chat launcher'}
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      {chatState !== 'closed' && (
        <div
          className={`chatbot-window ${chatState === 'minimized' ? 'minimized' : ''}`}
          onClick={() => {
            // click-to-expand when minimized
            if (chatState === 'minimized') {
              setChatState('open');
            }
          }}
        >
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
                  onClick={(e) => { e.stopPropagation(); setChatState(chatState === 'minimized' ? 'open' : 'minimized'); }}
                className="control-btn"
              >
                {chatState === 'minimized' ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button onClick={closeChatWindow} className="control-btn">
                <X size={18} />
              </button>
            </div>
          </div>

          {chatState === 'open' && (
            <>
              {/* Messages */}
              <div className="chatbot-messages">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onOptionClick={handleBookingOptionAction}
                    isEditing={editingSummaryId === msg.id}
                    editingDraft={editingDraft}
                    onEditChange={handleEditChange}
                    onSaveEdit={saveEditedSummary}
                    onCancelEdit={cancelEditSummary}
                  />
                ))}
                {(bookingFlowStep === 'check-in-date' || bookingFlowStep === 'check-out-date') && (
                  <div className="mx-4 mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                    <DateCalendarPicker
                      title={bookingFlowStep === 'check-in-date' ? 'Choose your check-in date' : 'Choose your check-out date'}
                      helperText="Blocked dates are disabled by admin selection."
                      mode="single"
                      selectedDates={bookingFlowStep === 'check-in-date' ? [bookingDraft.checkInDate || ''] : [bookingDraft.checkOutDate || '']}
                      disabledDates={blockedDates}
                      minDate={bookingFlowStep === 'check-out-date' && bookingDraft.checkInDate ? bookingDraft.checkInDate : toDateKey(new Date())}
                      onChange={(dates) => handleCalendarDateSelect(dates[0] || '')}
                    />
                    <p className="mt-2 text-xs text-emerald-700">
                      Tap a date to continue the booking flow.
                    </p>
                  </div>
                )}
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
              {!showBookingForm && showQuickActions && (
                <QuickActions onAction={handleQuickAction} onMinimize={() => setShowQuickActions(false)} />
              )}

              {!showBookingForm && !showQuickActions && (
                <div className="quick-actions-collapsed">
                  <span className="quick-actions-label">What would you like to know?</span>
                  <button className="quick-actions-expand-btn" onClick={() => setShowQuickActions(true)} aria-label="Show options">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f7e4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"></path><path d="M12 3v18"></path></svg>
                  </button>
                </div>
              )}

              {/* Input Area */}
              {!showBookingForm && bookingFlowStep !== 'check-in-date' && bookingFlowStep !== 'check-out-date' && (
                <form onSubmit={handleSendMessage} className="chatbot-input-area">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (e.target.value && showQuickActions) {
                        setShowQuickActions(false);
                      }
                    }}
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
