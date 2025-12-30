import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../utils/helpers';

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (req.user?.userId !== userId && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { username, bio, profile_picture_url } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (profile_picture_url !== undefined) {
      updates.push(`profile_picture_url = $${paramCount++}`);
      values.push(profile_picture_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} AND is_active = true RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (req.user?.userId !== userId && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const avatarResult = await pool.query(
      `SELECT a.*, ast.* FROM avatars a
       LEFT JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [userId]
    );

    const habitsResult = await pool.query(
      'SELECT COUNT(*) as total_habits FROM habits WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const completedQuestsResult = await pool.query(
      'SELECT COUNT(*) as completed_quests FROM user_quests WHERE user_id = $1 AND is_completed = true',
      [userId]
    );

    const battlesResult = await pool.query(
      `SELECT COUNT(*) as total_battles,
              SUM(CASE WHEN winner_avatar_id = a.id THEN 1 ELSE 0 END) as wins
       FROM battles b
       JOIN avatars a ON (b.attacker_avatar_id = a.id OR b.defender_avatar_id = a.id)
       WHERE a.user_id = $1`,
      [userId]
    );

    const friendsResult = await pool.query(
      'SELECT COUNT(*) as total_friends FROM friends WHERE user_id = $1 AND status = $2',
      [userId, 'accepted']
    );

    res.json({
      user: sanitizeUser(userResult.rows[0]),
      avatar: avatarResult.rows[0] || null,
      stats: {
        total_habits: parseInt(habitsResult.rows[0]?.total_habits || '0'),
        completed_quests: parseInt(completedQuestsResult.rows[0]?.completed_quests || '0'),
        total_battles: parseInt(battlesResult.rows[0]?.total_battles || '0'),
        battle_wins: parseInt(battlesResult.rows[0]?.wins || '0'),
        total_friends: parseInt(friendsResult.rows[0]?.total_friends || '0')
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
};
