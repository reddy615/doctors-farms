import React from 'react';

const WhatsAppButton: React.FC = () => {
  return (
    <a
      href="https://wa.me/+919955575969"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        backgroundColor: '#25D366',
        color: 'white',
        padding: '0.75rem 1rem',
        borderRadius: '9999px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        textDecoration: 'none',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 700,
        fontSize: '0.95rem'
      }}
    >
      <span>🟢</span>
      WhatsApp Chat
    </a>
  );
};

export default WhatsAppButton;