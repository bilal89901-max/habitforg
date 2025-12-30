# HabitForge API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "warrior123"
}

Response: 201
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "warrior123",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": { ... }
}
```

## Users

### Get User Profile
```http
GET /users/:id
Authorization: Bearer <token>

Response: 200
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "warrior123",
    "bio": "Epic warrior",
    "profile_picture_url": null,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get User Stats
```http
GET /users/:id/stats
Authorization: Bearer <token>

Response: 200
{
  "user": { ... },
  "avatar": {
    "id": 1,
    "name": "warrior123's Avatar",
    "level": 5,
    "total_xp": 2500,
    "strength": 10,
    "intelligence": 8,
    ...
  },
  "stats": {
    "total_habits": 5,
    "completed_quests": 12,
    "total_battles": 8,
    "battle_wins": 5,
    "total_friends": 3
  }
}
```

## Avatars

### Get My Avatar
```http
GET /avatars/me
Authorization: Bearer <token>

Response: 200
{
  "avatar": {
    "avatar_id": 1,
    "user_id": 1,
    "name": "warrior123's Avatar",
    "current_evolution_stage": "Apprentice",
    "level": 12,
    "total_xp": 14400,
    "strength": 15,
    "intelligence": 12,
    "vitality": 18,
    "spirit": 10,
    "social": 8,
    "wealth": 500,
    "gold": 1250,
    "premium_currency": 0
  }
}
```

### Get Evolution Status
```http
GET /avatars/:id/evolution-status
Authorization: Bearer <token>

Response: 200
{
  "currentLevel": 12,
  "currentXP": 14400,
  "currentStage": "Apprentice",
  "nextStage": "Warrior",
  "nextStageLevel": 25,
  "xpForNextLevel": 16900,
  "xpProgress": 13200,
  "progressPercentage": 78.1
}
```

## Habits

### Create Habit
```http
POST /habits
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Morning Exercise",
  "description": "30 minutes of cardio",
  "frequency": "daily",
  "linked_stat": "strength",
  "xp_reward": 15
}

Response: 201
{
  "message": "Habit created successfully",
  "habit": {
    "id": 1,
    "name": "Morning Exercise",
    "frequency": "daily",
    "linked_stat": "strength",
    ...
  }
}
```

### Get All Habits
```http
GET /habits
Authorization: Bearer <token>

Response: 200
{
  "habits": [
    {
      "id": 1,
      "name": "Morning Exercise",
      "frequency": "daily",
      "linked_stat": "strength",
      "is_active": true,
      "total_completions": "15",
      "last_completion": "2024-01-15"
    },
    ...
  ]
}
```

### Log Habit Completion
```http
POST /habits/:id/log
Authorization: Bearer <token>
Content-Type: application/json

{
  "completion_value": 1,
  "completed_date": "2024-01-15"
}

Response: 201
{
  "message": "Habit completion logged successfully",
  "log": {
    "id": 1,
    "habit_id": 1,
    "completed_date": "2024-01-15",
    "xp_earned": 15
  }
}
```

### Get Habit Statistics
```http
GET /habits/:id/stats
Authorization: Bearer <token>

Response: 200
{
  "habit": { ... },
  "stats": {
    "total_completions": 45,
    "current_streak": 7,
    "longest_streak": 15,
    "completions_last_30_days": 28,
    "recent_logs": [ ... ]
  }
}
```

## Quests

### Get Daily Quests
```http
GET /quests/daily
Authorization: Bearer <token>

Response: 200
{
  "quests": [
    {
      "user_quest_id": 1,
      "quest_id": 1,
      "title": "Morning Warrior",
      "description": "Complete 3 habits before noon",
      "quest_type": "daily",
      "requirement_type": "habit_count",
      "requirement_value": 3,
      "reward_xp": 50,
      "reward_gold": 25,
      "progress": 0,
      "is_completed": false
    },
    ...
  ]
}
```

### Get Weekly Quests
```http
GET /quests/weekly
Authorization: Bearer <token>

Response: 200
{
  "quests": [ ... ]
}
```

### Get Epic Quests
```http
GET /quests/epic
Authorization: Bearer <token>

Response: 200
{
  "active_quests": [ ... ],
  "available_quests": [ ... ]
}
```

### Complete Quest
```http
POST /quests/:id/complete
Authorization: Bearer <token>

Response: 200
{
  "message": "Quest completed successfully",
  "rewards": {
    "xp": 50,
    "gold": 25,
    "items": []
  }
}
```

## Friends

### Get Friends List
```http
GET /friends
Authorization: Bearer <token>

Response: 200
{
  "friends": [
    {
      "id": 2,
      "username": "warrior456",
      "profile_picture_url": null,
      "friends_since": "2024-01-10T00:00:00.000Z"
    },
    ...
  ]
}
```

### Send Friend Request
```http
POST /friends/:id/request
Authorization: Bearer <token>

Response: 201
{
  "message": "Friend request sent successfully",
  "friendship": {
    "id": 1,
    "user_id": 1,
    "friend_id": 2,
    "status": "pending"
  }
}
```

### Accept Friend Request
```http
POST /friends/:id/accept
Authorization: Bearer <token>

Response: 200
{
  "message": "Friend request accepted successfully"
}
```

### Get Friend Requests
```http
GET /friends/requests
Authorization: Bearer <token>

Response: 200
{
  "requests": [
    {
      "id": 3,
      "username": "warrior789",
      "request_id": 5,
      "request_date": "2024-01-15T10:00:00.000Z"
    },
    ...
  ]
}
```

### Compare with Friend
```http
GET /friends/:id/compare
Authorization: Bearer <token>

Response: 200
{
  "my_stats": {
    "level": 15,
    "total_xp": 22500,
    "strength": 20,
    ...
  },
  "friend_stats": {
    "level": 12,
    "total_xp": 14400,
    "strength": 15,
    ...
  },
  "comparison": {
    "habits": { "mine": 8, "theirs": 6 },
    "quests_completed": { "mine": 25, "theirs": 18 }
  }
}
```

## Battles

### Initiate Battle
```http
POST /battles
Authorization: Bearer <token>
Content-Type: application/json

{
  "defender_id": 2
}

Response: 201
{
  "message": "Battle completed",
  "battle": {
    "id": 1,
    "attacker_avatar_id": 1,
    "defender_avatar_id": 2,
    "winner_avatar_id": 1,
    "battle_date": "2024-01-15T12:00:00.000Z"
  },
  "result": {
    "winner": "attacker",
    "attacker_power": 250,
    "defender_power": 180,
    "damage": 75,
    "rewards": {
      "gold": 35,
      "xp": 40
    }
  }
}
```

### Get Battle History
```http
GET /battles/history
Authorization: Bearer <token>

Response: 200
{
  "battles": [
    {
      "id": 1,
      "attacker_username": "warrior123",
      "defender_username": "warrior456",
      "result": "win",
      "battle_date": "2024-01-15T12:00:00.000Z",
      "rewards_gold": 35,
      "rewards_xp": 40
    },
    ...
  ],
  "stats": {
    "total": 15,
    "wins": 9,
    "losses": 6,
    "win_rate": "60.00"
  }
}
```

### Get Random Opponents
```http
GET /battles/opponents
Authorization: Bearer <token>

Response: 200
{
  "opponents": [
    {
      "id": 2,
      "username": "warrior456",
      "avatar_name": "warrior456's Avatar",
      "level": 13,
      "current_evolution_stage": "Apprentice"
    },
    ...
  ]
}
```

## Guilds

### Create Guild
```http
POST /guilds
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Elite Warriors",
  "description": "For the strongest warriors"
}

Response: 201
{
  "message": "Guild created successfully",
  "guild": {
    "id": 1,
    "name": "Elite Warriors",
    "description": "For the strongest warriors",
    "leader_id": 1,
    "member_count": 1,
    "level": 1
  }
}
```

### Search Guilds
```http
GET /guilds/search?search=warrior&limit=20
Authorization: Bearer <token>

Response: 200
{
  "guilds": [
    {
      "id": 1,
      "name": "Elite Warriors",
      "description": "For the strongest warriors",
      "member_count": 15,
      "level": 5,
      "leader_username": "warrior123"
    },
    ...
  ]
}
```

### Join Guild
```http
POST /guilds/:id/join
Authorization: Bearer <token>

Response: 201
{
  "message": "Joined guild successfully"
}
```

## Shop

### Get Shop Items
```http
GET /shop?type=weapon&available_only=true
Authorization: Bearer <token>

Response: 200
{
  "items": [
    {
      "id": 1,
      "item_name": "Steel Sword",
      "item_type": "weapon",
      "description": "A well-crafted blade",
      "price_gold": 500,
      "price_premium": 0,
      "rarity": "rare",
      "stats_bonus": { "strength": 5 },
      "is_available": true
    },
    ...
  ]
}
```

### Purchase Item
```http
POST /shop/:item_id/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "use_premium": false
}

Response: 201
{
  "message": "Item purchased successfully",
  "item": { ... },
  "cost": {
    "currency": "gold",
    "amount": 500
  }
}
```

### Get Inventory
```http
GET /shop/inventory
Authorization: Bearer <token>

Response: 200
{
  "inventory": [
    {
      "inventory_id": 1,
      "item_id": 1,
      "item_name": "Steel Sword",
      "item_type": "weapon",
      "quantity": 1,
      "is_equipped": true,
      "purchased_at": "2024-01-15T10:00:00.000Z"
    },
    ...
  ]
}
```

## Analytics

### Get Habit Analytics
```http
GET /analytics/habits?period=30
Authorization: Bearer <token>

Response: 200
{
  "completions_by_day": [
    { "date": "2024-01-01", "completions": 5 },
    { "date": "2024-01-02", "completions": 7 },
    ...
  ],
  "completions_by_habit": [
    {
      "name": "Morning Exercise",
      "linked_stat": "strength",
      "completions": 28,
      "total_xp": 420
    },
    ...
  ],
  "completions_by_stat": [
    { "linked_stat": "strength", "completions": 45 },
    { "linked_stat": "intelligence", "completions": 38 },
    ...
  ],
  "top_streaks": [ ... ],
  "period_days": 30
}
```

### Get Avatar Analytics
```http
GET /analytics/avatar
Authorization: Bearer <token>

Response: 200
{
  "current_stats": {
    "strength": 20,
    "intelligence": 15,
    ...
  },
  "stat_percentages": [
    { "stat": "strength", "value": 20, "percentage": "25.32" },
    ...
  ],
  "level_info": {
    "current_level": 15,
    "current_xp": 22500,
    "xp_progress": 300,
    "xp_needed": 2500,
    "progress_percentage": "12.00"
  },
  "evolution": {
    "current_stage": "Apprentice",
    "next_stage": "Warrior",
    "next_stage_level": 25
  },
  "xp_history": [ ... ]
}
```

### Get Leaderboards
```http
GET /analytics/leaderboards?type=level&limit=50
Authorization: Bearer <token>

Response: 200
{
  "type": "level",
  "leaderboard": [
    {
      "id": 5,
      "username": "legend999",
      "avatar_name": "legend999's Avatar",
      "level": 87,
      "total_xp": 756900,
      "current_evolution_stage": "Legend"
    },
    ...
  ],
  "count": 50
}
```

### Get Avatar Prediction
```http
GET /analytics/prediction
Authorization: Bearer <token>

Response: 200
{
  "current": {
    "xp": 22500,
    "level": 15,
    "stage": "Apprentice"
  },
  "average_daily_xp": 150,
  "predictions": [
    {
      "days": 7,
      "predicted_xp": 23550,
      "predicted_level": 15,
      "predicted_stage": "Apprentice",
      "xp_gain": 1050,
      "level_gain": 0
    },
    {
      "days": 30,
      "predicted_xp": 27000,
      "predicted_level": 16,
      "predicted_stage": "Apprentice",
      "xp_gain": 4500,
      "level_gain": 1
    },
    ...
  ]
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API has rate limiting enabled:
- Window: 15 minutes
- Max requests: 100 per window per IP
- Exceeded limit response: 429 Too Many Requests
