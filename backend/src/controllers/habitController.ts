import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { calculateLevel, getEvolutionStage, formatDate } from '../utils/helpers';

export const createHabit = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, frequency, linked_stat, xp_reward } = req.body;

    if (!name || !frequency || !linked_stat) {
      return res.status(400).json({ error: 'Name, frequency, and linked stat are required' });
    }

    const validStats = ['strength', 'intelligence', 'vitality', 'spirit', 'social', 'wealth'];
    if (!validStats.includes(linked_stat)) {
      return res.status(400).json({ error: 'Invalid linked stat' });
    }

    const result = await pool.query(
      `INSERT INTO habits (user_id, name, description, frequency, linked_stat, xp_reward)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.userId, name, description, frequency, linked_stat, xp_reward || 10]
    );

    res.status(201).json({ message: 'Habit created successfully', habit: result.rows[0] });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
};

export const getHabits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT h.*,
              COUNT(hl.id) as total_completions,
              MAX(hl.completed_date) as last_completion
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id
       WHERE h.user_id = $1 AND h.is_active = true
       GROUP BY h.id
       ORDER BY h.created_at DESC`,
      [req.user.userId]
    );

    res.json({ habits: result.rows });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Failed to get habits' });
  }
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, description, frequency, linked_stat, is_active } = req.body;

    const habitCheck = await pool.query(
      'SELECT user_id FROM habits WHERE id = $1',
      [id]
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    if (habitCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (frequency !== undefined) {
      updates.push(`frequency = $${paramCount++}`);
      values.push(frequency);
    }
    if (linked_stat !== undefined) {
      updates.push(`linked_stat = $${paramCount++}`);
      values.push(linked_stat);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE habits SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({ message: 'Habit updated successfully', habit: result.rows[0] });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const habitCheck = await pool.query(
      'SELECT user_id FROM habits WHERE id = $1',
      [id]
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    if (habitCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.query(
      'UPDATE habits SET is_active = false WHERE id = $1',
      [id]
    );

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
};

export const logHabitCompletion = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { completion_value, completed_date } = req.body;

    await client.query('BEGIN');

    const habitResult = await client.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2 AND is_active = true',
      [id, req.user.userId]
    );

    if (habitResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = habitResult.rows[0];
    const logDate = completed_date || formatDate(new Date());

    const existingLog = await client.query(
      'SELECT id FROM habit_logs WHERE habit_id = $1 AND completed_date = $2',
      [id, logDate]
    );

    if (existingLog.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Habit already logged for this date' });
    }

    const logResult = await client.query(
      `INSERT INTO habit_logs (habit_id, completed_date, completion_value, xp_earned)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, logDate, completion_value || 1, habit.xp_reward]
    );

    const avatarResult = await client.query(
      'SELECT id FROM avatars WHERE user_id = $1',
      [req.user.userId]
    );

    if (avatarResult.rows.length > 0) {
      const avatarId = avatarResult.rows[0].id;

      const statsUpdate: any = {
        total_xp: habit.xp_reward
      };
      statsUpdate[habit.linked_stat] = 1;

      await client.query(
        `UPDATE avatar_stats 
         SET total_xp = total_xp + $1,
             ${habit.linked_stat} = ${habit.linked_stat} + 1,
             level = FLOOR(SQRT(total_xp / 100)) + 1
         WHERE avatar_id = $2`,
        [habit.xp_reward, avatarId]
      );

      const updatedStats = await client.query(
        'SELECT * FROM avatar_stats WHERE avatar_id = $1',
        [avatarId]
      );

      const newLevel = updatedStats.rows[0].level;
      const newStage = getEvolutionStage(newLevel);

      await client.query(
        'UPDATE avatars SET current_evolution_stage = $1 WHERE id = $2',
        [newStage, avatarId]
      );

      await client.query(
        `INSERT INTO activity_feed (user_id, activity_type, activity_data)
         VALUES ($1, $2, $3)`,
        [req.user.userId, 'habit_completed', JSON.stringify({
          habit_name: habit.name,
          xp_earned: habit.xp_reward
        })]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Habit completion logged successfully',
      log: logResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Log habit completion error:', error);
    res.status(500).json({ error: 'Failed to log habit completion' });
  } finally {
    client.release();
  }
};

export const getHabitStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const habitCheck = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = habitCheck.rows[0];

    const logsResult = await pool.query(
      `SELECT * FROM habit_logs
       WHERE habit_id = $1
       ORDER BY completed_date DESC
       LIMIT 90`,
      [id]
    );

    const totalCompletions = logsResult.rows.length;

    let currentStreak = 0;
    const today = new Date();
    const logs = logsResult.rows;

    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].completed_date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (formatDate(logDate) === formatDate(expectedDate)) {
        currentStreak++;
      } else {
        break;
      }
    }

    const longestStreak = Math.max(currentStreak, totalCompletions);

    const last30Days = await pool.query(
      `SELECT COUNT(*) as count
       FROM habit_logs
       WHERE habit_id = $1 AND completed_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [id]
    );

    res.json({
      habit,
      stats: {
        total_completions: totalCompletions,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        completions_last_30_days: parseInt(last30Days.rows[0]?.count || '0'),
        recent_logs: logsResult.rows.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Get habit stats error:', error);
    res.status(500).json({ error: 'Failed to get habit stats' });
  }
};
