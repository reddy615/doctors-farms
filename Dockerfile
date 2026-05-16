# Multi-stage Dockerfile for Doctors Farms (Frontend + Backend)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --legacy-peer-deps --omit=dev --no-audit --no-fund

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend code
COPY backend ./backend

# Install backend dependencies if they exist
RUN if [ -f backend/package.json ]; then cd backend && npm install --legacy-peer-deps --omit=dev --no-audit --no-fund; fi

EXPOSE 3000 80

# Start the backend server
CMD ["npm", "start"]
