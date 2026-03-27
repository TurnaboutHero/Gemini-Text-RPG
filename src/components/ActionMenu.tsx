import React from 'react';
import { Character, Npc, SpecialAction, SpecialActionType } from '../types';
import { FaBookOpen, FaComments, FaToolbox, FaTimes } from 'react-icons/fa';

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
  const usableItems = character?.inventory || [];

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gray-800/90 border border-yellow-500/30 rounded-lg shadow-lg shadow-yellow-500/20 p-6 text-gray-200 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="특별 행동 메뉴 닫기"
        >
          <FaTimes className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-yellow-300 font-adventure tracking-wider text-center mb-6">특별 행동</h2>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          {/* General Actions */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 border-b border-gray-700 pb-1 mb-3 flex items-center gap-2">
              <FaBookOpen />
              일반 행동
            </h3>
            <button
              onClick={() => handleActionClick({ type: SpecialActionType.SUMMARY })}
              className="w-full text-left bg-gray-700/80 text-cyan-200 font-adventure tracking-wider rounded-lg px-4 py-2 hover:bg-gray-600 transition-colors"
            >
              전체 상황 요약 받기
            </button>
          </div>

          {/* NPC Actions */}
          {presentNpcs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 border-b border-gray-700 pb-1 mb-3 flex items-center gap-2">
                <FaComments />
                인물과 대화
              </h3>
              <div className="space-y-2">
                {presentNpcs.map(npc => (
                  <button
                    key={npc.id}
                    onClick={() => handleActionClick({ type: SpecialActionType.TALK_TO_NPC, payload: npc.name })}
                    className="w-full text-left bg-gray-700/80 text-cyan-200 font-adventure tracking-wider rounded-lg px-4 py-2 hover:bg-gray-600 transition-colors"
                  >
                    {npc.name}에게 말 걸기
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Item Actions */}
          {usableItems.length > 0 && (
            <div>
                <h3 className="text-sm font-bold text-gray-400 border-b border-gray-700 pb-1 mb-3 flex items-center gap-2">
                    <FaToolbox />
                    소지품 사용
                </h3>
                <div className="space-y-2">
                    {usableItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleActionClick({ type: SpecialActionType.USE_ITEM, payload: item.name })}
                            className="w-full text-left bg-gray-700/80 text-cyan-200 font-adventure tracking-wider rounded-lg px-4 py-2 hover:bg-gray-600 transition-colors"
                        >
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