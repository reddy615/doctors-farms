

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  options?: Array<{
    label: string;
    value: string;
  }>;
}

interface MessageBubbleProps {
  message: Message;
  onOptionClick?: (value: string) => void;
}

function renderRichText(text: string) {
  return text.split('\n').map((line, lineIndex) => {
    return <p key={lineIndex}>{line}</p>;
  });
}

export default function MessageBubble({ message, onOptionClick }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
      <div className="message-content">
        {renderRichText(message.text)}
      </div>
      {!isUser && message.options && message.options.length > 0 && (
        <div className="message-options">
          {message.options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="message-option-btn"
              onClick={() => onOptionClick?.(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      <span className="message-time">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
