# Doctors Farms Spring Boot Backend

This is the Spring Boot backend for the Doctors Farms Resort website, converted from the original Node.js/Express implementation.

## Features

- ✅ **Inquiry Management**: Handle booking inquiries with email notifications
- ✅ **Email Integration**: Send confirmation emails to users and admins
- ✅ **PhonePe Payment**: Integration with PhonePe payment gateway
- ✅ **CORS Support**: Configured for frontend communication
- ✅ **Static File Serving**: Serves React frontend build files
- ✅ **Database Migration**: Automatically migrates data from Node.js JSON files
- ✅ **WhatsApp Integration**: Existing WhatsApp functionality preserved

## Quick Start

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- MySQL (for production) or H2 (for development)

### 1. Clone and Navigate
```bash
cd whatsapp-backend
```

### 2. Configure Environment Variables
Create `src/main/resources/application.properties` or set environment variables:

```properties
# Email Configuration (required for email functionality)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Application URLs
FRONTEND_URL=http://localhost:5174
BACKEND_URL=http://localhost:8080

# PhonePe Configuration (optional)
PHONEPE_MERCHANT_ID=your-merchant-id
PHONEPE_SALT_KEY=your-salt-key
```

### 3. Run the Application

**Development Mode (with H2 database):**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Production Mode (with MySQL):**
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

### 4. Access Points

- **API Base**: `http://localhost:8080/api/`
- **Health Check**: `http://localhost:8080/api/health`
- **H2 Console** (dev only): `http://localhost:8080/h2-console`
- **Frontend**: `http://localhost:8080/` (serves React app)

## API Endpoints

### Inquiry Management
- `POST /api/send-mail` - Submit booking inquiry
- `GET /api/inquiries` - Get all inquiries
- `GET /api/inquiries/{id}` - Get specific inquiry
- `GET /api/admins` - Get admin list

### Payment Integration
- `POST /api/create-payment` - Initiate PhonePe payment
- `POST /api/payment-callback` - Handle payment callback

### Debug Endpoints
- `GET /api/debug/cors` - CORS configuration info
- `GET /api/debug/config` - Application configuration

## Database Migration

The application automatically migrates inquiries from the Node.js `inquiries.json` file to the database on startup. The JSON file should be located at `../backend/inquiries.json` relative to the Spring Boot project.

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password) as `EMAIL_PASS`

### Development Email Testing
In development mode, emails are logged to console instead of being sent. For actual email testing, use production configuration.

## Deployment

### Railway Deployment
1. Push code to GitHub
2. Connect Railway to your repository
3. Set environment variables in Railway dashboard:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=https://your-railway-url.up.railway.app
   PHONEPE_MERCHANT_ID=your-merchant-id
   PHONEPE_SALT_KEY=your-salt-key
   ```
4. Set Start Command: `mvn spring-boot:run -Dserver.port=$PORT`

### Combined Frontend + Backend
The Spring Boot app serves both the API and the React frontend from the same port, eliminating CORS issues in production.

## Project Structure

```
src/main/java/com/doctorsfarms/whatsappbackend/
├── controller/
│   ├── InquiryController.java      # Main API endpoints
│   ├── PaymentController.java      # PhonePe integration
│   ├── AdminController.java        # Admin functionality
│   └── WhatsAppApiController.java  # WhatsApp features
├── model/
│   ├── Inquiry.java               # Inquiry entity
│   ├── Booking.java               # Booking entity
│   ├── Room.java                  # Room entity
│   └── User.java                  # User entity
├── repository/
│   ├── InquiryRepository.java     # Inquiry data access
│   └── ...                        # Other repositories
├── service/
│   ├── InquiryService.java        # Business logic
│   └── WhatsAppService.java       # WhatsApp integration
└── config/
    └── AppConfig.java             # CORS & static file config
```

## Configuration Profiles

- **default**: Production configuration with MySQL
- **dev**: Development configuration with H2 database and email logging

## Troubleshooting

### Email Not Sending
- Check `EMAIL_USER` and `EMAIL_PASS` environment variables
- Ensure you're using Gmail App Password, not regular password
- Check application logs for SMTP errors

### CORS Issues
- CORS is configured in `AppConfig.java`
- Allowed origins include localhost ports and Railway domains
- Check browser console for CORS error details

### Database Connection
- Development: Uses H2 in-memory database
- Production: Requires MySQL database configuration
- Check `application.properties` for database settings

### Static Files Not Served
- React build files should be in `src/main/resources/static/dist/`
- Run `npm run build` in the frontend directory first
- Copy `dist/` folder to `src/main/resources/static/dist/`

## Migration from Node.js

This Spring Boot application provides the same functionality as the original Node.js backend:

| Node.js | Spring Boot |
|---------|-------------|
| `server.js` | `InquiryController.java` |
| `inquiries.json` | `Inquiry` entity + database |
| `nodemailer` | `JavaMailSender` |
| `express.static` | `WebMvcConfigurer` |
| Environment vars | `application.properties` |

The API endpoints remain the same, ensuring frontend compatibility.
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