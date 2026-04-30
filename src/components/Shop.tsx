import React, { useState } from 'react';
import { Character, Item, ItemType } from '../types';
import { motion } from 'motion/react';
import { X, Coins, ShoppingCart, Tag, Sword, Shield, FlaskConical, Scroll, Package } from 'lucide-react';
import ItemTooltip from './ItemTooltip';

interface ShopProps {
  character: Character;
  shop: { name: string; inventory: Item[] };
  onClose: () => void;
  onBuy: (item: Item) => void;
  onSell: (item: Item) => void;
}

const itemTypeIcons: Record<ItemType, React.ReactNode> = {
    weapon: <Sword size={14} className="text-red-400" />,
    armor: <Shield size={14} className="text-blue-400" />,
    consumable: <FlaskConical size={14} className="text-green-400" />,
    quest: <Scroll size={14} className="text-yellow-400" />,
    misc: <Package size={14} className="text-gray-400" />,
};

const Shop: React.FC<ShopProps> = ({ character, shop, onClose, onBuy, onSell }) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  const handleTabChange = (tab: 'buy' | 'sell') => {
    setActiveTab(tab);
  };

  const equippedItemIds = new Set(Object.values(character.equipment));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-bg-card/95 border border-primary/30 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.15)] p-6 md:p-8 text-gray-200 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/20 p-2 rounded-full text-gray-400 hover:text-white hover:bg-black/40 transition-colors z-10"
          aria-label="상점 닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-primary font-adventure tracking-[0.2em] uppercase text-glow">{shop.name}</h1>
            <div className="inline-flex items-center justify-center gap-2 mt-4 text-primary bg-bg-deep border border-primary/20 px-4 py-1.5 rounded-full shadow-inner">
                <Coins size={16} />
                <span className="font-bold text-lg font-mono">{character.gold} G</span>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6 gap-2">
            <button onClick={() => handleTabChange('buy')} className={`flex-1 py-3 text-sm md:text-[15px] font-bold transition-colors flex items-center justify-center gap-2 rounded-t-xl ${activeTab === 'buy' ? 'bg-white/5 border-b-2 border-primary text-primary shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                <ShoppingCart size={16} /> 구매
            </button>
            <button onClick={() => handleTabChange('sell')} className={`flex-1 py-3 text-sm md:text-[15px] font-bold transition-colors flex items-center justify-center gap-2 rounded-t-xl ${activeTab === 'sell' ? 'bg-white/5 border-b-2 border-primary text-primary shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                <Tag size={16} /> 판매
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
                            <ItemTooltip key={item.id} item={item} className="block w-full">
                                <li className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-800 p-1 rounded border border-gray-600">
                                                {itemTypeIcons[item.itemType] || <Package size={14} className="text-gray-400" />}
                                            </div>
                                            <p className="font-bold text-gray-200 truncate">{item.name}</p>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 flex flex-col items-end justify-center min-w-[70px]">
                                        <p className="font-bold text-yellow-400 whitespace-nowrap">{price} G</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onBuy(item); }}
                                            disabled={!canAfford}
                                            className="mt-1 text-xs bg-cyan-600 text-white font-bold rounded-md py-1.5 px-3 w-full max-w-[70px] hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-sm shadow-cyan-900/30"
                                        >
                                            구매
                                        </button>
                                    </div>
                                </li>
                            </ItemTooltip>
                        );
                    })}
                </ul>
            )}
            {activeTab === 'sell' && (() => {
                const sellableItems = character.inventory.filter(item => item.value > 0 && !equippedItemIds.has(item.id));
                return (
                    <ul className="space-y-2">
                        {sellableItems.length === 0 ? (
                            <p className="text-center text-gray-500 italic mt-4">판매할 아이템이 없습니다.</p>
                        ) : (
                            sellableItems.map(item => {
                                const price = item.value;
                                return (
                                    <ItemTooltip key={item.id} item={item} className="block w-full">
                                        <li className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-gray-800 p-1 rounded border border-gray-600">
                                                        {itemTypeIcons[item.itemType] || <Package size={14} className="text-gray-400" />}
                                                    </div>
                                                    <p className="font-bold text-gray-200 truncate">{item.name}</p>
                                                </div>
                                                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 flex flex-col items-end justify-center min-w-[70px]">
                                                <p className="font-bold text-green-400 whitespace-nowrap">{price} G</p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSell(item); }}
                                                    className="mt-1 text-xs bg-red-700 text-white font-bold rounded-md py-1.5 px-3 w-full max-w-[70px] hover:bg-red-600 shadow-sm shadow-red-900/30"
                                                >
                                                    판매
                                                </button>
                                            </div>
                                        </li>
                                    </ItemTooltip>
                                );
                            })
                        )}
                    </ul>
                );
            })()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Shop;