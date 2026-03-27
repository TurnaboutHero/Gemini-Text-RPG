import React, { useState } from 'react';
import { Character, Item } from '../types';
import { FaTimes, FaCoins, FaShoppingCart, FaTags } from 'react-icons/fa';

interface ShopProps {
  character: Character;
  shop: { name: string; inventory: Item[] };
  onClose: () => void;
  onBuy: (item: Item) => void;
  onSell: (item: Item) => void;
}

const Shop: React.FC<ShopProps> = ({ character, shop, onClose, onBuy, onSell }) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  const handleTabChange = (tab: 'buy' | 'sell') => {
    setActiveTab(tab);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gray-800/90 border border-yellow-500/30 rounded-lg shadow-lg shadow-yellow-500/20 p-6 text-gray-200 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="상점 닫기"
        >
          <FaTimes className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-yellow-300 font-adventure tracking-wider">{shop.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400 bg-gray-900/50 px-3 py-1 rounded-full">
                <FaCoins />
                <span className="font-bold text-lg">{character.gold} G</span>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-4">
            <button onClick={() => handleTabChange('buy')} className={`flex-1 py-2 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'buy' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <FaShoppingCart /> 구매
            </button>
            <button onClick={() => handleTabChange('sell')} className={`flex-1 py-2 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'sell' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <FaTags /> 판매
            </button>
        </div>
        
        {/* Item List */}
        <div className="flex-grow overflow-y-auto pr-2">
            {activeTab === 'buy' && (
                <ul className="space-y-2">
                    {shop.inventory.map(item => {
                        const price = item.value * 2;
                        const canAfford = character.gold >= price;
                        return (
                            <li key={item.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-200">{item.name}</p>
                                    <p className="text-xs text-gray-400">{item.description}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="font-bold text-yellow-400">{price} G</p>
                                    <button
                                        onClick={() => onBuy(item)}
                                        disabled={!canAfford}
                                        className="mt-1 text-xs bg-cyan-600 text-white font-bold rounded-md py-1 px-3 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        구매
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            {activeTab === 'sell' && (
                <ul className="space-y-2">
                     {character.inventory.length === 0 ? (
                        <p className="text-center text-gray-500 italic mt-4">판매할 아이템이 없습니다.</p>
                    ) : (
                        character.inventory.filter(item => item.value > 0).map(item => {
                            const price = item.value;
                            return (
                                <li key={item.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-200">{item.name}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="font-bold text-green-400">{price} G</p>
                                        <button
                                            onClick={() => onSell(item)}
                                            className="mt-1 text-xs bg-red-700 text-white font-bold rounded-md py-1 px-3 hover:bg-red-600"
                                        >
                                            판매
                                        </button>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default Shop;