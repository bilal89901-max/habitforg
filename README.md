# HabitForge 🎮⚔️

A real-life RPG app where users create digital avatars that evolve based on their real-life habits. The app combines habit tracking with social gaming elements.

## Features

### 🎭 Core Features
- **User Authentication**: JWT-based secure authentication system
- **Avatar System**: Create and evolve your digital avatar through 6 stages (Newborn → Mythic)
- **Habit Tracking**: Track daily/weekly habits linked to avatar stats
- **Quest System**: Complete daily, weekly, and epic quests for rewards
- **Friend System**: Add friends, compare stats, and view activity feeds
- **Battle System**: Auto-battle mechanics using avatar stats with ELO rankings
- **Guild System**: Create/join guilds with up to 50 members
- **Shop & Cosmetics**: Purchase items with in-game currency
- **Analytics Dashboard**: Visualize progress and get predictions

### 📊 Avatar Stats
- **Strength**: Physical power and combat prowess
- **Intelligence**: Mental acuity and learning
- **Vitality**: Health and endurance
- **Spirit**: Willpower and magical ability
- **Social**: Charisma and relationships
- **Wealth**: Financial prosperity

### 🏆 Evolution Stages
1. **Newborn** (Level 1-9)
2. **Apprentice** (Level 10-24)
3. **Warrior** (Level 25-49)
4. **Champion** (Level 50-74)
5. **Legend** (Level 75-99)
6. **Mythic** (Level 100+)

## Tech Stack

### Frontend
- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** for database
- **JWT** for authentication
- **WebSockets** for real-time features

## Project Structure

```
habitforge/
├── app/                    # Next.js frontend
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main dashboard
│   ├── habits/            # Habit management
│   ├── quests/            # Quest system
│   ├── friends/           # Social features
│   ├── battles/           # Battle system
│   ├── guilds/            # Guild system
│   ├── shop/              # Shop and inventory
│   └── analytics/         # Analytics dashboard
├── backend/               # Express API server
│   └── src/
│       ├── config/        # Configuration
│       ├── controllers/   # Route controllers
│       ├── middleware/    # Express middleware
│       ├── routes/        # API routes
│       ├── types/         # TypeScript types
│       ├── utils/         # Utility functions
│       └── database/      # Database migrations & seeds
├── docker-compose.yml     # PostgreSQL setup
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+ 
- PostgreSQL 16+ (or use Docker)
- npm or yarn

### 1. Database Setup

#### Option A: Using Docker (Recommended)
```bash
docker-compose up -d
```

#### Option B: Local PostgreSQL
Install PostgreSQL and create a database:
```bash
createdb habitforge
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your database credentials

# Run migrations
npm run migrate

# Seed initial data (quests, shop items, etc.)
npm run seed

# Start backend server
npm run dev
```

The API server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# From project root
npm install

# Start Next.js development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### Quick Start (All Commands)

```bash
# Terminal 1: Start PostgreSQL
docker-compose up -d

# Terminal 2: Setup and start backend
cd backend
npm install
npm run migrate
npm run seed
npm run dev

# Terminal 3: Start frontend
npm install
npm run dev
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login
POST   /api/auth/refresh-token  - Refresh JWT token
POST   /api/auth/logout         - Logout
POST   /api/auth/reset-password - Reset password
```

### User & Avatar Endpoints
```
GET    /api/users/:id           - Get user profile
PUT    /api/users/:id           - Update user profile
DELETE /api/users/:id           - Delete account
GET    /api/users/:id/stats     - Get user statistics

GET    /api/avatars/me          - Get current user's avatar
GET    /api/avatars/:id         - Get avatar by ID
PUT    /api/avatars/:id         - Update avatar
GET    /api/avatars/:id/evolution-status - Get evolution status
```

### Habit Endpoints
```
POST   /api/habits              - Create habit
GET    /api/habits              - List user's habits
PUT    /api/habits/:id          - Update habit
DELETE /api/habits/:id          - Delete habit
POST   /api/habits/:id/log      - Log habit completion
GET    /api/habits/:id/stats    - Get habit statistics
```

### Quest Endpoints
```
GET    /api/quests              - Get assigned quests
GET    /api/quests/daily        - Get daily quests
GET    /api/quests/weekly       - Get weekly quests
GET    /api/quests/epic         - Get epic quests
POST   /api/quests/:id/start    - Start epic quest
POST   /api/quests/:id/complete - Complete quest
```

### Friend Endpoints
```
GET    /api/friends             - List friends
GET    /api/friends/requests    - List friend requests
GET    /api/friends/activity    - Get friend activity feed
POST   /api/friends/:id/request - Send friend request
POST   /api/friends/:id/accept  - Accept friend request
DELETE /api/friends/:id         - Remove friend
GET    /api/friends/:id/compare - Compare with friend
```

### Battle Endpoints
```
POST   /api/battles             - Initiate battle
GET    /api/battles/history     - Get battle history
GET    /api/battles/opponents   - Get random opponents
GET    /api/battles/:id         - Get battle details
```

### Guild Endpoints
```
POST   /api/guilds              - Create guild
GET    /api/guilds/search       - Search guilds
GET    /api/guilds/:id          - Get guild details
POST   /api/guilds/:id/join     - Join guild
DELETE /api/guilds/:id/leave    - Leave guild
POST   /api/guilds/:id/members  - Manage members
POST   /api/guilds/:id/challenges - Create challenge
GET    /api/guilds/:id/challenges - Get challenges
```

### Shop Endpoints
```
GET    /api/shop                - List shop items
POST   /api/shop/:item_id/purchase - Purchase item
GET    /api/shop/inventory      - Get user inventory
POST   /api/shop/inventory/:item_id/equip - Equip item
POST   /api/shop/inventory/:item_id/unequip - Unequip item
```

### Analytics Endpoints
```
GET    /api/analytics/habits    - Get habit analytics
GET    /api/analytics/avatar    - Get avatar analytics
GET    /api/analytics/leaderboards - Get leaderboards
GET    /api/analytics/prediction - Get avatar predictions
GET    /api/analytics/comparison - Compare with similar users
```

## Database Schema

See `backend/src/database/schema.sql` for the complete database schema including:
- Users & Authentication
- Avatars & Stats
- Habits & Logs
- Quests
- Friends
- Battles
- Guilds
- Shop Items & Inventory
- Achievements
- Activity Feed
- Notifications

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=habitforge
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

## Scripts

### Root Level
```bash
npm run dev              # Start Next.js frontend
npm run build            # Build Next.js for production
npm run start            # Start Next.js production server

npm run backend:dev      # Start backend in development mode
npm run backend:build    # Build backend
npm run backend:start    # Start backend in production mode
npm run backend:migrate  # Run database migrations
npm run backend:seed     # Seed initial data
```

### Backend
```bash
npm run dev      # Start with hot reload (ts-node-dev)
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run migrate  # Run database migrations
npm run seed     # Seed database with initial data
```

## Development Tips

### Testing API Endpoints
Use tools like:
- **Postman** or **Insomnia** for REST API testing
- **curl** for command-line testing
- **Thunder Client** (VS Code extension)

Example curl request:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Database Management
```bash
# Connect to PostgreSQL (Docker)
docker exec -it habitforge-postgres psql -U postgres -d habitforge

# Common SQL commands
\dt              # List tables
\d table_name    # Describe table
SELECT * FROM users LIMIT 10;
```

### Debugging
- Backend logs are printed to console
- Check Network tab in browser DevTools for API calls
- Use `console.log()` for debugging (remove in production)

## Security Considerations

- ✅ JWT tokens expire after 7 days
- ✅ Passwords are hashed with bcrypt
- ✅ Rate limiting on API endpoints
- ✅ CORS configured for frontend origin
- ✅ Helmet.js for security headers
- ✅ SQL injection protection (parameterized queries)
- ✅ Input validation on all endpoints

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use environment variables for secrets
3. Set up proper PostgreSQL instance
4. Configure reverse proxy (nginx)
5. Enable HTTPS
6. Set up monitoring and logging

### Frontend
1. Build Next.js: `npm run build`
2. Deploy to Vercel, Netlify, or custom server
3. Configure environment variables
4. Set up custom domain
5. Enable CDN and caching

## Future Enhancements

- [ ] Real-time WebSocket notifications
- [ ] Mobile app (React Native)
- [ ] Social login (Google, Facebook)
- [ ] Email notifications
- [ ] Advanced analytics with charts
- [ ] Achievement system
- [ ] Daily login rewards
- [ ] Guild wars and tournaments
- [ ] Marketplace for trading items
- [ ] Avatar customization tool

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for learning or building your own habit tracker!

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoints

---

**Built with ❤️ for habit builders and RPG enthusiasts**
