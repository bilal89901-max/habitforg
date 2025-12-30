import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { JWTPayload } from '../types';
import { sanitizeUser } from '../utils/helpers';

export const register = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await client.query('BEGIN');

    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, username]
    );

    const user = userResult.rows[0];

    const avatarResult = await client.query(
      'INSERT INTO avatars (user_id, name, current_evolution_stage) VALUES ($1, $2, $3) RETURNING *',
      [user.id, `${username}'s Avatar`, 'Newborn']
    );

    const avatar = avatarResult.rows[0];

    await client.query(
      'INSERT INTO avatar_stats (avatar_id) VALUES ($1)',
      [avatar.id]
    );

    await client.query('COMMIT');

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin
      } as JWTPayload,
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string | number }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin
      } as JWTPayload,
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string | number }
    );

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token: oldToken } = req.body;

    if (!oldToken) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'default-secret') as JWTPayload;

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin
      } as JWTPayload,
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string | number }
    );

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ message: 'Logout successful' });
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 AND is_active = true RETURNING id',
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
