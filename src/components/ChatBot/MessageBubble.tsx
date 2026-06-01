

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  actionType?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
}

interface InlineDraft {
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

interface MessageBubbleProps {
  message: Message;
  onOptionClick?: (value: string) => void;
  isEditing?: boolean;
  editingDraft?: InlineDraft | null;
  onEditChange?: (field: keyof InlineDraft, value: any) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

function renderRichText(text: string) {
  return text.split('\n').map((line, lineIndex) => {
    return <p key={lineIndex}>{line}</p>;
  });
}

export default function MessageBubble({ message, onOptionClick, isEditing, editingDraft, onEditChange, onSaveEdit, onCancelEdit }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
      <div className="message-content">
        {renderRichText(message.text)}
      </div>
      {!isUser && message.options && message.options.length > 0 && !isEditing && (
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
      {/* Inline edit UI for booking summary when requested */}
      {!isUser && message.actionType === 'booking-summary' && isEditing && editingDraft ? (
        <div className="message-edit-inline" style={{ padding: 8, borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Name" value={editingDraft.customerName || ''} onChange={(e) => onEditChange?.('customerName', e.target.value)} />
            <input placeholder="Phone" value={editingDraft.phoneNumber || ''} onChange={(e) => onEditChange?.('phoneNumber', e.target.value)} />
            <input placeholder="Email" value={editingDraft.email || ''} onChange={(e) => onEditChange?.('email', e.target.value)} />
            <input type="date" placeholder="Check-in" value={editingDraft.checkInDate || ''} onChange={(e) => onEditChange?.('checkInDate', e.target.value)} />
            <input type="date" placeholder="Check-out" value={editingDraft.checkOutDate || ''} onChange={(e) => onEditChange?.('checkOutDate', e.target.value)} />
            <input placeholder="Adults" value={((editingDraft.adults ?? 1)).toString()} onChange={(e) => onEditChange?.('adults', Number(e.target.value))} />
            <input placeholder="Children" value={((editingDraft.children ?? 0)).toString()} onChange={(e) => onEditChange?.('children', Number(e.target.value))} />
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" className="message-option-btn" onClick={() => onSaveEdit?.()}>Save</button>
            <button type="button" className="message-option-btn" onClick={() => onCancelEdit?.()}>Cancel</button>
          </div>
        </div>
      ) : null}
      <span className="message-time">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
