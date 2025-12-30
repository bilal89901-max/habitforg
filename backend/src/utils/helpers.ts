import { AvatarStats, EvolutionStage } from '../types';

export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const calculateXPForNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 100;
};

export const getEvolutionStage = (level: number): EvolutionStage => {
  if (level >= 100) return 'Mythic';
  if (level >= 75) return 'Legend';
  if (level >= 50) return 'Champion';
  if (level >= 25) return 'Warrior';
  if (level >= 10) return 'Apprentice';
  return 'Newborn';
};

export const calculateAvatarPower = (stats: AvatarStats): number => {
  const { strength, intelligence, vitality, spirit, social, wealth } = stats;
  const basePower = strength * 2 + intelligence * 1.5 + vitality * 2.5 + spirit * 1.5 + social * 1 + (wealth / 100);
  const levelBonus = stats.level * 10;
  return Math.floor(basePower + levelBonus);
};

export const calculateBattleOutcome = (attackerPower: number, defenderPower: number): {
  winner: 'attacker' | 'defender';
  damage: number;
  goldReward: number;
  xpReward: number;
} => {
  const totalPower = attackerPower + defenderPower;
  const attackerChance = attackerPower / totalPower;
  const randomValue = Math.random();
  
  const winner = randomValue < attackerChance ? 'attacker' : 'defender';
  const powerDiff = Math.abs(attackerPower - defenderPower);
  const damage = Math.floor(50 + powerDiff * 0.5 + Math.random() * 20);
  
  const goldReward = Math.floor(10 + powerDiff * 0.1 + Math.random() * 20);
  const xpReward = Math.floor(25 + powerDiff * 0.2 + Math.random() * 10);
  
  return { winner, damage, goldReward, xpReward };
};

export const generateStreakBonus = (streakDays: number): number => {
  if (streakDays >= 30) return 3;
  if (streakDays >= 14) return 2.5;
  if (streakDays >= 7) return 2;
  if (streakDays >= 3) return 1.5;
  return 1;
};

export const getStatColor = (statName: string): string => {
  const colors: Record<string, string> = {
    strength: '#ef4444',
    intelligence: '#3b82f6',
    vitality: '#22c55e',
    spirit: '#a855f7',
    social: '#f59e0b',
    wealth: '#eab308'
  };
  return colors[statName] || '#6b7280';
};

export const getRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    common: '#9ca3af',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    mythic: '#ef4444'
  };
  return colors[rarity] || '#6b7280';
};

export const sanitizeUser = (user: any) => {
  const { password_hash, ...sanitized } = user;
  return sanitized;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return formatDate(date) === formatDate(today);
};

export const getStartOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getEndOfWeek = (date: Date = new Date()): Date => {
  const start = getStartOfWeek(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
};
