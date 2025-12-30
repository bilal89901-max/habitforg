import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getShopItems = async (req: AuthRequest, res: Response) => {
  try {
    const { type, rarity, available_only } = req.query;

    let query = 'SELECT * FROM shop_items WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (type) {
      query += ` AND item_type = $${paramCount++}`;
      params.push(type);
    }

    if (rarity) {
      query += ` AND rarity = $${paramCount++}`;
      params.push(rarity);
    }

    if (available_only === 'true') {
      query += ` AND is_available = true`;
      query += ` AND (availability_start IS NULL OR availability_start <= CURRENT_TIMESTAMP)`;
      query += ` AND (availability_end IS NULL OR availability_end >= CURRENT_TIMESTAMP)`;
    }

    query += ' ORDER BY rarity DESC, created_at DESC';

    const result = await pool.query(query, params);

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({ error: 'Failed to get shop items' });
  }
};

export const purchaseItem = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { item_id } = req.params;
    const { use_premium } = req.body;

    await client.query('BEGIN');

    const itemResult = await client.query(
      'SELECT * FROM shop_items WHERE id = $1 AND is_available = true',
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found or not available' });
    }

    const item = itemResult.rows[0];

    if (item.availability_start && new Date(item.availability_start) > new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Item not yet available' });
    }

    if (item.availability_end && new Date(item.availability_end) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Item no longer available' });
    }

    const avatarResult = await client.query(
      `SELECT a.id as avatar_id, ast.*
       FROM avatars a
       JOIN avatar_stats ast ON a.id = ast.avatar_id
       WHERE a.user_id = $1`,
      [req.user.userId]
    );

    if (avatarResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const avatar = avatarResult.rows[0];
    const price = use_premium ? item.price_premium : item.price_gold;
    const currency = use_premium ? 'premium_currency' : 'gold';

    if (avatar[currency] < price) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const existingItem = await client.query(
      'SELECT * FROM user_inventory WHERE user_id = $1 AND shop_item_id = $2',
      [req.user.userId, item_id]
    );

    if (existingItem.rows.length > 0) {
      await client.query(
        'UPDATE user_inventory SET quantity = quantity + 1 WHERE id = $1',
        [existingItem.rows[0].id]
      );
    } else {
      await client.query(
        'INSERT INTO user_inventory (user_id, shop_item_id, quantity) VALUES ($1, $2, $3)',
        [req.user.userId, item_id, 1]
      );
    }

    await client.query(
      `UPDATE avatar_stats SET ${currency} = ${currency} - $1 WHERE avatar_id = $2`,
      [price, avatar.avatar_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Item purchased successfully',
      item,
      cost: { currency, amount: price }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Purchase item error:', error);
    res.status(500).json({ error: 'Failed to purchase item' });
  } finally {
    client.release();
  }
};

export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT ui.*, si.*,
              ui.id as inventory_id,
              si.id as item_id
       FROM user_inventory ui
       JOIN shop_items si ON ui.shop_item_id = si.id
       WHERE ui.user_id = $1
       ORDER BY ui.is_equipped DESC, si.rarity DESC, ui.purchased_at DESC`,
      [req.user.userId]
    );

    res.json({ inventory: result.rows });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
};

export const equipItem = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { item_id } = req.params;

    await client.query('BEGIN');

    const inventoryCheck = await client.query(
      `SELECT ui.*, si.item_type
       FROM user_inventory ui
       JOIN shop_items si ON ui.shop_item_id = si.id
       WHERE ui.id = $1 AND ui.user_id = $2`,
      [item_id, req.user.userId]
    );

    if (inventoryCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not in inventory' });
    }

    const inventoryItem = inventoryCheck.rows[0];

    await client.query(
      `UPDATE user_inventory ui
       SET is_equipped = false
       FROM shop_items si
       WHERE ui.shop_item_id = si.id
       AND ui.user_id = $1
       AND si.item_type = $2`,
      [req.user.userId, inventoryItem.item_type]
    );

    await client.query(
      'UPDATE user_inventory SET is_equipped = true WHERE id = $1',
      [item_id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Item equipped successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Equip item error:', error);
    res.status(500).json({ error: 'Failed to equip item' });
  } finally {
    client.release();
  }
};

export const unequipItem = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { item_id } = req.params;

    const inventoryCheck = await pool.query(
      'SELECT * FROM user_inventory WHERE id = $1 AND user_id = $2',
      [item_id, req.user.userId]
    );

    if (inventoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not in inventory' });
    }

    await pool.query(
      'UPDATE user_inventory SET is_equipped = false WHERE id = $1',
      [item_id]
    );

    res.json({ message: 'Item unequipped successfully' });
  } catch (error) {
    console.error('Unequip item error:', error);
    res.status(500).json({ error: 'Failed to unequip item' });
  }
};
