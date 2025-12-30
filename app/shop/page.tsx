'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

interface ShopItem {
  id: number;
  item_name: string;
  item_type: string;
  description: string;
  price_gold: number;
  price_premium: number;
  rarity: string;
  icon: string;
}

export default function ShopPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<ShopItem[]>([]);
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [loading, setLoading] = useState(true);
  const [userGold, setUserGold] = useState(100);
  const [userPremium, setUserPremium] = useState(0);

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
      if (activeTab === 'shop') {
        const response = await apiClient.get('/shop');
        setItems(response.data.items || []);
      } else {
        const response = await apiClient.get('/shop/inventory');
        setInventory(response.data.inventory || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseItem = async (itemId: number, priceGold: number, pricePremium: number) => {
    if (priceGold > userGold || pricePremium > userPremium) {
      alert('Not enough currency!');
      return;
    }

    try {
      await apiClient.post(`/shop/${itemId}/purchase`);
      setUserGold(prev => prev - priceGold);
      setUserPremium(prev => prev - pricePremium);
      alert('Purchase successful!');
      fetchData();
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed!');
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'border-gray-400',
      rare: 'border-blue-400',
      epic: 'border-purple-400',
      legendary: 'border-yellow-400',
    };
    return colors[rarity] || 'border-gray-400';
  };

  const getRarityBadge = (rarity: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      common: { bg: 'bg-gray-500', text: 'Common' },
      rare: { bg: 'bg-blue-500', text: 'Rare' },
      epic: { bg: 'bg-purple-500', text: 'Epic' },
      legendary: { bg: 'bg-yellow-500', text: 'Legendary' },
    };
    return badges[rarity] || badges.common;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => router.push('/dashboard')} className="text-2xl font-bold text-white hover:text-purple-300 transition">
              ⚔️ HabitForge
            </button>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <span className="text-yellow-400">💰</span>
                <span className="text-white font-semibold">{userGold}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <span className="text-purple-400">💎</span>
                <span className="text-white font-semibold">{userPremium}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">🛒 Shop</h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'shop'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            🛍️ Shop
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'inventory'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            🎒 My Inventory
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">Loading...</div>
        ) : activeTab === 'shop' ? (
          items.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold text-white mb-2">Shop is empty</h2>
              <p className="text-gray-300">Check back later for new items!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const rarityBadge = getRarityBadge(item.rarity);
                return (
                  <div
                    key={item.id}
                    className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border-2 ${getRarityColor(item.rarity)}`}
                  >
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-3">{item.icon || '🎁'}</div>
                      <span className={`${rarityBadge.bg} text-white text-xs px-3 py-1 rounded-full font-semibold`}>
                        {rarityBadge.text}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 text-center">{item.item_name}</h3>
                    <p className="text-gray-300 text-sm mb-4 text-center capitalize">{item.item_type}</p>
                    
                    {item.description && (
                      <p className="text-gray-400 text-sm mb-4 text-center">{item.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {item.price_gold > 0 && (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-yellow-400">💰</span>
                          <span className="text-white font-semibold">{item.price_gold} Gold</span>
                        </div>
                      )}
                      {item.price_premium > 0 && (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-purple-400">💎</span>
                          <span className="text-white font-semibold">{item.price_premium} Premium</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => purchaseItem(item.id, item.price_gold, item.price_premium)}
                      disabled={item.price_gold > userGold || item.price_premium > userPremium}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Purchase
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          inventory.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-4">🎒</div>
              <h2 className="text-2xl font-bold text-white mb-2">Inventory is empty</h2>
              <p className="text-gray-300">Purchase items from the shop to fill your inventory!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => {
                const rarityBadge = getRarityBadge(item.rarity);
                return (
                  <div
                    key={item.id}
                    className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border-2 ${getRarityColor(item.rarity)}`}
                  >
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-3">{item.icon || '🎁'}</div>
                      <span className={`${rarityBadge.bg} text-white text-xs px-3 py-1 rounded-full font-semibold`}>
                        {rarityBadge.text}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 text-center">{item.item_name}</h3>
                    <p className="text-gray-300 text-sm mb-4 text-center capitalize">{item.item_type}</p>

                    <button
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      Equipped
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
