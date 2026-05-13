
import { Home, DollarSign, Utensils, Users, Phone } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    { label: 'Book Room', icon: Home },
    { label: 'Room Prices', icon: DollarSign },
    { label: 'Facilities', icon: Users },
    { label: 'Activities', icon: Utensils },
    { label: 'Contact Support', icon: Phone },
  ];

  return (
    <div className="quick-actions">
      <p className="quick-actions-label">What would you like to know?</p>
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
