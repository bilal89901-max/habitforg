import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { calculateAvatarPower, calculateBattleOutcome } from '../utils/helpers';

export const initiateBattle = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { defender_id } = req.body;

    if (!defender_id) {
      return res.status(400).json({ error: 'Defender ID is required' });
    }

    await client.query('BEGIN');

    const attackerAvatar = await client.query(
      `SELECT a.*, ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [req.user.userId]
    );

    if (attackerAvatar.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Attacker avatar not found' });
    }

    const defenderAvatar = await client.query(
      `SELECT a.*, ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [defender_id]
    );

    if (defenderAvatar.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Defender avatar not found' });
    }

    const attacker = attackerAvatar.rows[0];
    const defender = defenderAvatar.rows[0];

    const attackerPower = calculateAvatarPower(attacker);
    const defenderPower = calculateAvatarPower(defender);

    const battleResult = calculateBattleOutcome(attackerPower, defenderPower);

    const winnerId = battleResult.winner === 'attacker' ? attacker.avatar_id : defender.avatar_id;
    const loserId = battleResult.winner === 'attacker' ? defender.avatar_id : attacker.avatar_id;

    const battleLog = [
      {
        round: 1,
        attacker_power: attackerPower,
        defender_power: defenderPower,
        winner: battleResult.winner,
        damage: battleResult.damage
      }
    ];

    const battleRecord = await client.query(
      `INSERT INTO battles (
        attacker_avatar_id, defender_avatar_id, winner_avatar_id,
        attacker_power, defender_power, damage_dealt,
        rewards_gold, rewards_xp, battle_log
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        attacker.avatar_id,
        defender.avatar_id,
        winnerId,
        attackerPower,
        defenderPower,
        battleResult.damage,
        battleResult.goldReward,
        battleResult.xpReward,
        JSON.stringify(battleLog)
      ]
    );

    if (battleResult.winner === 'attacker') {
      await client.query(
        `UPDATE avatar_stats
         SET gold = gold + $1, total_xp = total_xp + $2,
             level = FLOOR(SQRT((total_xp + $2) / 100)) + 1
         WHERE avatar_id = $3`,
        [battleResult.goldReward, battleResult.xpReward, attacker.avatar_id]
      );

      await client.query(
        `INSERT INTO activity_feed (user_id, activity_type, activity_data)
         VALUES ($1, $2, $3)`,
        [req.user.userId, 'battle_won', JSON.stringify({
          defender_id: defender_id,
          gold_earned: battleResult.goldReward,
          xp_earned: battleResult.xpReward
        })]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Battle completed',
      battle: battleRecord.rows[0],
      result: {
        winner: battleResult.winner,
        attacker_power: attackerPower,
        defender_power: defenderPower,
        damage: battleResult.damage,
        rewards: {
          gold: battleResult.goldReward,
          xp: battleResult.xpReward
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Initiate battle error:', error);
    res.status(500).json({ error: 'Failed to initiate battle' });
  } finally {
    client.release();
  }
};

export const getBattle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT b.*,
              aa.name as attacker_name, aa.current_evolution_stage as attacker_stage,
              da.name as defender_name, da.current_evolution_stage as defender_stage,
              au.username as attacker_username,
              du.username as defender_username
       FROM battles b
       JOIN avatars aa ON b.attacker_avatar_id = aa.id
       JOIN avatars da ON b.defender_avatar_id = da.id
       JOIN users au ON aa.user_id = au.id
       JOIN users du ON da.user_id = du.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.json({ battle: result.rows[0] });
  } catch (error) {
    console.error('Get battle error:', error);
    res.status(500).json({ error: 'Failed to get battle' });
  }
};

export const getBattleHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const avatarResult = await pool.query(
      'SELECT id FROM avatars WHERE user_id = $1',
      [req.user.userId]
    );

    if (avatarResult.rows.length === 0) {
      return res.json({ battles: [], stats: { total: 0, wins: 0, losses: 0 } });
    }

    const avatarId = avatarResult.rows[0].id;

    const battles = await pool.query(
      `SELECT b.*,
              aa.name as attacker_name, aa.current_evolution_stage as attacker_stage,
              da.name as defender_name, da.current_evolution_stage as defender_stage,
              au.username as attacker_username,
              du.username as defender_username,
              CASE 
                WHEN b.winner_avatar_id = $1 THEN 'win'
                ELSE 'loss'
              END as result
       FROM battles b
       JOIN avatars aa ON b.attacker_avatar_id = aa.id
       JOIN avatars da ON b.defender_avatar_id = da.id
       JOIN users au ON aa.user_id = au.id
       JOIN users du ON da.user_id = du.id
       WHERE b.attacker_avatar_id = $1 OR b.defender_avatar_id = $1
       ORDER BY b.battle_date DESC
       LIMIT 50`,
      [avatarId]
    );

    const stats = await pool.query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN winner_avatar_id = $1 THEN 1 ELSE 0 END) as wins,
         SUM(CASE WHEN winner_avatar_id != $1 THEN 1 ELSE 0 END) as losses
       FROM battles
       WHERE attacker_avatar_id = $1 OR defender_avatar_id = $1`,
      [avatarId]
    );

    res.json({
      battles: battles.rows,
      stats: {
        total: parseInt(stats.rows[0]?.total || '0'),
        wins: parseInt(stats.rows[0]?.wins || '0'),
        losses: parseInt(stats.rows[0]?.losses || '0'),
        win_rate: stats.rows[0]?.total > 0 
          ? ((parseInt(stats.rows[0]?.wins || '0') / parseInt(stats.rows[0]?.total || '1')) * 100).toFixed(2)
          : '0.00'
      }
    });
  } catch (error) {
    console.error('Get battle history error:', error);
    res.status(500).json({ error: 'Failed to get battle history' });
  }
};

export const getRandomOpponent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const myAvatar = await pool.query(
      `SELECT a.*, ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [req.user.userId]
    );

    if (myAvatar.rows.length === 0) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const myLevel = myAvatar.rows[0].level || 1;
    const levelRange = Math.max(5, Math.floor(myLevel * 0.2));

    const opponents = await pool.query(
      `SELECT u.id, u.username, u.profile_picture_url,
              a.name as avatar_name, a.current_evolution_stage,
              ast.level, ast.total_xp
       FROM users u
       JOIN avatars a ON u.id = a.user_id
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE u.id != $1 
       AND u.is_active = true
       AND ast.level BETWEEN $2 AND $3
       ORDER BY RANDOM()
       LIMIT 10`,
      [req.user.userId, myLevel - levelRange, myLevel + levelRange]
    );

    res.json({ opponents: opponents.rows });
  } catch (error) {
    console.error('Get random opponent error:', error);
    res.status(500).json({ error: 'Failed to get random opponents' });
  }
};
