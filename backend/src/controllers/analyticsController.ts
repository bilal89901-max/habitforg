import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getHabitAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { period = '30' } = req.query;
    const days = parseInt(period as string);

    const completionsByDay = await pool.query(
      `SELECT DATE(hl.completed_date) as date, COUNT(*) as completions
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE h.user_id = $1 AND hl.completed_date >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(hl.completed_date)
       ORDER BY date`,
      [req.user.userId]
    );

    const completionsByHabit = await pool.query(
      `SELECT h.name, h.linked_stat, COUNT(hl.id) as completions, SUM(hl.xp_earned) as total_xp
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.completed_date >= CURRENT_DATE - INTERVAL '${days} days'
       WHERE h.user_id = $1 AND h.is_active = true
       GROUP BY h.id, h.name, h.linked_stat
       ORDER BY completions DESC`,
      [req.user.userId]
    );

    const completionsByStat = await pool.query(
      `SELECT h.linked_stat, COUNT(hl.id) as completions
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE h.user_id = $1 AND hl.completed_date >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY h.linked_stat
       ORDER BY completions DESC`,
      [req.user.userId]
    );

    const streaks = await pool.query(
      `SELECT h.name, COUNT(*) as current_streak
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id
       WHERE h.user_id = $1 AND h.is_active = true
       GROUP BY h.id, h.name
       ORDER BY current_streak DESC
       LIMIT 5`,
      [req.user.userId]
    );

    res.json({
      completions_by_day: completionsByDay.rows,
      completions_by_habit: completionsByHabit.rows,
      completions_by_stat: completionsByStat.rows,
      top_streaks: streaks.rows,
      period_days: days
    });
  } catch (error) {
    console.error('Get habit analytics error:', error);
    res.status(500).json({ error: 'Failed to get habit analytics' });
  }
};

export const getAvatarAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const avatarResult = await pool.query(
      `SELECT a.*, ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [req.user.userId]
    );

    if (avatarResult.rows.length === 0) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const avatar = avatarResult.rows[0];

    const xpHistory = await pool.query(
      `SELECT DATE(af.created_at) as date, 
              SUM(CAST(af.activity_data->>'xp_earned' AS INTEGER)) as xp_gained
       FROM activity_feed af
       WHERE af.user_id = $1 
       AND af.activity_type IN ('habit_completed', 'quest_completed')
       AND af.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(af.created_at)
       ORDER BY date`,
      [req.user.userId]
    );

    const statBreakdown = {
      strength: avatar.strength || 1,
      intelligence: avatar.intelligence || 1,
      vitality: avatar.vitality || 1,
      spirit: avatar.spirit || 1,
      social: avatar.social || 1,
      wealth: avatar.wealth || 0
    };

    const totalStats = Object.values(statBreakdown).reduce((sum: number, val) => sum + (val as number), 0);

    const statPercentages = Object.entries(statBreakdown).map(([stat, value]) => ({
      stat,
      value,
      percentage: ((value as number) / totalStats * 100).toFixed(2)
    }));

    const currentXP = avatar.total_xp || 0;
    const currentLevel = avatar.level || 1;
    const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
    const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
    const xpProgress = currentXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    let nextEvolutionStage = avatar.current_evolution_stage;
    let nextEvolutionLevel = currentLevel;

    if (currentLevel < 10) {
      nextEvolutionStage = 'Apprentice';
      nextEvolutionLevel = 10;
    } else if (currentLevel < 25) {
      nextEvolutionStage = 'Warrior';
      nextEvolutionLevel = 25;
    } else if (currentLevel < 50) {
      nextEvolutionStage = 'Champion';
      nextEvolutionLevel = 50;
    } else if (currentLevel < 75) {
      nextEvolutionStage = 'Legend';
      nextEvolutionLevel = 75;
    } else if (currentLevel < 100) {
      nextEvolutionStage = 'Mythic';
      nextEvolutionLevel = 100;
    }

    res.json({
      current_stats: statBreakdown,
      stat_percentages: statPercentages,
      level_info: {
        current_level: currentLevel,
        current_xp: currentXP,
        xp_progress: xpProgress,
        xp_needed: xpNeeded,
        progress_percentage: ((xpProgress / xpNeeded) * 100).toFixed(2)
      },
      evolution: {
        current_stage: avatar.current_evolution_stage,
        next_stage: nextEvolutionStage,
        next_stage_level: nextEvolutionLevel
      },
      xp_history: xpHistory.rows
    });
  } catch (error) {
    console.error('Get avatar analytics error:', error);
    res.status(500).json({ error: 'Failed to get avatar analytics' });
  }
};

export const getLeaderboards = async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'level', limit = 50 } = req.query;

    let query = '';

    if (type === 'level') {
      query = `
        SELECT u.id, u.username, u.profile_picture_url,
               a.name as avatar_name, a.current_evolution_stage,
               ast.level, ast.total_xp
        FROM users u
        JOIN avatars a ON u.id = a.user_id
        JOIN avatar_stats ast ON a.id = ast.avatar_id
        WHERE u.is_active = true
        ORDER BY ast.level DESC, ast.total_xp DESC
        LIMIT $1
      `;
    } else if (type === 'battles') {
      query = `
        SELECT u.id, u.username, u.profile_picture_url,
               a.name as avatar_name,
               COUNT(b.id) as total_battles,
               SUM(CASE WHEN b.winner_avatar_id = a.id THEN 1 ELSE 0 END) as wins
        FROM users u
        JOIN avatars a ON u.id = a.user_id
        LEFT JOIN battles b ON (b.attacker_avatar_id = a.id OR b.defender_avatar_id = a.id)
        WHERE u.is_active = true
        GROUP BY u.id, u.username, u.profile_picture_url, a.name
        HAVING COUNT(b.id) > 0
        ORDER BY wins DESC, total_battles DESC
        LIMIT $1
      `;
    } else if (type === 'habits') {
      query = `
        SELECT u.id, u.username, u.profile_picture_url,
               COUNT(DISTINCT h.id) as total_habits,
               COUNT(hl.id) as total_completions
        FROM users u
        LEFT JOIN habits h ON u.id = h.user_id AND h.is_active = true
        LEFT JOIN habit_logs hl ON h.id = hl.habit_id
        WHERE u.is_active = true
        GROUP BY u.id, u.username, u.profile_picture_url
        HAVING COUNT(hl.id) > 0
        ORDER BY total_completions DESC
        LIMIT $1
      `;
    } else if (type === 'guilds') {
      query = `
        SELECT g.*, u.username as leader_username
        FROM guilds g
        JOIN users u ON g.leader_id = u.id
        ORDER BY g.level DESC, g.total_xp DESC, g.member_count DESC
        LIMIT $1
      `;
    } else {
      return res.status(400).json({ error: 'Invalid leaderboard type' });
    }

    const result = await pool.query(query, [limit]);

    res.json({
      type,
      leaderboard: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get leaderboards error:', error);
    res.status(500).json({ error: 'Failed to get leaderboards' });
  }
};

export const getPrediction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const avatarResult = await pool.query(
      `SELECT a.*, ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [req.user.userId]
    );

    if (avatarResult.rows.length === 0) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const avatar = avatarResult.rows[0];

    const last30DaysXP = await pool.query(
      `SELECT SUM(CAST(af.activity_data->>'xp_earned' AS INTEGER)) as total_xp
       FROM activity_feed af
       WHERE af.user_id = $1 
       AND af.activity_type IN ('habit_completed', 'quest_completed')
       AND af.created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.user.userId]
    );

    const averageDailyXP = parseInt(last30DaysXP.rows[0]?.total_xp || '0') / 30;

    const currentXP = avatar.total_xp || 0;
    const currentLevel = avatar.level || 1;

    const predictions = [];

    for (const days of [7, 30, 90]) {
      const predictedXP = currentXP + (averageDailyXP * days);
      const predictedLevel = Math.floor(Math.sqrt(predictedXP / 100)) + 1;

      let predictedStage = 'Newborn';
      if (predictedLevel >= 100) predictedStage = 'Mythic';
      else if (predictedLevel >= 75) predictedStage = 'Legend';
      else if (predictedLevel >= 50) predictedStage = 'Champion';
      else if (predictedLevel >= 25) predictedStage = 'Warrior';
      else if (predictedLevel >= 10) predictedStage = 'Apprentice';

      predictions.push({
        days,
        predicted_xp: Math.floor(predictedXP),
        predicted_level: predictedLevel,
        predicted_stage: predictedStage,
        xp_gain: Math.floor(predictedXP - currentXP),
        level_gain: predictedLevel - currentLevel
      });
    }

    res.json({
      current: {
        xp: currentXP,
        level: currentLevel,
        stage: avatar.current_evolution_stage
      },
      average_daily_xp: Math.floor(averageDailyXP),
      predictions
    });
  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json({ error: 'Failed to get prediction' });
  }
};

export const getUserComparison = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const myAvatar = await pool.query(
      `SELECT ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [req.user.userId]
    );

    if (myAvatar.rows.length === 0) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const myStats = myAvatar.rows[0];
    const myLevel = myStats.level || 1;

    const similarUsers = await pool.query(
      `SELECT AVG(ast.level) as avg_level,
              AVG(ast.total_xp) as avg_xp,
              AVG(ast.strength) as avg_strength,
              AVG(ast.intelligence) as avg_intelligence,
              AVG(ast.vitality) as avg_vitality,
              AVG(ast.spirit) as avg_spirit,
              AVG(ast.social) as avg_social
       FROM avatar_stats ast
       JOIN avatars a ON ast.avatar_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE u.is_active = true
       AND ast.level BETWEEN $1 AND $2`,
      [myLevel - 5, myLevel + 5]
    );

    const avgStats = similarUsers.rows[0];

    const comparison = {
      level: {
        mine: myStats.level,
        average: parseFloat(avgStats.avg_level || '0').toFixed(2),
        difference: (myStats.level - parseFloat(avgStats.avg_level || '0')).toFixed(2)
      },
      total_xp: {
        mine: myStats.total_xp,
        average: parseFloat(avgStats.avg_xp || '0').toFixed(0),
        difference: (myStats.total_xp - parseFloat(avgStats.avg_xp || '0')).toFixed(0)
      },
      strength: {
        mine: myStats.strength,
        average: parseFloat(avgStats.avg_strength || '0').toFixed(2)
      },
      intelligence: {
        mine: myStats.intelligence,
        average: parseFloat(avgStats.avg_intelligence || '0').toFixed(2)
      },
      vitality: {
        mine: myStats.vitality,
        average: parseFloat(avgStats.avg_vitality || '0').toFixed(2)
      },
      spirit: {
        mine: myStats.spirit,
        average: parseFloat(avgStats.avg_spirit || '0').toFixed(2)
      },
      social: {
        mine: myStats.social,
        average: parseFloat(avgStats.avg_social || '0').toFixed(2)
      }
    };

    res.json({ comparison });
  } catch (error) {
    console.error('Get user comparison error:', error);
    res.status(500).json({ error: 'Failed to get user comparison' });
  }
};
