import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createGuild = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Guild name is required' });
    }

    await client.query('BEGIN');

    const existingMember = await client.query(
      'SELECT id FROM guild_members WHERE user_id = $1',
      [req.user.userId]
    );

    if (existingMember.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You are already in a guild' });
    }

    const existingGuild = await client.query(
      'SELECT id FROM guilds WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existingGuild.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Guild name already taken' });
    }

    const guildResult = await client.query(
      'INSERT INTO guilds (name, description, leader_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.userId]
    );

    const guild = guildResult.rows[0];

    await client.query(
      'INSERT INTO guild_members (guild_id, user_id, role) VALUES ($1, $2, $3)',
      [guild.id, req.user.userId, 'leader']
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Guild created successfully',
      guild
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create guild error:', error);
    res.status(500).json({ error: 'Failed to create guild' });
  } finally {
    client.release();
  }
};

export const getGuild = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const guildResult = await pool.query(
      `SELECT g.*, u.username as leader_username
       FROM guilds g
       JOIN users u ON g.leader_id = u.id
       WHERE g.id = $1`,
      [id]
    );

    if (guildResult.rows.length === 0) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const guild = guildResult.rows[0];

    const members = await pool.query(
      `SELECT u.id, u.username, u.profile_picture_url,
              gm.role, gm.contribution_xp, gm.joined_at,
              ast.level, ast.total_xp
       FROM guild_members gm
       JOIN users u ON gm.user_id = u.id
       LEFT JOIN avatars a ON u.id = a.user_id
       LEFT JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE gm.guild_id = $1
       ORDER BY gm.role DESC, gm.contribution_xp DESC`,
      [id]
    );

    res.json({
      guild,
      members: members.rows
    });
  } catch (error) {
    console.error('Get guild error:', error);
    res.status(500).json({ error: 'Failed to get guild' });
  }
};

export const joinGuild = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await client.query('BEGIN');

    const guildCheck = await client.query(
      'SELECT * FROM guilds WHERE id = $1',
      [id]
    );

    if (guildCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Guild not found' });
    }

    const guild = guildCheck.rows[0];

    if (guild.member_count >= 50) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Guild is full' });
    }

    const existingMember = await client.query(
      'SELECT id FROM guild_members WHERE user_id = $1',
      [req.user.userId]
    );

    if (existingMember.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You are already in a guild' });
    }

    await client.query(
      'INSERT INTO guild_members (guild_id, user_id, role) VALUES ($1, $2, $3)',
      [id, req.user.userId, 'member']
    );

    await client.query(
      'UPDATE guilds SET member_count = member_count + 1 WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    res.status(201).json({ message: 'Joined guild successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Join guild error:', error);
    res.status(500).json({ error: 'Failed to join guild' });
  } finally {
    client.release();
  }
};

export const leaveGuild = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await client.query('BEGIN');

    const memberCheck = await client.query(
      'SELECT * FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (memberCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'You are not in this guild' });
    }

    const member = memberCheck.rows[0];

    if (member.role === 'leader') {
      const memberCount = await client.query(
        'SELECT COUNT(*) as count FROM guild_members WHERE guild_id = $1',
        [id]
      );

      if (parseInt(memberCount.rows[0].count) > 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Leader must transfer leadership or disband guild before leaving' 
        });
      }

      await client.query('DELETE FROM guilds WHERE id = $1', [id]);
    } else {
      await client.query(
        'DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      await client.query(
        'UPDATE guilds SET member_count = member_count - 1 WHERE id = $1',
        [id]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Left guild successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Leave guild error:', error);
    res.status(500).json({ error: 'Failed to leave guild' });
  } finally {
    client.release();
  }
};

export const manageMembers = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { action, target_user_id, new_role } = req.body;

    await client.query('BEGIN');

    const leaderCheck = await client.query(
      'SELECT role FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (leaderCheck.rows.length === 0 || !['leader', 'officer'].includes(leaderCheck.rows[0].role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only leaders and officers can manage members' });
    }

    if (action === 'kick') {
      await client.query(
        'DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2',
        [id, target_user_id]
      );

      await client.query(
        'UPDATE guilds SET member_count = member_count - 1 WHERE id = $1',
        [id]
      );
    } else if (action === 'promote' && leaderCheck.rows[0].role === 'leader') {
      await client.query(
        'UPDATE guild_members SET role = $1 WHERE guild_id = $2 AND user_id = $3',
        [new_role, id, target_user_id]
      );
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid action' });
    }

    await client.query('COMMIT');

    res.json({ message: 'Member management action completed' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Manage members error:', error);
    res.status(500).json({ error: 'Failed to manage members' });
  } finally {
    client.release();
  }
};

export const createChallenge = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, description, goal_type, goal_value, reward_gold, reward_xp, end_date } = req.body;

    await client.query('BEGIN');

    const leaderCheck = await client.query(
      'SELECT role FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (leaderCheck.rows.length === 0 || !['leader', 'officer'].includes(leaderCheck.rows[0].role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only leaders and officers can create challenges' });
    }

    const result = await client.query(
      `INSERT INTO guild_challenges (
        guild_id, title, description, goal_type, goal_value, 
        reward_gold, reward_xp, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, title, description, goal_type, goal_value, reward_gold, reward_xp, end_date]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Guild challenge created successfully',
      challenge: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create challenge error:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  } finally {
    client.release();
  }
};

export const getGuildChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM guild_challenges
       WHERE guild_id = $1
       ORDER BY is_completed ASC, end_date ASC`,
      [id]
    );

    res.json({ challenges: result.rows });
  } catch (error) {
    console.error('Get guild challenges error:', error);
    res.status(500).json({ error: 'Failed to get guild challenges' });
  }
};

export const searchGuilds = async (req: AuthRequest, res: Response) => {
  try {
    const { search, limit = 20 } = req.query;

    let query = `
      SELECT g.*, u.username as leader_username
      FROM guilds g
      JOIN users u ON g.leader_id = u.id
    `;

    const params: any[] = [];
    
    if (search) {
      query += ' WHERE LOWER(g.name) LIKE LOWER($1) OR LOWER(g.description) LIKE LOWER($1)';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY g.member_count DESC, g.total_xp DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({ guilds: result.rows });
  } catch (error) {
    console.error('Search guilds error:', error);
    res.status(500).json({ error: 'Failed to search guilds' });
  }
};
