# WhatsApp Backend for Doctors Farms Resort

A comprehensive WhatsApp-first backend system for handling room bookings, guest support, automated replies, promotions, and real-time notifications.

## Architecture

```
User (WhatsApp)
    ↓
Meta Cloud API
    ↓
Webhook Controller (Spring Boot)
    ↓
Message Queue (RabbitMQ)
    ↓
Conversation Engine
    ↓
Business Logic (Booking / Support / Offers)
    ↓
Database (MySQL + Redis)
    ↓
Response API → WhatsApp
```

## Features

- 🏡 **Room Bookings**: Complete booking flow with availability checking
- 💬 **Guest Support**: Automated responses and manual intervention
- 🤖 **Automated Replies**: AI-powered conversation handling
- 🎯 **Promotions & Offers**: Broadcast messaging system
- 🔔 **Real-time Notifications**: Booking confirmations and reminders
- 📊 **Analytics**: Conversion tracking and reporting

## Tech Stack

- **Backend**: Spring Boot 3.2.0
- **Database**: MySQL (bookings, users)
- **Cache**: Redis (sessions, fast lookups)
- **Message Queue**: RabbitMQ
- **WhatsApp API**: Meta Cloud API
- **Language**: Java 17

## Setup Instructions

### Prerequisites

- Java 17
- MySQL 8.0
- Redis
- RabbitMQ
- Maven

### Environment Variables

Create a `.env` file or set environment variables:

```bash
WHATSAPP_API_TOKEN=your_whatsapp_api_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
JWT_SECRET=your_jwt_secret
```

### Database Setup

1. Create MySQL database: `doctorsfarms`
2. Update `application.properties` with your database credentials

### Running with Docker

1. Start the infrastructure services:
```bash
docker-compose up -d
```

2. Build and run the Spring Boot application:
```bash
mvn spring-boot:run
```

### Manual Setup

If you prefer manual setup:

1. Install MySQL, Redis, and RabbitMQ
2. Create database: `doctorsfarms`
3. Update `application.properties` with your connection details
4. Run: `mvn spring-boot:run`

## API Endpoints

### Webhook
- `GET /webhook/whatsapp` - Webhook verification
- `POST /webhook/whatsapp` - Incoming WhatsApp messages

### API
- `POST /api/whatsapp/send` - Send WhatsApp message
- `POST /api/whatsapp/book-room` - Create room booking

## WhatsApp Flows

### Booking Flow
1. User: "Book room"
2. Bot: "Select check-in date"
3. Bot: "Choose room type"
4. Bot: "Confirm booking"
5. Payment link sent

### Support Flow
1. User: "Need menu"
2. Bot: Sends PDF/menu link

### Promotions
- Broadcast offers to all users
- Weekend specials
- Location sharing with maps

## Security

- Webhook token verification
- Rate limiting
- Input validation
- Encrypted sensitive data

## Future Enhancements

- 🤖 AI Chatbot integration
- 🎤 Voice message support
- 🌐 Multi-language support (Telugu/English)
- 📊 Advanced analytics dashboard
- 🔔 Push notifications
- 💳 Payment integration