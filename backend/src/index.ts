import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import avatarRoutes from './routes/avatar.routes';
import habitRoutes from './routes/habit.routes';
import questRoutes from './routes/quest.routes';
import friendRoutes from './routes/friend.routes';
import battleRoutes from './routes/battle.routes';
import guildRoutes from './routes/guild.routes';
import shopRoutes from './routes/shop.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 HabitForge API server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
