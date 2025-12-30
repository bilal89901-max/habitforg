'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            ⚔️ HabitForge
          </h1>
          <p className="text-2xl text-gray-200 mb-4">
            Level Up Your Life, One Habit at a Time
          </p>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Transform your real-life habits into an epic RPG adventure. 
            Create your avatar, complete quests, battle friends, and evolve from Newborn to Mythic!
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105"
            >
              Start Your Journey
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white text-lg font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Login
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Track Habits</h3>
              <p className="text-gray-300">
                Create custom habits linked to your avatar's stats. Daily exercise boosts Strength, reading increases Intelligence!
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">Complete Quests</h3>
              <p className="text-gray-300">
                Take on daily, weekly, and epic quests to earn massive rewards and accelerate your growth.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <div className="text-5xl mb-4">⚔️</div>
              <h3 className="text-xl font-bold text-white mb-2">Battle & Socialize</h3>
              <p className="text-gray-300">
                Challenge friends to battles, join guilds, and climb the leaderboards together!
              </p>
            </div>
          </div>

          <div className="mt-16 bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6">Evolution Stages</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-4xl mb-2">👶</div>
                <div className="text-white font-semibold">Newborn</div>
                <div className="text-gray-400 text-sm">Level 1-9</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🎓</div>
                <div className="text-white font-semibold">Apprentice</div>
                <div className="text-gray-400 text-sm">Level 10-24</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">⚔️</div>
                <div className="text-white font-semibold">Warrior</div>
                <div className="text-gray-400 text-sm">Level 25-49</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">👑</div>
                <div className="text-white font-semibold">Champion</div>
                <div className="text-gray-400 text-sm">Level 50-74</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-white font-semibold">Legend</div>
                <div className="text-gray-400 text-sm">Level 75-99</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">✨</div>
                <div className="text-white font-semibold">Mythic</div>
                <div className="text-gray-400 text-sm">Level 100+</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
