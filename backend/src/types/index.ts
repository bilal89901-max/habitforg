export interface User {
  id: number;
  email: string;
  username: string;
  bio?: string;
  profile_picture_url?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Avatar {
  id: number;
  user_id: number;
  name: string;
  base_appearance: Record<string, any>;
  current_evolution_stage: EvolutionStage;
  created_at: Date;
  updated_at: Date;
}

export type EvolutionStage = 'Newborn' | 'Apprentice' | 'Warrior' | 'Champion' | 'Legend' | 'Mythic';

export interface AvatarStats {
  id: number;
  avatar_id: number;
  strength: number;
  intelligence: number;
  vitality: number;
  spirit: number;
  social: number;
  wealth: number;
  total_xp: number;
  level: number;
  gold: number;
  premium_currency: number;
  updated_at: Date;
}

export type StatType = 'strength' | 'intelligence' | 'vitality' | 'spirit' | 'social' | 'wealth';

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  linked_stat: StatType;
  xp_reward: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  completed_date: Date;
  completion_value: number;
  xp_earned: number;
  created_at: Date;
}

export interface Quest {
  id: number;
  quest_type: 'daily' | 'weekly' | 'epic';
  title: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  reward_xp: number;
  reward_gold: number;
  reward_items: any[];
  is_active: boolean;
  rotation_date?: Date;
  created_at: Date;
}

export interface UserQuest {
  id: number;
  user_id: number;
  quest_id: number;
  started_at: Date;
  completed_at?: Date;
  progress: number;
  is_completed: boolean;
}

export interface Friend {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: Date;
  updated_at: Date;
}

export interface Battle {
  id: number;
  attacker_avatar_id: number;
  defender_avatar_id: number;
  winner_avatar_id?: number;
  battle_date: Date;
  attacker_power: number;
  defender_power: number;
  damage_dealt?: number;
  rewards_gold: number;
  rewards_xp: number;
  battle_log: any[];
}

export interface Guild {
  id: number;
  name: string;
  description?: string;
  leader_id: number;
  member_count: number;
  level: number;
  total_xp: number;
  treasury_gold: number;
  created_at: Date;
  updated_at: Date;
}

export interface GuildMember {
  id: number;
  guild_id: number;
  user_id: number;
  role: 'leader' | 'officer' | 'member';
  contribution_xp: number;
  joined_at: Date;
}

export interface GuildChallenge {
  id: number;
  guild_id: number;
  title: string;
  description?: string;
  goal_type: string;
  goal_value: number;
  current_progress: number;
  reward_gold: number;
  reward_xp: number;
  start_date: Date;
  end_date?: Date;
  is_completed: boolean;
}

export interface ShopItem {
  id: number;
  item_name: string;
  item_type: 'skin' | 'effect' | 'armor' | 'weapon' | 'accessory';
  description?: string;
  price_gold: number;
  price_premium: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  stats_bonus: Record<string, number>;
  visual_data: Record<string, any>;
  availability_start?: Date;
  availability_end?: Date;
  is_available: boolean;
  created_at: Date;
}

export interface UserInventory {
  id: number;
  user_id: number;
  shop_item_id: number;
  quantity: number;
  is_equipped: boolean;
  purchased_at: Date;
}

export interface Achievement {
  id: number;
  title: string;
  description?: string;
  achievement_type: string;
  requirement_value: number;
  reward_xp: number;
  reward_gold: number;
  icon_url?: string;
  created_at: Date;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  unlocked_at: Date;
}

export interface ActivityFeed {
  id: number;
  user_id: number;
  activity_type: string;
  activity_data: Record<string, any>;
  is_public: boolean;
  created_at: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  notification_type: string;
  title: string;
  message?: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  is_admin: boolean;
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}
