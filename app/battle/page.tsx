'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

interface BattleResult {
  id: number;
  winner_id: number;
  attacker_damage: number;
  defender_damage: number;
  xp_gained: number;
  gold_gained: number;
  attacker: {
    username: string;
    level: number;
  };
  defender: {
    username: string;
    level: number;
  };
}

function BattleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BattleResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const opponentId = searchParams.get('opponent');
    if (opponentId) {
      initiateBattle(parseInt(opponentId));
    }
  }, [isAuthenticated, router, searchParams]);

  const initiateBattle = async (opponentId: number) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/battles', {
        defender_id: opponentId,
      });
      setBattleResult(response.data.battle);
    } catch (error) {
      console.error('Battle failed:', error);
      alert('Battle failed!');
    } finally {
      setLoading(false);
    }
  };

  const battleRandom = async () => {
    setLoading(true);
    try {
      const opponentResponse = await apiClient.get('/battles/opponents');
      const opponent = opponentResponse.data.opponent;
      
      if (!opponent) {
        alert('No opponents available!');
        return;
      }

      const battleResponse = await apiClient.post('/battles', {
        defender_id: opponent.id,
      });
      setBattleResult(battleResponse.data.battle);
    } catch (error) {
      console.error('Battle failed:', error);
      alert('Battle failed!');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await apiClient.get('/battles/history');
      setHistory(response.data.battles || []);
      setShowHistory(true);
    } catch (error) {
      console.error('Failed to load history:', error);
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
              onClick={loadHistory}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Battle History
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!battleResult && !showHistory && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">⚔️ Battle Arena</h1>
              <p className="text-xl text-gray-300">Test your avatar&apos;s strength against others!</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
              <div className="text-6xl mb-6">🎯</div>
              <h2 className="text-2xl font-bold text-white mb-6">Ready to Battle?</h2>
              <p className="text-gray-300 mb-8">
                Your avatar&apos;s stats will determine the outcome. Higher level avatars have better chances!
              </p>
              
              <button
                onClick={battleRandom}
                disabled={loading}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⚔️ Finding Opponent...' : '⚔️ Find Random Opponent'}
              </button>
            </div>
          </>
        )}

        {battleResult && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Battle Complete!</h1>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <div className="grid grid-cols-3 gap-6 items-center mb-8">
                <div className="text-center">
                  <div className="text-4xl mb-2">🛡️</div>
                  <h3 className="text-xl font-bold text-white mb-1">{battleResult.attacker.username}</h3>
                  <p className="text-gray-400">Level {battleResult.attacker.level}</p>
                  <p className="text-red-400 font-semibold mt-2">{battleResult.attacker_damage} damage</p>
                </div>

                <div className="text-center">
                  <div className="text-5xl mb-2">⚔️</div>
                  <p className="text-2xl font-bold text-white">VS</p>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-2">🛡️</div>
                  <h3 className="text-xl font-bold text-white mb-1">{battleResult.defender.username}</h3>
                  <p className="text-gray-400">Level {battleResult.defender.level}</p>
                  <p className="text-red-400 font-semibold mt-2">{battleResult.defender_damage} damage</p>
                </div>
              </div>

              <div className={`text-center p-6 rounded-lg ${
                battleResult.winner_id === user?.id
                  ? 'bg-green-500/20 border border-green-500'
                  : 'bg-red-500/20 border border-red-500'
              }`}>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {battleResult.winner_id === user?.id ? '🎉 Victory!' : '💔 Defeat'}
                </h2>
                {battleResult.winner_id === user?.id && (
                  <div className="space-y-2">
                    <p className="text-xl text-green-400 font-semibold">+{battleResult.xp_gained} XP</p>
                    <p className="text-xl text-yellow-400 font-semibold">+{battleResult.gold_gained} Gold</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setBattleResult(null);
                    battleRandom();
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Battle Again
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistory && history.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Battle History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {history.map((battle) => (
                <div key={battle.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">⚔️</span>
                      <div>
                        <p className="text-white font-semibold">
                          {battle.attacker.username} vs {battle.defender.username}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Winner: {battle.winner_id === user?.id ? 'You' : battle.defender.username}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {battle.winner_id === user?.id ? (
                        <>
                          <p className="text-green-400 font-semibold">Victory</p>
                          <p className="text-sm text-gray-400">+{battle.xp_gained} XP</p>
                        </>
                      ) : (
                        <p className="text-red-400 font-semibold">Defeat</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BattlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading battle...</div>
      </div>
    }>
      <BattleContent />
    </Suspense>
  );
}
