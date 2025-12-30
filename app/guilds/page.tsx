'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

interface Guild {
  id: number;
  name: string;
  description: string;
  member_count: number;
  leader_username: string;
  created_at: string;
}

export default function GuildsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGuild, setNewGuild] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchGuilds();
  }, [isAuthenticated, router]);

  const fetchGuilds = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/guilds/search');
      setGuilds(response.data.guilds || []);
    } catch (error) {
      console.error('Failed to fetch guilds:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/guilds', newGuild);
      setShowCreateModal(false);
      setNewGuild({ name: '', description: '' });
      fetchGuilds();
    } catch (error) {
      console.error('Failed to create guild:', error);
      alert('Failed to create guild');
    }
  };

  const joinGuild = async (guildId: number) => {
    try {
      await apiClient.post(`/guilds/${guildId}/join`);
      alert('Joined guild successfully!');
      fetchGuilds();
    } catch (error) {
      console.error('Failed to join guild:', error);
      alert('Failed to join guild');
    }
  };

  const leaveGuild = async () => {
    if (!myGuild || !confirm('Are you sure you want to leave this guild?')) return;
    
    try {
      await apiClient.delete(`/guilds/${myGuild.id}/leave`);
      setMyGuild(null);
      fetchGuilds();
    } catch (error) {
      console.error('Failed to leave guild:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => router.push('/dashboard')} className="text-2xl font-bold text-white hover:text-purple-300 transition">
              ⚔️ HabitForge
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              + Create Guild
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">🏰 Guilds</h1>

        {myGuild && (
          <div className="mb-8 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 border-2 border-yellow-400">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{myGuild.name}</h2>
                <p className="text-yellow-100 mb-4">{myGuild.description}</p>
                <div className="flex gap-4 text-sm text-yellow-100">
                  <span>👥 {myGuild.member_count} members</span>
                  <span>👑 Leader: {myGuild.leader_username}</span>
                </div>
              </div>
              <button
                onClick={leaveGuild}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Leave Guild
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-white py-12">Loading guilds...</div>
        ) : guilds.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
            <div className="text-6xl mb-4">🏰</div>
            <h2 className="text-2xl font-bold text-white mb-2">No guilds found</h2>
            <p className="text-gray-300 mb-6">Be the first to create a guild!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
            >
              Create Guild
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guilds.map((guild) => (
              <div key={guild.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">🏰</div>
                  <h3 className="text-xl font-bold text-white mb-2">{guild.name}</h3>
                </div>

                <p className="text-gray-300 text-sm mb-4 text-center min-h-[3rem]">
                  {guild.description || 'No description'}
                </p>

                <div className="space-y-2 mb-4 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Members:</span>
                    <span className="text-white font-semibold">{guild.member_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Leader:</span>
                    <span className="text-white font-semibold">{guild.leader_username}</span>
                  </div>
                </div>

                <button
                  onClick={() => joinGuild(guild.id)}
                  disabled={myGuild !== null}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {myGuild ? 'Already in Guild' : 'Join Guild'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Guild</h2>
            
            <form onSubmit={createGuild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Guild Name
                </label>
                <input
                  type="text"
                  value={newGuild.name}
                  onChange={(e) => setNewGuild({ ...newGuild, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Warriors of Progress"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  value={newGuild.description}
                  onChange={(e) => setNewGuild({ ...newGuild, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="A guild for dedicated habit builders"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Guild
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
