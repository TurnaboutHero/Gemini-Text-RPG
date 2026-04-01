import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { GameState, Item } from '../../types';

interface InventoryTabProps {
  gameState: GameState;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: any) => void;
  onUseItem: (item: Item) => void;
}

const InventoryTab: React.FC<InventoryTabProps> = ({ gameState, onEquipItem, onUnequipItem, onUseItem }) => {
  return (
    <div className="flex flex-col h-full animate-fade-in space-y-4">
      <div className="flex items-center justify-between border-b border-primary/20 pb-2 mb-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          <ShoppingBag className="w-3 h-3" />
          소지품 및 아이템
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        {gameState.character?.inventory.length === 0 ? (
          <div className="py-20 text-center opacity-20">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xs uppercase tracking-widest">소지품이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {gameState.character?.inventory.map((item, idx) => {
              const isEquipped = Object.values(gameState.character?.equipment || {}).includes(item.id);
              return (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-4 items-center group hover:border-primary/30 transition-all relative shadow-md">
                  <div className="w-12 h-12 bg-bg-deep rounded-lg border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    <ShoppingBag className="w-5 h-5 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-100 truncate">{item.name}</span>
                      {isEquipped && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Equipped</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[8px] text-primary/50 uppercase tracking-widest font-bold">{item.itemType}</span>
                      {item.value > 0 && <span className="text-[8px] text-yellow-500/50 font-mono">{item.value}G</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {item.slot !== 'none' && (
                      <button
                        onClick={() => isEquipped ? onUnequipItem(item.slot) : onEquipItem(item)}
                        className={`text-[9px] px-3 py-1.5 rounded-lg border font-bold transition-all shrink-0 ${isEquipped ? 'bg-bg-deep border-gray-700 text-gray-400 hover:text-white' : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'}`}
                      >
                        {isEquipped ? '해제' : '장착'}
                      </button>
                    )}
                    {item.itemType === 'consumable' && (
                      <button
                        onClick={() => onUseItem(item)}
                        className="text-[9px] px-3 py-1.5 rounded-lg border bg-accent/10 border-accent/30 text-accent font-bold hover:bg-accent/20 transition-all shrink-0"
                      >
                        사용
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTab;
