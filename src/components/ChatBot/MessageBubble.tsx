

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

  const fieldClassName = 'message-edit-field';
  
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
        <div className="message-edit-inline">
          <div className="message-edit-grid">
            <label className={fieldClassName}>
              <span>Name :</span>
              <input value={editingDraft.customerName || ''} onChange={(e) => onEditChange?.('customerName', e.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>Phone :</span>
              <input value={editingDraft.phoneNumber || ''} onChange={(e) => onEditChange?.('phoneNumber', e.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>Email :</span>
              <input value={editingDraft.email || ''} onChange={(e) => onEditChange?.('email', e.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>Check-in :</span>
              <input type="date" value={editingDraft.checkInDate || ''} onChange={(e) => onEditChange?.('checkInDate', e.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>Check-out :</span>
              <input type="date" value={editingDraft.checkOutDate || ''} onChange={(e) => onEditChange?.('checkOutDate', e.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>Adults :</span>
              <input value={((editingDraft.adults ?? 1)).toString()} onChange={(e) => onEditChange?.('adults', Number(e.target.value))} />
            </label>
            <label className={fieldClassName}>
              <span>Children :</span>
              <input value={((editingDraft.children ?? 0)).toString()} onChange={(e) => onEditChange?.('children', Number(e.target.value))} />
            </label>
          </div>
          <div className="message-edit-actions">
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
