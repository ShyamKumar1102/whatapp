# Chat Connect Dashboard - Backend Setup

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v12 or higher)
3. **npm** or **yarn**

## Database Setup

### 1. Install PostgreSQL
- Download and install PostgreSQL from https://www.postgresql.org/download/
- During installation, remember the password you set for the `postgres` user

### 2. Create Database
```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres

-- Create database
CREATE DATABASE chat_connect_db;

-- Create user (optional)
CREATE USER chat_connect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chat_connect_db TO chat_connect_user;

-- Exit psql
\q
```

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
# Update the following variables:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_connect_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### 4. Run Database Migrations & Seed Data
```bash
# This will create tables and insert sample data
npm run seed
```

### 5. Start Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend server will start on `http://localhost:5000`

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd ..  # Go back to root directory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Frontend Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Contacts
- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Pipeline
- `GET /api/pipeline` - Get all pipeline deals
- `GET /api/pipeline/stats` - Get pipeline statistics
- `GET /api/pipeline/activities` - Get recent activities
- `GET /api/pipeline/:id` - Get single deal
- `POST /api/pipeline` - Create new deal
- `PUT /api/pipeline/:id` - Update deal
- `DELETE /api/pipeline/:id` - Delete deal

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/health` - Health check

## Database Schema

### Tables Created:
1. **contacts** - Store contact information
2. **chats** - Store chat sessions
3. **messages** - Store individual messages
4. **pipelines** - Store sales pipeline deals
5. **pipeline_activities** - Store pipeline activity logs

## Features

✅ **PostgreSQL Database** with Sequelize ORM  
✅ **RESTful API** with Express.js  
✅ **Real-time Communication** with Socket.IO  
✅ **Data Validation** with Joi  
✅ **Security** with Helmet and Rate Limiting  
✅ **CORS** configured for frontend  
✅ **Environment Configuration**  
✅ **Database Seeding** with sample data  
✅ **Error Handling** middleware  
✅ **API Documentation** ready endpoints  

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists: `psql -U postgres -l`

### Port Conflicts
- Backend runs on port 5000
- Frontend runs on port 5173
- Change ports in `.env` if needed

### CORS Issues
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Default is `http://localhost:5173`

## Next Steps

1. **Authentication**: Add JWT-based authentication
2. **File Upload**: Implement file/media upload functionality
3. **Email Integration**: Add email notification system
4. **WhatsApp Integration**: Connect with WhatsApp Business API
5. **Analytics**: Add detailed analytics and reporting
6. **Deployment**: Deploy to cloud platforms (AWS, Heroku, etc.)

## Development Commands

```bash
# Backend
cd backend
npm run dev      # Start development server
npm run seed     # Seed database with sample data
npm start        # Start production server

# Frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```