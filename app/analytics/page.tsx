'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [habitStats, setHabitStats] = useState({
    total_habits: 0,
    active_habits: 0,
    total_completions: 0,
    completion_rate: 0,
    current_streak: 0,
    longest_streak: 0,
  });
  const [avatarStats, setAvatarStats] = useState({
    current_level: 1,
    total_xp: 0,
    evolution_stage: 'Newborn',
    days_active: 0,
    xp_gained_this_week: 0,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchAnalytics();
  }, [isAuthenticated, router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [habitsResponse, avatarResponse] = await Promise.all([
        apiClient.get('/analytics/habits'),
        apiClient.get('/analytics/avatar'),
      ]);
      
      setHabitStats(habitsResponse.data.stats || habitStats);
      setAvatarStats(avatarResponse.data.stats || avatarStats);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

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
        <h1 className="text-4xl font-bold text-white mb-8">📊 Analytics Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Habit Statistics</h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Habits</span>
                  <span className="text-3xl font-bold text-blue-400">{habitStats.total_habits}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Active Habits</span>
                  <span className="text-3xl font-bold text-green-400">{habitStats.active_habits}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Completions</span>
                  <span className="text-3xl font-bold text-purple-400">{habitStats.total_completions}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Completion Rate</span>
                  <span className="text-3xl font-bold text-yellow-400">{habitStats.completion_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Avatar Progress</h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Current Level</span>
                  <span className="text-3xl font-bold text-blue-400">{avatarStats.current_level}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total XP</span>
                  <span className="text-3xl font-bold text-purple-400">{avatarStats.total_xp}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Evolution Stage</span>
                  <span className="text-2xl font-bold text-amber-400">{avatarStats.evolution_stage}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Days Active</span>
                  <span className="text-3xl font-bold text-green-400">{avatarStats.days_active}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">XP This Week</span>
                  <span className="text-3xl font-bold text-cyan-400">{avatarStats.xp_gained_this_week}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🔥 Streak Records</h2>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-6 border border-orange-400/30">
                <div className="text-center">
                  <div className="text-5xl mb-2">🔥</div>
                  <p className="text-gray-300 text-sm mb-1">Current Streak</p>
                  <p className="text-5xl font-bold text-orange-400">{habitStats.current_streak}</p>
                  <p className="text-gray-400 text-sm mt-1">days</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg p-6 border border-yellow-400/30">
                <div className="text-center">
                  <div className="text-5xl mb-2">🏆</div>
                  <p className="text-gray-300 text-sm mb-1">Longest Streak</p>
                  <p className="text-5xl font-bold text-yellow-400">{habitStats.longest_streak}</p>
                  <p className="text-gray-400 text-sm mt-1">days</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🎯 Goals & Achievements</h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
                <div className="text-4xl">🎖️</div>
                <div>
                  <h3 className="text-white font-semibold">Habit Master</h3>
                  <p className="text-gray-400 text-sm">Complete 100 habits</p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min((habitStats.total_completions / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
                <div className="text-4xl">⚡</div>
                <div>
                  <h3 className="text-white font-semibold">Streak Legend</h3>
                  <p className="text-gray-400 text-sm">Maintain a 30-day streak</p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min((habitStats.current_streak / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
                <div className="text-4xl">🌟</div>
                <div>
                  <h3 className="text-white font-semibold">XP Warrior</h3>
                  <p className="text-gray-400 text-sm">Earn 1000 total XP</p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((avatarStats.total_xp / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-8 border border-purple-400/30 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold text-white mb-2">Keep Going!</h2>
          <p className="text-gray-200 text-lg">
            You&apos;re making great progress. Every habit completed brings you closer to your goals!
          </p>
        </div>
      </div>
    </div>
  );
}
