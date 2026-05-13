# Environment Configuration for Doctors Farms Resort Chatbot

## Backend Environment (.env in /backend directory)

```bash
# Node Environment
NODE_ENV=development

# Server Configuration
PORT=5000
HOST=0.0.0.0
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# OpenAI Configuration (Optional - for AI-powered responses)
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration (for booking notifications)
MAIL_PROVIDER=resend  # or 'gmail', 'brevo', 'custom'
RESEND_API_KEY=your_resend_api_key_here

# Alternative SMTP Configuration (if not using Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CONTACT_EMAIL=doctorsfarms686@gmail.com
ADMIN_LIST=admin@doctorsfarms.in,support@doctorsfarms.in

# PhonePe Payment Integration
PHONEPE_ENV=production  # or 'sandbox'
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
```

## Frontend Environment (.env in root directory)

```bash
# Frontend API Configuration
VITE_BACKEND_URL=http://localhost:5000
```

## Production Environment

### Backend Production (.env)
```bash
NODE_ENV=production
PORT=5000
BACKEND_URL=https://api.doctorsfarms.in  # or your production backend URL
FRONTEND_URL=https://doctors-farms-production.up.railway.app

# OpenAI API Key
OPENAI_API_KEY=your_production_openai_key

# Email (Production)
MAIL_PROVIDER=resend
RESEND_API_KEY=your_production_resend_key

# PhonePe (Production)
PHONEPE_ENV=production
PHONEPE_MERCHANT_ID=prod_merchant_id
PHONEPE_SALT_KEY=prod_salt_key
```

### Frontend Production (.env.production)
```bash
VITE_BACKEND_URL=https://api.doctorsfarms.in
```

## Getting OpenAI API Key

1. Go to https://platform.openai.com
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into .env file

## Getting Resend API Key

1. Go to https://resend.com
2. Sign up
3. Get your API key from the dashboard
4. Paste into .env file

## Quick Start

1. Copy the configuration above to your `.env` files
2. Update with your actual credentials
3. Never commit `.env` files to Git (they contain secrets)
4. For Railway/production deployment, add environment variables through the dashboard
