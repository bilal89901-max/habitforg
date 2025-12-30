import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sanitizeUser } from '../utils/helpers';

export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const friendId = parseInt(id);

    if (req.user.userId === friendId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND is_active = true',
      [friendId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingFriendship = await pool.query(
      `SELECT * FROM friends 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [req.user.userId, friendId]
    );

    if (existingFriendship.rows.length > 0) {
      const status = existingFriendship.rows[0].status;
      if (status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      } else if (status === 'pending') {
        return res.status(400).json({ error: 'Friend request already sent' });
      } else if (status === 'blocked') {
        return res.status(400).json({ error: 'Cannot send friend request' });
      }
    }

    const result = await pool.query(
      'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, friendId, 'pending']
    );

    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        friendId,
        'friend_request',
        'New Friend Request',
        `${req.user.username} sent you a friend request`,
        JSON.stringify({ from_user_id: req.user.userId, from_username: req.user.username })
      ]
    );

    res.status(201).json({
      message: 'Friend request sent successfully',
      friendship: result.rows[0]
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const friendId = parseInt(id);

    await client.query('BEGIN');

    const friendshipResult = await client.query(
      'SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2 AND status = $3',
      [friendId, req.user.userId, 'pending']
    );

    if (friendshipResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await client.query(
      'UPDATE friends SET status = $1 WHERE id = $2',
      ['accepted', friendshipResult.rows[0].id]
    );

    await client.query(
      `INSERT INTO activity_feed (user_id, activity_type, activity_data)
       VALUES ($1, $2, $3)`,
      [req.user.userId, 'friend_added', JSON.stringify({ friend_id: friendId })]
    );

    await client.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        friendId,
        'friend_accepted',
        'Friend Request Accepted',
        `${req.user.username} accepted your friend request`,
        JSON.stringify({ user_id: req.user.userId, username: req.user.username })
      ]
    );

    await client.query('COMMIT');

    res.json({ message: 'Friend request accepted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  } finally {
    client.release();
  }
};

export const removeFriend = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const friendId = parseInt(id);

    const result = await pool.query(
      `DELETE FROM friends 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
       RETURNING *`,
      [req.user.userId, friendId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
};

export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT u.*, f.created_at as friends_since
       FROM friends f
       JOIN users u ON (
         CASE 
           WHEN f.user_id = $1 THEN u.id = f.friend_id
           ELSE u.id = f.user_id
         END
       )
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = $2 AND u.is_active = true
       ORDER BY f.created_at DESC`,
      [req.user.userId, 'accepted']
    );

    const friends = result.rows.map(friend => sanitizeUser(friend));

    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
};

export const getFriendRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT u.*, f.id as request_id, f.created_at as request_date
       FROM friends f
       JOIN users u ON u.id = f.user_id
       WHERE f.friend_id = $1 AND f.status = $2 AND u.is_active = true
       ORDER BY f.created_at DESC`,
      [req.user.userId, 'pending']
    );

    const requests = result.rows.map(req => ({
      ...sanitizeUser(req),
      request_id: req.request_id,
      request_date: req.request_date
    }));

    res.json({ requests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
};

export const compareFriend = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const friendId = parseInt(id);

    const friendshipCheck = await pool.query(
      `SELECT id FROM friends 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = $3`,
      [req.user.userId, friendId, 'accepted']
    );

    if (friendshipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not friends with this user' });
    }

    const myStats = await pool.query(
      `SELECT a.*, ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [req.user.userId]
    );

    const friendStats = await pool.query(
      `SELECT a.*, ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [friendId]
    );

    const myHabits = await pool.query(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND is_active = true',
      [req.user.userId]
    );

    const friendHabits = await pool.query(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND is_active = true',
      [friendId]
    );

    const myQuests = await pool.query(
      'SELECT COUNT(*) as count FROM user_quests WHERE user_id = $1 AND is_completed = true',
      [req.user.userId]
    );

    const friendQuests = await pool.query(
      'SELECT COUNT(*) as count FROM user_quests WHERE user_id = $1 AND is_completed = true',
      [friendId]
    );

    res.json({
      my_stats: myStats.rows[0] || null,
      friend_stats: friendStats.rows[0] || null,
      comparison: {
        habits: {
          mine: parseInt(myHabits.rows[0]?.count || '0'),
          theirs: parseInt(friendHabits.rows[0]?.count || '0')
        },
        quests_completed: {
          mine: parseInt(myQuests.rows[0]?.count || '0'),
          theirs: parseInt(friendQuests.rows[0]?.count || '0')
        }
      }
    });
  } catch (error) {
    console.error('Compare friend error:', error);
    res.status(500).json({ error: 'Failed to compare with friend' });
  }
};

export const getFriendActivity = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const friendsResult = await pool.query(
      `SELECT DISTINCT 
         CASE 
           WHEN f.user_id = $1 THEN f.friend_id
           ELSE f.user_id
         END as friend_id
       FROM friends f
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = $2`,
      [req.user.userId, 'accepted']
    );

    const friendIds = friendsResult.rows.map(row => row.friend_id);

    if (friendIds.length === 0) {
      return res.json({ activities: [] });
    }

    const activities = await pool.query(
      `SELECT af.*, u.username, u.profile_picture_url
       FROM activity_feed af
       JOIN users u ON af.user_id = u.id
       WHERE af.user_id = ANY($1) AND af.is_public = true
       ORDER BY af.created_at DESC
       LIMIT 50`,
      [friendIds]
    );

    res.json({ activities: activities.rows });
  } catch (error) {
    console.error('Get friend activity error:', error);
    res.status(500).json({ error: 'Failed to get friend activity' });
  }
};
