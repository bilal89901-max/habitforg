'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [avatar, setAvatar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchAvatar();
  }, [isAuthenticated, router]);

  const fetchAvatar = async () => {
    try {
      const response = await apiClient.get('/avatars/me');
      setAvatar(response.data.avatar);
    } catch (error) {
      console.error('Failed to fetch avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">⚔️ HabitForge</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white">Welcome, {user?.username}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Avatar</h2>
            {avatar ? (
              <div className="space-y-2">
                <p className="text-gray-200">
                  <span className="font-semibold">Name:</span> {avatar.name}
                </p>
                <p className="text-gray-200">
                  <span className="font-semibold">Level:</span> {avatar.level || 1}
                </p>
                <p className="text-gray-200">
                  <span className="font-semibold">Stage:</span> {avatar.current_evolution_stage}
                </p>
                <p className="text-gray-200">
                  <span className="font-semibold">XP:</span> {avatar.total_xp || 0}
                </p>
              </div>
            ) : (
              <p className="text-gray-300">No avatar found</p>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Stats</h2>
            {avatar && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-200">Strength:</span>
                  <span className="text-red-400 font-bold">{avatar.strength || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Intelligence:</span>
                  <span className="text-blue-400 font-bold">{avatar.intelligence || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Vitality:</span>
                  <span className="text-green-400 font-bold">{avatar.vitality || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Spirit:</span>
                  <span className="text-purple-400 font-bold">{avatar.spirit || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Social:</span>
                  <span className="text-yellow-400 font-bold">{avatar.social || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Wealth:</span>
                  <span className="text-amber-400 font-bold">{avatar.wealth || 0}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Currency</h2>
            {avatar && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-200">💰 Gold:</span>
                  <span className="text-yellow-400 font-bold text-xl">{avatar.gold || 100}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-200">💎 Premium:</span>
                  <span className="text-purple-400 font-bold text-xl">{avatar.premium_currency || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all">
            📝 Habits
          </button>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all">
            🎯 Quests
          </button>
          <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all">
            👥 Friends
          </button>
          <button className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all">
            ⚔️ Battle
          </button>
          <button className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white py-4 rounded-xl font-semibold hover:from-yellow-700 hover:to-amber-700 transition-all">
            🏰 Guilds
          </button>
          <button className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all">
            🛒 Shop
          </button>
          <button className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-4 rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all">
            📊 Analytics
          </button>
          <button className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-4 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all">
            ⚙️ Settings
          </button>
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to HabitForge! 🎮</h2>
          <p className="text-gray-200 mb-4">
            Your journey to self-improvement begins here. Track your habits, complete quests, and watch your avatar evolve!
          </p>
          <div className="space-y-2 text-gray-300">
            <p>✨ <strong>Create habits</strong> to earn XP and level up your avatar</p>
            <p>🎯 <strong>Complete quests</strong> for bonus rewards</p>
            <p>⚔️ <strong>Battle others</strong> to test your avatar's power</p>
            <p>👥 <strong>Add friends</strong> to compete and motivate each other</p>
            <p>🏰 <strong>Join a guild</strong> for collaborative challenges</p>
            <p>🛒 <strong>Visit the shop</strong> to customize your avatar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
