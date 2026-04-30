import React from 'react';
import { MessageSquare } from 'lucide-react';
import { GameState, StoryPartType, AiScenePart } from '../../types';

interface DialogueTabProps {
  gameState: GameState;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

const DialogueTab: React.FC<DialogueTabProps> = ({ gameState, chatEndRef }) => {
  const chatItems: { id: string; type: 'dialogue'; text: string; characterName?: string; isPlayer?: boolean; imageUrl?: string; npcFaction?: string; npcAffinity?: number }[] = [];
  
  gameState.storyLog.forEach((entry, idx) => {
    if (entry.type === StoryPartType.AI_SCENE) {
      const scene = entry as AiScenePart;
      if (scene.contentBlocks) {
        scene.contentBlocks.forEach((block, bIdx) => {
          if (block.type === 'dialogue') {
            const isPlayer = block.characterName === gameState.character?.name;
            const npc = Object.values(gameState.npcs).find((n: any) => n.name === block.characterName);
            const imageUrl = isPlayer ? gameState.character?.imageUrl : (npc as any)?.imageUrl;
            
            chatItems.push({
              id: `dial-${idx}-${bIdx}`,
              type: 'dialogue',
              text: block.dialogue,
              characterName: block.characterName,
              isPlayer,
              imageUrl,
              npcFaction: (npc as any)?.faction,
              npcAffinity: (npc as any)?.affinity
            });
          }
        });
      }
    } else if (entry.type === StoryPartType.USER) {
      const isDialogue = entry.text.startsWith('"') && entry.text.endsWith('"');
      if (isDialogue) {
        chatItems.push({
          id: `user-dial-${idx}`,
          type: 'dialogue',
          text: entry.text,
          characterName: gameState.character?.name || 'Player',
          isPlayer: true,
          imageUrl: gameState.character?.imageUrl
        });
      }
    }
  });

  if (chatItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
        <MessageSquare className="w-12 h-12 mb-4" />
        <p className="text-xs uppercase tracking-widest">대화가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in space-y-4">
      <div className="flex items-center justify-between border-b border-primary/20 pb-2 mb-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-3 h-3" />
          대화 기록
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth">
        {chatItems.map((item) => (
          <div key={item.id} className={`flex gap-3 ${item.isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
            {gameState.useImageGeneration && (
              <div className="flex-shrink-0 mt-1">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.characterName} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-white/10">
                    {item.characterName?.substring(0, 1)}
                  </div>
                )}
              </div>
            )}
            <div className={`p-3 rounded-2xl text-xs w-full max-w-[85%] shadow-lg border ${item.isPlayer ? 'bg-accent/15 border-accent/30 text-accent rounded-br-none bg-gradient-to-bl from-accent/10 to-transparent shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'bg-black/60 text-gray-200 rounded-bl-none border-primary/30 bg-gradient-to-br from-primary/10 to-transparent shadow-[0_0_15px_rgba(212,175,55,0.1)]'}`}>
              {!item.isPlayer && (
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-bold text-primary/70 flex items-center gap-1.5 flex-wrap">
                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                    {item.characterName}
                    {item.npcFaction && <span className="text-gray-500 font-normal">({item.npcFaction})</span>}
                  </div>
                  {item.npcAffinity !== undefined && (
                     <div className="flex flex-col items-end w-16 flex-shrink-0 ml-2">
                        <span className={`text-[8px] mb-0.5 ${item.npcAffinity > 70 ? 'text-green-400' : item.npcAffinity < 30 ? 'text-red-400' : 'text-primary/80'}`}>
                           호감도: {item.npcAffinity}
                        </span>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${item.npcAffinity > 70 ? 'bg-green-500' : item.npcAffinity < 30 ? 'bg-red-500' : 'bg-primary'}`} 
                            style={{ width: `${item.npcAffinity}%` }}
                          />
                        </div>
                     </div>
                  )}
                </div>
              )}
              {item.isPlayer && (
                <div className="text-[10px] font-bold text-accent/70 mb-1 text-right flex items-center justify-end gap-1.5">
                  {item.characterName}
                  <span className="w-1 h-1 rounded-full bg-accent/50" />
                </div>
              )}
              <p className="leading-relaxed">{item.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default DialogueTab;
