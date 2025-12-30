import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getQuests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type } = req.query;

    let query = `
      SELECT uq.*, q.*,
             uq.id as user_quest_id,
             q.id as quest_id
      FROM user_quests uq
      JOIN quests q ON uq.quest_id = q.id
      WHERE uq.user_id = $1 AND uq.is_completed = false
    `;

    const params: any[] = [req.user.userId];

    if (type) {
      query += ' AND q.quest_type = $2';
      params.push(type);
    }

    query += ' ORDER BY uq.started_at DESC';

    const result = await pool.query(query, params);

    res.json({ quests: result.rows });
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Failed to get quests' });
  }
};

export const getDailyQuests = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await client.query('BEGIN');

    const existingQuests = await client.query(
      `SELECT uq.*, q.*
       FROM user_quests uq
       JOIN quests q ON uq.quest_id = q.id
       WHERE uq.user_id = $1 
       AND q.quest_type = 'daily'
       AND DATE(uq.started_at) = CURRENT_DATE
       AND uq.is_completed = false`,
      [req.user.userId]
    );

    if (existingQuests.rows.length > 0) {
      await client.query('COMMIT');
      return res.json({ quests: existingQuests.rows });
    }

    const availableQuests = await client.query(
      `SELECT * FROM quests
       WHERE quest_type = 'daily' AND is_active = true
       ORDER BY RANDOM()
       LIMIT 3`
    );

    const assignedQuests = [];

    for (const quest of availableQuests.rows) {
      const result = await client.query(
        `INSERT INTO user_quests (user_id, quest_id)
         VALUES ($1, $2) RETURNING *`,
        [req.user.userId, quest.id]
      );
      assignedQuests.push({ ...result.rows[0], ...quest });
    }

    await client.query('COMMIT');

    res.json({ quests: assignedQuests });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Get daily quests error:', error);
    res.status(500).json({ error: 'Failed to get daily quests' });
  } finally {
    client.release();
  }
};

export const getWeeklyQuests = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await client.query('BEGIN');

    const existingQuests = await client.query(
      `SELECT uq.*, q.*
       FROM user_quests uq
       JOIN quests q ON uq.quest_id = q.id
       WHERE uq.user_id = $1 
       AND q.quest_type = 'weekly'
       AND DATE_TRUNC('week', uq.started_at) = DATE_TRUNC('week', CURRENT_DATE)
       AND uq.is_completed = false`,
      [req.user.userId]
    );

    if (existingQuests.rows.length > 0) {
      await client.query('COMMIT');
      return res.json({ quests: existingQuests.rows });
    }

    const availableQuests = await client.query(
      `SELECT * FROM quests
       WHERE quest_type = 'weekly' AND is_active = true
       ORDER BY RANDOM()
       LIMIT 2`
    );

    const assignedQuests = [];

    for (const quest of availableQuests.rows) {
      const result = await client.query(
        `INSERT INTO user_quests (user_id, quest_id)
         VALUES ($1, $2) RETURNING *`,
        [req.user.userId, quest.id]
      );
      assignedQuests.push({ ...result.rows[0], ...quest });
    }

    await client.query('COMMIT');

    res.json({ quests: assignedQuests });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Get weekly quests error:', error);
    res.status(500).json({ error: 'Failed to get weekly quests' });
  } finally {
    client.release();
  }
};

export const getEpicQuests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT uq.*, q.*,
              uq.id as user_quest_id,
              q.id as quest_id
       FROM user_quests uq
       JOIN quests q ON uq.quest_id = q.id
       WHERE uq.user_id = $1 
       AND q.quest_type = 'epic'
       AND uq.is_completed = false
       ORDER BY uq.started_at DESC`,
      [req.user.userId]
    );

    const availableEpic = await pool.query(
      `SELECT * FROM quests
       WHERE quest_type = 'epic' 
       AND is_active = true
       AND id NOT IN (
         SELECT quest_id FROM user_quests 
         WHERE user_id = $1 AND (is_completed = false OR completed_at > CURRENT_DATE - INTERVAL '30 days')
       )
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.user.userId]
    );

    res.json({
      active_quests: result.rows,
      available_quests: availableEpic.rows
    });
  } catch (error) {
    console.error('Get epic quests error:', error);
    res.status(500).json({ error: 'Failed to get epic quests' });
  }
};

export const completeQuest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await client.query('BEGIN');

    const userQuestResult = await client.query(
      `SELECT uq.*, q.*
       FROM user_quests uq
       JOIN quests q ON uq.quest_id = q.id
       WHERE uq.id = $1 AND uq.user_id = $2`,
      [id, req.user.userId]
    );

    if (userQuestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quest not found' });
    }

    const userQuest = userQuestResult.rows[0];

    if (userQuest.is_completed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Quest already completed' });
    }

    await client.query(
      `UPDATE user_quests
       SET is_completed = true, completed_at = CURRENT_TIMESTAMP, progress = $1
       WHERE id = $2`,
      [userQuest.requirement_value, id]
    );

    const avatarResult = await client.query(
      'SELECT id FROM avatars WHERE user_id = $1',
      [req.user.userId]
    );

    if (avatarResult.rows.length > 0) {
      const avatarId = avatarResult.rows[0].id;

      await client.query(
        `UPDATE avatar_stats
         SET total_xp = total_xp + $1,
             gold = gold + $2,
             level = FLOOR(SQRT((total_xp + $1) / 100)) + 1
         WHERE avatar_id = $3`,
        [userQuest.reward_xp, userQuest.reward_gold, avatarId]
      );

      await client.query(
        `INSERT INTO activity_feed (user_id, activity_type, activity_data)
         VALUES ($1, $2, $3)`,
        [req.user.userId, 'quest_completed', JSON.stringify({
          quest_title: userQuest.title,
          quest_type: userQuest.quest_type,
          reward_xp: userQuest.reward_xp,
          reward_gold: userQuest.reward_gold
        })]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Quest completed successfully',
      rewards: {
        xp: userQuest.reward_xp,
        gold: userQuest.reward_gold,
        items: userQuest.reward_items
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete quest error:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  } finally {
    client.release();
  }
};

export const startEpicQuest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const questCheck = await pool.query(
      'SELECT * FROM quests WHERE id = $1 AND quest_type = $2 AND is_active = true',
      [id, 'epic']
    );

    if (questCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Epic quest not found' });
    }

    const existingQuest = await pool.query(
      'SELECT id FROM user_quests WHERE user_id = $1 AND quest_id = $2 AND is_completed = false',
      [req.user.userId, id]
    );

    if (existingQuest.rows.length > 0) {
      return res.status(400).json({ error: 'Already started this quest' });
    }

    const result = await pool.query(
      'INSERT INTO user_quests (user_id, quest_id) VALUES ($1, $2) RETURNING *',
      [req.user.userId, id]
    );

    res.status(201).json({
      message: 'Epic quest started successfully',
      user_quest: result.rows[0]
    });
  } catch (error) {
    console.error('Start epic quest error:', error);
    res.status(500).json({ error: 'Failed to start epic quest' });
  }
};
