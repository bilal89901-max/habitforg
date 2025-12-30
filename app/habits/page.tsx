'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

interface Habit {
  id: number;
  name: string;
  description: string;
  frequency: string;
  linked_stat: string;
  xp_reward: number;
  is_active: boolean;
  total_completions?: string;
  last_completion?: string;
}

export default function HabitsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    linked_stat: 'strength',
    xp_reward: 10,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchHabits();
  }, [isAuthenticated, router]);

  const fetchHabits = async () => {
    try {
      const response = await apiClient.get('/habits');
      setHabits(response.data.habits || []);
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/habits', newHabit);
      setShowModal(false);
      setNewHabit({
        name: '',
        description: '',
        frequency: 'daily',
        linked_stat: 'strength',
        xp_reward: 10,
      });
      fetchHabits();
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const logCompletion = async (habitId: number) => {
    try {
      await apiClient.post(`/habits/${habitId}/log`, {
        completion_value: 1,
      });
      fetchHabits();
    } catch (error) {
      console.error('Failed to log habit:', error);
    }
  };

  const getStatColor = (stat: string) => {
    const colors: Record<string, string> = {
      strength: 'text-red-400',
      intelligence: 'text-blue-400',
      vitality: 'text-green-400',
      spirit: 'text-purple-400',
      social: 'text-yellow-400',
      wealth: 'text-amber-400',
    };
    return colors[stat] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading...</div>
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
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              + New Habit
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">My Habits</h1>

        {habits.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-white mb-2">No habits yet</h2>
            <p className="text-gray-300 mb-6">Create your first habit to start leveling up!</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <div key={habit.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{habit.name}</h3>
                  <span className={`text-sm font-semibold ${getStatColor(habit.linked_stat)}`}>
                    +{habit.xp_reward} XP
                  </span>
                </div>
                
                {habit.description && (
                  <p className="text-gray-300 text-sm mb-4">{habit.description}</p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm capitalize">{habit.frequency}</span>
                  <span className={`text-sm font-semibold capitalize ${getStatColor(habit.linked_stat)}`}>
                    {habit.linked_stat}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Completions</span>
                    <span>{habit.total_completions || 0}</span>
                  </div>
                  {habit.last_completion && (
                    <p className="text-xs text-gray-500">
                      Last: {new Date(habit.last_completion).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => logCompletion(habit.id)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                >
                  ✓ Complete Today
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Habit</h2>
            
            <form onSubmit={createHabit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Morning Exercise"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="30 minutes of cardio"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Frequency
                </label>
                <select
                  value={newHabit.frequency}
                  onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Linked Stat
                </label>
                <select
                  value={newHabit.linked_stat}
                  onChange={(e) => setNewHabit({ ...newHabit, linked_stat: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="strength">Strength</option>
                  <option value="intelligence">Intelligence</option>
                  <option value="vitality">Vitality</option>
                  <option value="spirit">Spirit</option>
                  <option value="social">Social</option>
                  <option value="wealth">Wealth</option>
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
