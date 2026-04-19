# Doctors Farms Resort

A nature-focused resort website built with **Vite + React + TypeScript** and styled with **Tailwind CSS**. Features PhonePe payment integration and Docker deployment.

## Features

- 🏨 Room bookings with PhonePe payment gateway
- 📸 Photo gallery with custom images
- 🗺️ Interactive location map
- 🎥 Background video on homepage
- 📱 Mobile-responsive design
- 🔒 Secure payment processing

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + PhonePe API
- **Deployment**: Docker + Nginx reverse proxy

## Project Structure

- `src/` — React application source files
- `src/pages/` — main pages (Home, Rooms, About, Activities, Dining, Gallery, Contact)
- `src/components/` — shared UI components (Navbar, Footer)
- `backend/` — Express backend for mail, inquiries, and PhonePe payment APIs
- `public/` — static assets (images, videos)

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development servers:
   ```bash
   npm run dev          # Single localhost on http://localhost:5000
   ```

The Express server serves both the API and the frontend in development, so you only need one local URL.

### Docker Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Access at: http://localhost

## Environment Variables

Set these for PhonePe and mail integration:

- `MERCHANT_ID` — Your PhonePe merchant ID
- `SALT_KEY` — Your PhonePe salt key
- `SALT_INDEX` — Usually `1`
- `SMTP_HOST` — SMTP mail host (e.g. smtp.gmail.com)
- `SMTP_PORT` — SMTP port (e.g. 587)
- `SMTP_SECURE` — `true` for TLS, `false` for STARTTLS
- `SMTP_USER` — SMTP username/email
- `SMTP_PASS` — SMTP password/app password
- `CONTACT_EMAIL` — Destination inbox for booking inquiries

Provider-based mail options:

- `MAIL_PROVIDER` — `custom` | `gmail` | `brevo` | `resend`
- `MAIL_FROM` — sender address, e.g. `bookings@doctorsfarms.in`
- `RESEND_API_KEY` — required when `MAIL_PROVIDER=resend`

Recommended production setup:

1. Use a transactional provider (`resend`, `brevo`, `sendgrid`, or `ses`) instead of personal Gmail SMTP.
2. Verify your sending domain (`SPF`, `DKIM`, and `DMARC`).
3. Save booking/inquiry data first, then send emails (this backend already follows this pattern).

### Resend Quick Setup

1. Create and verify a domain sender in Resend.
2. Add these variables in backend environment:

```env
MAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
MAIL_FROM=bookings@doctorsfarms.in
CONTACT_EMAIL=doctorsfarms686@gmail.com
ADMIN_LIST=doctorsfarms686@gmail.com
```

3. Restart backend and verify with:
   - `GET /api/health/mail`

## Public Deployment

### Option 1: Railway (Recommended)

1. Push this repository to GitHub
2. Sign up at [Railway.app](https://railway.app)
3. Create new project → Deploy from GitHub
4. Railway auto-detects Docker setup
5. Set environment variables in Railway dashboard
6. Your site will be live at `https://your-project.railway.app`

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project root
3. Set environment variables in Vercel dashboard for the frontend build only
4. Set `VITE_API_URL` to your deployed backend URL
5. Deploy with `vercel --prod`

### Option 3: DigitalOcean App Platform

1. Push to GitHub
2. Create app in DigitalOcean App Platform
3. Connect GitHub repo
4. Configure environment variables
5. Deploy

## PhonePe Setup

1. Sign up for PhonePe Business account
2. Get merchant credentials from dashboard
3. Set environment variables as above
4. Test with PhonePe sandbox first

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test locally
5. Submit pull request

## License

MIT

```bash
npm run dev
```

Open the URL shown in the terminal (typically http://localhost:5173).

## Notes

- The booking form is a UI stub and does not send data to a backend.
- The site is designed for easy extension to add a backend booking API, payments, and admin dashboard.

---

### Features

- Responsive layout
- Tailwind CSS styling with custom brand palette
- React Router page navigation
- Booking inquiry form
- Placeholder gallery, rooms, and wellness packages
