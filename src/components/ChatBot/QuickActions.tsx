
import { Home, DollarSign, Utensils, Users, Phone, Minimize2 } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
  onMinimize?: () => void;
}

export default function QuickActions({ onAction, onMinimize }: QuickActionsProps) {
  const actions = [
    { label: 'Book Room', icon: Home },
    { label: 'Room Prices', icon: DollarSign },
    { label: 'Facilities', icon: Users },
    { label: 'Activities', icon: Utensils },
    { label: 'Contact Support', icon: Phone },
  ];

  return (
    <div className="quick-actions">
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <p className="quick-actions-label">What would you like to know?</p>
        {typeof onMinimize === 'function' ? (
          <button
            className="quick-actions-minimize-btn"
            onClick={onMinimize}
            title="Minimize"
            aria-label="Minimize"
          >
            <Minimize2 size={16} />
          </button>
        ) : null}
      </div>
      <div className="quick-actions-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onAction(action.label)}
              className="quick-action-btn"
            >
              <Icon size={18} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
