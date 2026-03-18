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
- `backend/` — PhonePe payment API server
- `public/` — static assets (images, videos)
- `api/` — Vercel serverless functions (alternative deployment)

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```

2. Start development servers:
   ```bash
   npm run dev          # Frontend on http://localhost:5173
   cd backend && npm start  # Backend on http://localhost:3000
   ```

### Docker Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Access at: http://localhost

## Environment Variables

Set these for PhonePe integration:

- `PHONEPE_MERCHANT_ID` — Your PhonePe merchant ID
- `PHONEPE_SALT_KEY` — Your PhonePe salt key
- `PHONEPE_BASE_URL` — PhonePe API URL (use sandbox for testing)

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
3. Set environment variables in Vercel dashboard
4. Deploy with `vercel --prod`

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
