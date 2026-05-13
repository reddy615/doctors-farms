

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

const linkPattern = /(https?:\/\/\S+)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(\+?\d[\d\s-]{8,}\d)/gi;

function getLinkHref(match: string) {
  if (match.includes('@')) {
    return `mailto:${match}`;
  }

  if (match.startsWith('http://') || match.startsWith('https://')) {
    return match;
  }

  const normalizedPhone = match.replace(/[^\d+]/g, '');
  return `tel:${normalizedPhone}`;
}

function renderRichText(text: string) {
  return text.split('\n').map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const match of line.matchAll(linkPattern)) {
      const index = match.index ?? 0;
      const value = match[0];

      if (index > lastIndex) {
        parts.push(line.slice(lastIndex, index));
      }

      parts.push(
        <a
          key={`${lineIndex}-${index}-${value}`}
          href={getLinkHref(value)}
          target={value.startsWith('http://') || value.startsWith('https://') ? '_blank' : undefined}
          rel={value.startsWith('http://') || value.startsWith('https://') ? 'noopener noreferrer' : undefined}
        >
          {value}
        </a>
      );

      lastIndex = index + value.length;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return <p key={lineIndex}>{parts.length > 0 ? parts : line}</p>;
  });
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
      <div className="message-content">
        {renderRichText(message.text)}
      </div>
      <span className="message-time">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
