import React from 'react';
import { Character, Npc, SpecialAction, SpecialActionType, ItemType } from '../types';
import { BookOpen, MessageSquare, Briefcase, X, Sword, Shield, FlaskConical, Scroll, Package } from 'lucide-react';

const itemTypeIcons: Record<ItemType, React.ReactNode> = {
    weapon: <Sword size={14} className="text-red-400" />,
    armor: <Shield size={14} className="text-blue-400" />,
    consumable: <FlaskConical size={14} className="text-green-400" />,
    quest: <Scroll size={14} className="text-yellow-400" />,
    misc: <Package size={14} className="text-gray-400" />,
};

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (action: SpecialAction) => void;
  character: Character | null;
  npcs: Record<string, Npc>;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ isOpen, onClose, onExecuteAction, character, npcs }) => {
  if (!isOpen) return null;

  const handleActionClick = (action: SpecialAction) => {
    onExecuteAction(action);
  };
  
  const presentNpcs = Object.values(npcs);
  const usableItems = character?.inventory.filter(item => item.itemType === 'consumable') || [];

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-bg-card border border-primary/30 rounded-lg shadow-2xl p-4 text-gray-200 relative max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="특별 행동 메뉴 닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-primary font-adventure tracking-wider text-center mb-4 uppercase text-glow">Special Actions</h2>

        <div className="flex-grow overflow-y-auto pr-1 space-y-4">
          {/* General Actions */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 border-b border-white/10 pb-1 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <BookOpen className="w-3 h-3" />
              General
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.SUMMARY })}
                className="text-left bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-[10px]"
              >
                상황 요약
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: "주변을 조사한다" })}
                className="text-left bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-[10px]"
              >
                주변 조사
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: "주변을 둘러본다" })}
                className="text-left bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-[10px]"
              >
                주변 관찰
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.DESCRIBE_CHARACTER })}
                className="text-left bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-[10px]"
              >
                캐릭터 묘사
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.DESCRIBE_ENVIRONMENT })}
                className="text-left bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-[10px]"
              >
                환경 세부 묘사
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: "누구 없나요? 라고 외친다" })}
                className="text-left bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-[10px]"
              >
                도움 요청
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: "휴식을 취한다" })}
                className="text-left bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-[10px]"
              >
                휴식 취하기
              </button>
            </div>
          </div>

          {/* NPC Actions */}
          {presentNpcs.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-500 border-b border-white/10 pb-1 mb-2 flex items-center gap-2 uppercase tracking-widest">
                <MessageSquare className="w-3 h-3" />
                Dialogue
              </h3>
              <div className="space-y-1.5">
                {presentNpcs.map(npc => (
                  <div key={npc.id} className="bg-white/5 rounded-lg p-3 space-y-3">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-300">{npc.name}</span>
                        <span className="text-[9px] text-primary/80">호감도: {npc.affinity || 50}</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${npc.affinity || 50}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: npc.name })}
                        className="text-center bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors text-[10px]"
                      >
                        말 걸기
                      </button>
                      <button
                        onClick={() => handleActionClick({ type: SpecialActionType.INITIATE_CONVERSATION, payload: npc.name })}
                        className="text-center bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors text-[10px]"
                      >
                        대화 유도
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Item Actions */}
          {usableItems.length > 0 && (
            <div>
                <h3 className="text-[10px] font-bold text-gray-500 border-b border-white/10 pb-1 mb-2 flex items-center gap-2 uppercase tracking-widest">
                    <Briefcase className="w-3 h-3" />
                    Inventory
                </h3>
                <div className="space-y-1.5">
                    {usableItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleActionClick({ type: SpecialActionType.USE_ITEM, payload: item.name })}
                            className="w-full text-left bg-white/5 text-accent font-adventure tracking-wider rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
                        >
                            {itemTypeIcons[item.itemType] || <Package size={14} className="text-gray-400" />}
                            {item.name} 사용하기
                        </button>
                    ))}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionMenu;