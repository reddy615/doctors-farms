import React from 'react';

const WhatsAppButton: React.FC = () => {
  console.log('WhatsAppButton component is being executed');

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'red',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      fontSize: '24px',
      fontWeight: 'bold',
      zIndex: 9999,
      border: '4px solid white'
    }}>
      WHATSAPP BUTTON TEST - VISIBLE?
      <br />
      <a
        href="https://wa.me/919955575969"
        style={{ color: 'yellow', textDecoration: 'underline' }}
        target="_blank"
        rel="noopener noreferrer"
      >
        Click to test WhatsApp
      </a>
    </div>
  );
};

export default WhatsAppButton;