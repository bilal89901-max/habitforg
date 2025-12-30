import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { getEvolutionStage, calculateLevel } from '../utils/helpers';

export const getAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, ast.*,
              a.id as avatar_id,
              ast.id as stats_id
       FROM avatars a
       LEFT JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const avatar = result.rows[0];

    res.json({ avatar });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: 'Failed to get avatar' });
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { name, base_appearance } = req.body;

    await client.query('BEGIN');

    const avatarCheck = await client.query(
      'SELECT user_id FROM avatars WHERE id = $1',
      [id]
    );

    if (avatarCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Avatar not found' });
    }

    if (avatarCheck.rows[0].user_id !== req.user?.userId && !req.user?.is_admin) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (base_appearance) {
      updates.push(`base_appearance = $${paramCount++}`);
      values.push(JSON.stringify(base_appearance));
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    const result = await client.query(
      `UPDATE avatars SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    await client.query('COMMIT');

    res.json({ message: 'Avatar updated successfully', avatar: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  } finally {
    client.release();
  }
};

export const getEvolutionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, ast.*
       FROM avatars a
       LEFT JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const avatar = result.rows[0];
    const currentLevel = avatar.level || 1;
    const currentXP = avatar.total_xp || 0;
    const currentStage = getEvolutionStage(currentLevel);
    const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
    const xpProgress = currentXP - (Math.pow(currentLevel - 1, 2) * 100);

    let nextStage = currentStage;
    let nextStageLevel = 0;

    if (currentLevel < 10) {
      nextStage = 'Apprentice';
      nextStageLevel = 10;
    } else if (currentLevel < 25) {
      nextStage = 'Warrior';
      nextStageLevel = 25;
    } else if (currentLevel < 50) {
      nextStage = 'Champion';
      nextStageLevel = 50;
    } else if (currentLevel < 75) {
      nextStage = 'Legend';
      nextStageLevel = 75;
    } else if (currentLevel < 100) {
      nextStage = 'Mythic';
      nextStageLevel = 100;
    }

    res.json({
      currentLevel,
      currentXP,
      currentStage,
      nextStage,
      nextStageLevel,
      xpForNextLevel,
      xpProgress,
      progressPercentage: (xpProgress / xpForNextLevel) * 100
    });
  } catch (error) {
    console.error('Get evolution status error:', error);
    res.status(500).json({ error: 'Failed to get evolution status' });
  }
};

export const getUserAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT a.*, ast.*,
              a.id as avatar_id,
              ast.id as stats_id
       FROM avatars a
       LEFT JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    res.json({ avatar: result.rows[0] });
  } catch (error) {
    console.error('Get user avatar error:', error);
    res.status(500).json({ error: 'Failed to get avatar' });
  }
};
