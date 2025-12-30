# HabitForge Quick Start Guide

Get up and running with HabitForge in 5 minutes! ⚡

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js 20+ installed ([Download](https://nodejs.org/))
- ✅ Docker installed ([Download](https://www.docker.com/)) - OR PostgreSQL 16+
- ✅ Git installed
- ✅ A terminal/command prompt

## Option 1: Automated Setup (Recommended)

The fastest way to get started:

```bash
# Clone the repository
git clone <your-repo-url>
cd habitforge

# Run the setup script
chmod +x setup.sh
./setup.sh
```

That's it! The script will:
1. Install all dependencies
2. Start PostgreSQL with Docker
3. Run database migrations
4. Seed initial data (quests, shop items, etc.)

## Option 2: Manual Setup

If you prefer to do it step by step:

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Start PostgreSQL

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb habitforge

# Update backend/.env with your credentials
```

### Step 3: Setup Database

```bash
cd backend

# Run migrations
npm run migrate

# Seed initial data
npm run seed

cd ..
```

## Running the Application

You need two terminal windows:

**Terminal 1: Backend Server**
```bash
cd backend
npm run dev
```

Backend will run on: `http://localhost:5000`

**Terminal 2: Frontend Server**
```bash
npm run dev
```

Frontend will run on: `http://localhost:3000`

## First Steps After Setup

### 1. Create an Account

1. Open http://localhost:3000
2. Click "Start Your Journey" or "Register"
3. Fill in your details:
   - Username: `warrior123`
   - Email: `warrior@example.com`
   - Password: `password123`
4. Click "Register"

You'll be automatically logged in and redirected to the dashboard!

### 2. Explore Your Avatar

On the dashboard, you'll see:
- Your avatar's name and stats
- Current level and XP
- Evolution stage (starts at "Newborn")
- Six core stats (Strength, Intelligence, Vitality, Spirit, Social, Wealth)
- Gold and premium currency

### 3. Create Your First Habit

```bash
# Using the API directly with curl:
curl -X POST http://localhost:5000/api/habits \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Exercise",
    "description": "30 minutes of cardio",
    "frequency": "daily",
    "linked_stat": "strength",
    "xp_reward": 15
  }'
```

Or use the frontend (once habit UI is built).

### 4. Complete a Habit

```bash
curl -X POST http://localhost:5000/api/habits/1/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completion_value": 1}'
```

This will:
- Add 15 XP to your avatar
- Increase your Strength stat by 1
- Update your level if you gained enough XP

### 5. Check Daily Quests

```bash
curl -X GET http://localhost:5000/api/quests/daily \
  -H "Authorization: Bearer YOUR_TOKEN"
```

You'll get 3 random daily quests like:
- "Complete 3 habits before noon"
- "Log any 5 habits today"
- "Complete 2 strength-related habits"

## Testing the API

### Get Your Token

After logging in, check the browser console or use curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"warrior@example.com","password":"password123"}'

# Save the token from the response
```

### Example API Calls

```bash
# Set your token
TOKEN="your_jwt_token_here"

# Get your avatar
curl http://localhost:5000/api/avatars/me \
  -H "Authorization: Bearer $TOKEN"

# Get all habits
curl http://localhost:5000/api/habits \
  -H "Authorization: Bearer $TOKEN"

# Get daily quests
curl http://localhost:5000/api/quests/daily \
  -H "Authorization: Bearer $TOKEN"

# Get leaderboards
curl "http://localhost:5000/api/analytics/leaderboards?type=level" \
  -H "Authorization: Bearer $TOKEN"
```

## Common Issues & Solutions

### Issue: "Port 5000 already in use"

Solution: Stop other services using port 5000 or change the port in `backend/.env`

```bash
# backend/.env
PORT=5001
```

### Issue: "Cannot connect to database"

Solution: Make sure PostgreSQL is running

```bash
# Check Docker container
docker ps | grep postgres

# Or restart it
docker-compose restart
```

### Issue: "Module not found" errors

Solution: Reinstall dependencies

```bash
# Delete node_modules
rm -rf node_modules backend/node_modules
rm package-lock.json backend/package-lock.json

# Reinstall
npm install
cd backend && npm install
```

### Issue: "Database migration failed"

Solution: Reset the database

```bash
# Connect to postgres
docker exec -it habitforge-postgres psql -U postgres

# Drop and recreate
DROP DATABASE habitforge;
CREATE DATABASE habitforge;
\q

# Re-run migrations
cd backend
npm run migrate
npm run seed
```

## Project Structure Quick Reference

```
habitforge/
├── app/                    # Next.js pages
│   ├── (auth)/            # Auth pages (login, register)
│   └── (dashboard)/       # Dashboard and main app pages
├── backend/               # Express API
│   └── src/
│       ├── controllers/   # Business logic
│       ├── routes/        # API endpoints
│       └── database/      # Schema & seeds
├── lib/                   # Shared utilities
│   └── api/              # API client functions
└── components/            # React components
```

## Useful Commands

### Backend

```bash
cd backend

# Development
npm run dev              # Start with hot reload

# Database
npm run migrate          # Run migrations
npm run seed            # Seed data

# Production
npm run build           # Build TypeScript
npm start              # Start production server
```

### Frontend

```bash
# Development
npm run dev             # Start Next.js dev server

# Production
npm run build          # Build for production
npm start             # Start production server
```

### Database

```bash
# Connect to database
docker exec -it habitforge-postgres psql -U postgres -d habitforge

# View tables
\dt

# Query data
SELECT * FROM users;
SELECT * FROM avatars;
SELECT * FROM habits;
```

## What to Build Next

Now that you have the backend running, you can:

1. **Build Frontend Pages**
   - Habits management page
   - Quests page with daily/weekly/epic tabs
   - Friends page with requests
   - Battle page with opponent selection
   - Guild browsing and management
   - Shop with item grid
   - Analytics with charts

2. **Enhance the API**
   - Add real-time WebSocket notifications
   - Implement achievement system
   - Add email notifications
   - Create admin dashboard

3. **Test Everything**
   - Write unit tests
   - Add integration tests
   - Test with multiple users
   - Load testing

## Resources

- 📖 [Full Documentation](README.md)
- 🔌 [API Reference](API.md)
- 🤝 [Contributing Guide](CONTRIBUTING.md)
- 📊 [Implementation Status](IMPLEMENTATION_STATUS.md)

## Getting Help

- Check the [README.md](README.md) for detailed documentation
- Review [API.md](API.md) for endpoint details
- Look at existing controller code for examples
- Open an issue if you find bugs

---

**Ready to level up your life? Start building! 🎮⚔️**
