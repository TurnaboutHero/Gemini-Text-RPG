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
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10 bg-black/20 p-1.5 rounded-full hover:bg-black/40"
          aria-label="특별 행동 메뉴 닫기"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-6 border-b border-primary/20 pb-4">
            <h2 className="text-2xl font-bold text-primary font-adventure tracking-[0.2em] uppercase text-glow">actions</h2>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {/* General Actions */}
          <div>
            <h3 className="text-[11px] font-bold text-primary/70 border-b border-primary/10 pb-1.5 mb-3 flex items-center gap-2 uppercase tracking-[0.2em]">
              <BookOpen className="w-3.5 h-3.5" />
              탐색 및 조사
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.SUMMARY })}
                className="text-center bg-white/5 border border-white/5 text-gray-200 font-sans rounded-xl px-3 py-2.5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-xs focus:ring-2 focus:ring-primary/50 outline-none"
              >
                상황 요약
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: "주변을 조사한다" })}
                className="text-center bg-white/5 border border-white/5 text-gray-200 font-sans rounded-xl px-3 py-2.5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-xs focus:ring-2 focus:ring-primary/50 outline-none"
              >
                주변 조사
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: "주변을 둘러본다" })}
                className="text-center bg-white/5 border border-white/5 text-gray-200 font-sans rounded-xl px-3 py-2.5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-xs focus:ring-2 focus:ring-primary/50 outline-none"
              >
                주변 관찰
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.DESCRIBE_CHARACTER })}
                className="text-center bg-white/5 border border-white/5 text-gray-200 font-sans rounded-xl px-3 py-2.5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-xs focus:ring-2 focus:ring-primary/50 outline-none"
              >
                캐릭터 묘사
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.DESCRIBE_ENVIRONMENT })}
                className="text-center bg-white/5 border border-white/5 text-gray-200 font-sans rounded-xl px-3 py-2.5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-xs focus:ring-2 focus:ring-primary/50 outline-none"
              >
                환경 세부 묘사
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: "누구 없나요? 라고 외친다" })}
                className="text-center bg-white/5 border border-white/5 text-gray-200 font-sans rounded-xl px-3 py-2.5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-xs focus:ring-2 focus:ring-primary/50 outline-none"
              >
                도움 요청
              </button>
              <button
                onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: "휴식을 취한다" })}
                className="text-center bg-white/5 border border-white/5 text-gray-200 font-sans rounded-xl px-3 py-2.5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-xs focus:ring-2 focus:ring-primary/50 outline-none"
              >
                휴식 취하기
              </button>
            </div>
          </div>

          {/* NPC Actions */}
          {presentNpcs.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold text-primary/70 border-b border-primary/10 pb-1.5 mb-3 flex items-center gap-2 uppercase tracking-[0.2em]">
                <MessageSquare className="w-3.5 h-3.5" />
                대화 대상
              </h3>
              <div className="space-y-3">
                {presentNpcs.map(npc => (
                  <div key={npc.id} className="bg-white/5 border border-white/5 rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
                    <div className="flex flex-col mb-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-bold text-gray-200">
                           {npc.name} 
                           {npc.faction && <span className="text-[10px] text-gray-500 font-normal ml-2 uppercase tracking-wide">({npc.faction})</span>}
                        </span>
                        <span className={`text-[10px] font-mono font-bold tracking-widest ${npc.affinity > 70 ? 'text-green-400' : npc.affinity < 30 ? 'text-red-400' : 'text-primary/90'}`}>
                           호감도 {npc.affinity || 50}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${npc.affinity > 70 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : npc.affinity < 30 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]'}`} 
                          style={{ width: `${npc.affinity || 50}%` }}
                        />
                      </div>
                      {npc.memories && npc.memories.length > 0 && (
                          <div className="text-[10px] text-gray-400 italic mt-2 bg-black/20 p-2 rounded-lg border border-white/5">
                              "{npc.memories[npc.memories.length - 1]}"
                          </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: npc.name })}
                        className="text-center bg-primary/10 border border-primary/20 text-primary font-bold rounded-lg px-2 py-2 hover:bg-primary/20 hover:shadow-[0_0_10px_rgba(212,175,55,0.2)] transition-all text-xs"
                      >
                        말 걸기
                      </button>
                      <button
                        onClick={() => handleActionClick({ type: SpecialActionType.INITIATE_CONVERSATION, payload: npc.name })}
                        className="text-center bg-accent/10 border border-accent/20 text-accent font-bold rounded-lg px-2 py-2 hover:bg-accent/20 hover:shadow-[0_0_10px_rgba(14,165,233,0.2)] transition-all text-xs"
                      >
                        눈길 끌기
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
                <h3 className="text-[11px] font-bold text-primary/70 border-b border-primary/10 pb-1.5 mb-3 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <Briefcase className="w-3.5 h-3.5" />
                    소모품
                </h3>
                <div className="space-y-2">
                    {usableItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleActionClick({ type: SpecialActionType.USE_ITEM, payload: item.name })}
                            className="w-full text-left bg-white/5 border border-white/5 text-gray-200 font-bold rounded-xl p-3 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400 focus:ring-2 focus:ring-green-500/50 transition-all text-sm flex items-center gap-3 shadow-sm outline-none"
                        >
                            <div className="bg-gray-800 p-1.5 rounded-lg border border-gray-600 shadow-inner group-hover:border-green-500/50">
                                {itemTypeIcons[item.itemType] || <Package size={16} className="text-gray-400" />}
                            </div>
                            <span>{item.name} 사용</span>
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