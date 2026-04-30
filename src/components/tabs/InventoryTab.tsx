import React from 'react';
import { ShoppingBag, Sword, Shield, FlaskConical, Scroll, Package } from 'lucide-react';
import { GameState, Item, ItemType } from '../../types';
import ItemTooltip from '../ItemTooltip';

interface InventoryTabProps {
  gameState: GameState;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: any) => void;
  onUseItem: (item: Item) => void;
}

const itemTypeIcons: Record<ItemType, React.ReactNode> = {
    weapon: <Sword size={20} className="text-red-400 group-hover:text-red-300 transition-colors" />,
    armor: <Shield size={20} className="text-blue-400 group-hover:text-blue-300 transition-colors" />,
    consumable: <FlaskConical size={20} className="text-green-400 group-hover:text-green-300 transition-colors" />,
    quest: <Scroll size={20} className="text-yellow-400 group-hover:text-yellow-300 transition-colors" />,
    misc: <Package size={20} className="text-gray-400 group-hover:text-gray-300 transition-colors" />,
};

const getItemIcon = (type: ItemType) => itemTypeIcons[type] || <Package size={20} className="text-gray-400" />;

const InventoryTab: React.FC<InventoryTabProps> = ({ gameState, onEquipItem, onUnequipItem, onUseItem }) => {
  return (
    <div className="flex flex-col h-full animate-fade-in space-y-4">
      <div className="flex items-center justify-between border-b border-primary/20 pb-2 mb-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          소지품 및 장비
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {gameState.character?.inventory.length === 0 ? (
          <div className="py-20 text-center opacity-40 flex flex-col items-center">
            <Package className="w-16 h-16 mb-4 text-gray-500" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">소지품이 비어있습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {gameState.character?.inventory.map((item, idx) => {
              const isEquipped = Object.values(gameState.character?.equipment || {}).includes(item.id);
              return (
                <ItemTooltip key={idx} item={item} className="relative block">
                  <div className={`bg-bg-deep/40 backdrop-blur-sm border ${isEquipped ? 'border-primary/40 shadow-[0_0_10px_rgba(212,175,55,0.15)]' : 'border-white/10 hover:border-primary/20'} rounded-xl p-3 flex gap-4 items-center group transition-all duration-300 relative shadow-md`}>
                    <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${isEquipped ? 'bg-primary/10 border-primary/30' : 'bg-gray-800/80 border-white/10 group-hover:bg-gray-800'}`}>
                      {getItemIcon(item.itemType)}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-bold truncate ${isEquipped ? 'text-primary' : 'text-gray-100'}`}>{item.name}</span>
                        {isEquipped && <span className="text-[9px] bg-primary/20 border border-primary/30 text-primary px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(212,175,55,0.2)] uppercase font-bold tracking-wider">장착됨</span>}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold bg-gray-800/50 px-2 py-0.5 rounded-full border border-gray-700/50">{item.itemType === 'weapon' ? '무기' : item.itemType === 'armor' ? '방어구' : item.itemType === 'consumable' ? '소모품' : item.itemType === 'quest' ? '퀘스트' : '기타'}</span>
                          {item.value > 0 && <span className="text-[10px] text-yellow-500 font-mono font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 block"></span>{item.value}G</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0 justify-center">
                      {item.slot !== 'none' && (
                        <button
                          onClick={() => isEquipped ? onUnequipItem(item.slot) : onEquipItem(item)}
                          className={`text-[10px] w-14 py-1.5 rounded-lg border font-bold transition-all shadow-sm ${isEquipped ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-primary border-primary/80 text-bg-deep hover:bg-white hover:text-black hover:border-white shadow-[0_0_10px_rgba(212,175,55,0.3)]'}`}
                        >
                          {isEquipped ? '해제' : '장착'}
                        </button>
                      )}
                      {item.itemType === 'consumable' && (
                        <button
                          onClick={() => onUseItem(item)}
                          className="text-[10px] w-14 py-1.5 rounded-lg border bg-accent/20 border-accent/40 text-accent font-bold hover:bg-accent/30 transition-all shadow-sm shadow-accent/10"
                        >
                          사용
                        </button>
                      )}
                    </div>
                  </div>
                </ItemTooltip>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTab;
