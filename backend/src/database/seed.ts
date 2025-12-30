import pool from '../config/database';

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    await client.query('BEGIN');

    console.log('📝 Seeding quests...');
    await client.query(`
      INSERT INTO quests (quest_type, title, description, requirement_type, requirement_value, reward_xp, reward_gold) VALUES
      ('daily', 'Morning Warrior', 'Complete 3 habits before noon', 'habit_count', 3, 50, 25),
      ('daily', 'Consistency King', 'Log any 5 habits today', 'habit_count', 5, 75, 30),
      ('daily', 'Early Bird', 'Complete a habit before 8 AM', 'habit_count', 1, 40, 20),
      ('daily', 'Perfect Day', 'Complete all your active habits', 'habit_count', 10, 100, 50),
      ('daily', 'Strength Builder', 'Complete 2 strength-related habits', 'stat_specific', 2, 60, 25),
      ('weekly', 'Week Warrior', 'Complete 20 habits this week', 'habit_count', 20, 200, 100),
      ('weekly', 'Streak Master', 'Maintain a 7-day streak on any habit', 'streak', 7, 250, 125),
      ('weekly', 'Social Butterfly', 'Complete 5 social-related habits', 'stat_specific', 5, 180, 90),
      ('weekly', 'Intelligence Boost', 'Complete 10 intelligence habits', 'stat_specific', 10, 220, 110),
      ('epic', 'The Transformation', 'Complete 100 habits in 30 days', 'habit_count', 100, 1000, 500),
      ('epic', 'Iron Will', 'Maintain a 30-day streak', 'streak', 30, 1500, 750),
      ('epic', 'Legendary Journey', 'Reach level 25', 'level', 25, 2000, 1000)
      ON CONFLICT DO NOTHING
    `);

    console.log('🏪 Seeding shop items...');
    await client.query(`
      INSERT INTO shop_items (item_name, item_type, description, price_gold, price_premium, rarity, stats_bonus) VALUES
      ('Basic Sword', 'weapon', 'A simple but effective weapon', 100, 0, 'common', '{"strength": 2}'::jsonb),
      ('Leather Armor', 'armor', 'Light protective gear', 150, 0, 'common', '{"vitality": 2}'::jsonb),
      ('Scholar Robe', 'armor', 'Robes for the learned', 200, 0, 'rare', '{"intelligence": 3}'::jsonb),
      ('Steel Sword', 'weapon', 'A well-crafted blade', 500, 0, 'rare', '{"strength": 5}'::jsonb),
      ('Mystic Amulet', 'accessory', 'Enhances spiritual power', 300, 0, 'rare', '{"spirit": 3}'::jsonb),
      ('Dragon Scale Armor', 'armor', 'Legendary protection', 0, 50, 'legendary', '{"vitality": 10, "strength": 5}'::jsonb),
      ('Phoenix Wings', 'effect', 'Magnificent glowing wings', 0, 100, 'mythic', '{"spirit": 15}'::jsonb),
      ('Golden Crown', 'accessory', 'Symbol of wealth and power', 1000, 0, 'epic', '{"social": 7, "wealth": 5}'::jsonb),
      ('Shadow Cloak', 'effect', 'Dark mysterious aura', 0, 75, 'legendary', '{"spirit": 8}'::jsonb),
      ('Warrior Skin', 'skin', 'Battle-hardened appearance', 500, 0, 'epic', '{}'::jsonb)
      ON CONFLICT DO NOTHING
    `);

    console.log('🏆 Seeding achievements...');
    await client.query(`
      INSERT INTO achievements (title, description, achievement_type, requirement_value, reward_xp, reward_gold) VALUES
      ('First Step', 'Complete your first habit', 'habit_completion', 1, 25, 10),
      ('Getting Started', 'Complete 10 habits', 'habit_completion', 10, 50, 25),
      ('Dedicated', 'Complete 100 habits', 'habit_completion', 100, 200, 100),
      ('Warrior', 'Reach level 10', 'level', 10, 100, 50),
      ('Champion', 'Reach level 25', 'level', 25, 500, 250),
      ('Social Starter', 'Add your first friend', 'friends', 1, 50, 25),
      ('Popular', 'Have 10 friends', 'friends', 10, 150, 75),
      ('Battle Ready', 'Win your first battle', 'battle_win', 1, 75, 35),
      ('Guild Member', 'Join a guild', 'guild_join', 1, 100, 50),
      ('Quest Master', 'Complete 50 quests', 'quest_completion', 50, 300, 150)
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
