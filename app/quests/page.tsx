'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

interface Quest {
  id: number;
  title: string;
  description: string;
  quest_type: string;
  reward_xp: number;
  reward_gold: number;
  completed_at?: string;
  started_at?: string;
  progress?: number;
  target?: number;
}

export default function QuestsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'epic'>('daily');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchQuests();
  }, [isAuthenticated, router, activeTab]);

  const fetchQuests = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/quests/${activeTab}`);
      setQuests(response.data.quests || []);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      setQuests([]);
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId: number) => {
    try {
      await apiClient.post(`/quests/${questId}/complete`);
      fetchQuests();
    } catch (error) {
      console.error('Failed to complete quest:', error);
    }
  };

  const getQuestIcon = (type: string) => {
    const icons: Record<string, string> = {
      daily: '📅',
      weekly: '📆',
      epic: '⭐',
    };
    return icons[type] || '🎯';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => router.push('/dashboard')} className="text-2xl font-bold text-white hover:text-purple-300 transition">
              ⚔️ HabitForge
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Quests</h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'daily'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            📅 Daily Quests
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'weekly'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            📆 Weekly Quests
          </button>
          <button
            onClick={() => setActiveTab('epic')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'epic'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            ⭐ Epic Quests
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">Loading quests...</div>
        ) : quests.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
            <div className="text-6xl mb-4">{getQuestIcon(activeTab)}</div>
            <h2 className="text-2xl font-bold text-white mb-2">No {activeTab} quests available</h2>
            <p className="text-gray-300">Check back later for new quests!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border ${
                  quest.completed_at
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getQuestIcon(quest.quest_type)}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{quest.title}</h3>
                      <span className="text-sm text-gray-400 capitalize">{quest.quest_type} Quest</span>
                    </div>
                  </div>
                  {quest.completed_at && (
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      ✓ Completed
                    </span>
                  )}
                </div>

                <p className="text-gray-300 mb-4">{quest.description}</p>

                {quest.progress !== undefined && quest.target !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{quest.progress} / {quest.target}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4">
                    <span className="text-blue-400 font-semibold">+{quest.reward_xp} XP</span>
                    <span className="text-yellow-400 font-semibold">+{quest.reward_gold} Gold</span>
                  </div>
                </div>

                {!quest.completed_at && (
                  <button
                    onClick={() => completeQuest(quest.id)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
                  >
                    Complete Quest
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
