'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

interface Friend {
  id: number;
  username: string;
  level: number;
  total_xp: number;
  profile_picture_url?: string;
  status: string;
}

interface FriendRequest {
  id: number;
  username: string;
  level: number;
  sent_at: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, router, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const response = await apiClient.get('/friends');
        setFriends(response.data.friends || []);
      } else {
        const response = await apiClient.get('/friends/requests');
        setRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername) return;
    
    try {
      await apiClient.post(`/friends/${searchUsername}/request`);
      setSearchUsername('');
      alert('Friend request sent!');
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const acceptRequest = async (userId: number) => {
    try {
      await apiClient.post(`/friends/${userId}/accept`);
      fetchData();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const removeFriend = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      await apiClient.delete(`/friends/${userId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to remove friend:', error);
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
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Friends</h1>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Add Friend</h2>
          <form onSubmit={sendFriendRequest} className="flex gap-4">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter username"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
            >
              Send Request
            </button>
          </form>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'friends'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            👥 My Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'requests'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            📬 Requests ({requests.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">Loading...</div>
        ) : activeTab === 'friends' ? (
          friends.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-white mb-2">No friends yet</h2>
              <p className="text-gray-300">Add friends to compete and motivate each other!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <div key={friend.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{friend.username}</h3>
                      <p className="text-gray-400">Level {friend.level}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Total XP:</span>
                      <span className="text-blue-400 font-semibold">{friend.total_xp}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/battle?opponent=${friend.id}`)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
                    >
                      ⚔️ Battle
                    </button>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          requests.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">📬</div>
              <h2 className="text-2xl font-bold text-white mb-2">No pending requests</h2>
              <p className="text-gray-300">You&apos;ll see friend requests here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map((request) => (
                <div key={request.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                      {request.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{request.username}</h3>
                      <p className="text-gray-400 text-sm">Level {request.level}</p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-4">
                    Sent {new Date(request.sent_at).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(request.id)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => removeFriend(request.id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
