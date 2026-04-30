import React from 'react';
import Markdown from 'react-markdown';
import { AiScenePart, Character, Npc, ContentBlock, StoryLogEntry, StoryPartType } from '../types';
import { motion } from 'motion/react';
import { useGame } from '../contexts/GameContext';
import { Film, Dices, ShoppingBag, ArrowUpCircle, Coins, Heart, AlertCircle, Swords, ShieldPlus, Book } from 'lucide-react';

interface CurrentSceneProps {
  part: AiScenePart;
  subsequentLogs?: StoryLogEntry[];
  character: Character | null;
  npcs: Record<string, Npc>;
  useImageGeneration: boolean;
}

const SystemMessageItem: React.FC<{ text: string }> = ({ text }) => {
    let icon = <Dices className="w-3.5 h-3.5 shrink-0" />;
    let textColor = "text-gray-400";
    let bgPulse = "";

    if (text.includes("아이템 획득") || text.includes("새로운 아이템")) {
        icon = <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-yellow-300" />;
        textColor = "text-yellow-200";
        bgPulse = "bg-yellow-900/20 border-yellow-500/20";
    } else if (text.includes("경험치 획득") || text.includes("XP") || text.includes("레벨 업")) {
        icon = <ArrowUpCircle className="w-3.5 h-3.5 shrink-0 text-cyan-300" />;
        textColor = "text-cyan-200 font-bold";
        bgPulse = "bg-cyan-900/20 border-cyan-500/20";
    } else if (text.includes("골드 변경") || text.includes("골드")) {
        icon = <Coins className="w-3.5 h-3.5 shrink-0 text-yellow-400" />;
        textColor = "text-yellow-400";
    } else if (text.includes("체력 변경") || text.includes("회복") || text.includes("피해")) {
        if (text.includes("피해") || text.includes("-")) {
            icon = <Heart className="w-3.5 h-3.5 shrink-0 text-red-500" />;
            textColor = "text-red-400";
            bgPulse = "bg-red-900/20 border-red-500/20";
        } else {
            icon = <Heart className="w-3.5 h-3.5 shrink-0 text-green-500" />;
            textColor = "text-green-400";
            bgPulse = "bg-green-900/20 border-green-500/20";
        }
    } else if (text.includes("상태 효과") || text.includes("상태 이상")) {
        icon = <AlertCircle className="w-3.5 h-3.5 shrink-0 text-purple-400" />;
        textColor = "text-purple-300";
    } else if (text.includes("전투 시작") || text.includes("전투 종료")) {
        icon = <Swords className="w-3.5 h-3.5 shrink-0 text-red-400" />;
        textColor = "text-red-300 font-bold tracking-widest";
    } else if (text.includes("평판")) {
        icon = <ShieldPlus className="w-3.5 h-3.5 shrink-0 text-blue-400" />;
        textColor = "text-blue-300 font-bold";
        bgPulse = "bg-blue-900/20 border-blue-500/20";
    } else if (text.includes("스킬 습득")) {
        icon = <Book className="w-3.5 h-3.5 shrink-0 text-purple-400" />;
        textColor = "text-purple-300 font-bold";
        bgPulse = "bg-purple-900/20 border-purple-500/20";
    }

    return (
        <div className={`flex items-center gap-3 p-2 rounded-lg bg-gray-900/40 border border-transparent shadow-sm ${bgPulse}`}>
            <div className="bg-gray-800 p-1.5 rounded-md border border-white/5 opacity-90 shadow-inner">
                {icon}
            </div>
            <p className={`text-xs md:text-sm font-sans tracking-wide flex-1 ${textColor}`}>
                {text}
            </p>
        </div>
    );
};

const SystemMessageGroupComponent: React.FC<{ messages: string[] }> = ({ messages }) => (
    <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-6"
    >
        <div className="w-full max-w-3xl bg-bg-card/40 backdrop-blur-md border border-primary/20 py-4 px-5 shadow-lg relative rounded-2xl">
            <div className="absolute -top-3 left-6 bg-bg-deep px-3 py-0.5 rounded-full border border-primary/30 z-10 shadow-sm">
                <h4 className="font-sans font-bold text-[10px] md:text-xs text-primary flex items-center gap-2 uppercase tracking-[0.1em]"><Dices className="w-3 h-3 md:w-3.5 md:h-3.5" /> 게임 시스템</h4>
            </div>
            <div className="space-y-2 mt-2">
                {messages.map((text, idx) => (
                    <SystemMessageItem key={idx} text={text} />
                ))}
            </div>
        </div>
    </motion.div>
);

const UserActionDisplay: React.FC<{ text: string }> = ({ text }) => {
  return (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end my-6 w-full"
    >
        <div className="max-w-[85%] md:max-w-[70%]">
            <div className="px-5 py-3 text-[15px] md:text-[17px] text-accent bg-accent/10 border border-accent/20 rounded-2xl rounded-tr-sm italic text-right shadow-lg backdrop-blur-md relative group">
                <span className="block text-[9px] uppercase tracking-[0.2em] mb-1.5 opacity-60 not-italic font-bold font-sans">내 행동</span>
                {text}
            </div>
        </div>
    </motion.div>
  );
};

const getCharacterData = (name: string, character: Character | null, npcs: Record<string, Npc>): { imageUrl: string; isPlayer: boolean } => {
  if (character && character.name === name) {
    return { imageUrl: character.imageUrl || '', isPlayer: true };
  }
  const npc = Object.values(npcs).find(n => n.name === name);
  return { imageUrl: npc?.imageUrl || '', isPlayer: false };
};

const DialogueBlockComponent: React.FC<{ block: ContentBlock; character: Character | null, npcs: Record<string, Npc>, useImageGeneration: boolean }> = ({ block, character, npcs, useImageGeneration }) => {
  if (block.type !== 'dialogue') return null;

  const { imageUrl, isPlayer } = getCharacterData(block.characterName, character, npcs);
  const alignment = isPlayer ? 'justify-end' : 'justify-start';
  const bubbleColor = isPlayer ? 'bg-accent/15 border-accent/30 bg-gradient-to-bl from-accent/10 to-transparent shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'bg-black/60 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent shadow-[0_0_15px_rgba(212,175,55,0.1)]';
  const nameColor = isPlayer ? 'text-accent' : 'text-primary';
  const flexDirection = isPlayer ? 'flex-row-reverse' : 'flex-row';

  return (
    <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`flex items-start w-full ${alignment} my-8 group`}
    >
      <div className={`flex items-start gap-3 md:gap-5 max-w-[95%] md:max-w-[85%] ${flexDirection}`}>
        {useImageGeneration && (
          <div className="relative flex-shrink-0 mt-2">
              <div className="absolute -inset-1.5 bg-primary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {imageUrl ? (
                  <img src={imageUrl} alt={block.characterName} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl object-cover border border-white/10 shadow-xl relative z-10 transition-transform duration-300 group-hover:scale-105" />
              ) : (
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-bg-card flex items-center justify-center text-gray-500 font-adventure border border-white/10 text-xl md:text-2xl relative z-10 transition-transform duration-300 group-hover:scale-105 shadow-inner">
                      {block.characterName.substring(0, 1)}
                  </div>
              )}
              <div className={`absolute -bottom-1 ${isPlayer ? '-left-1' : '-right-1'} w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 border-bg-deep z-20 ${isPlayer ? 'bg-accent shadow-[0_0_10px_rgba(14,165,233,0.6)]' : 'bg-primary shadow-[0_0_10px_rgba(212,175,55,0.6)]'}`} />
          </div>
        )}
        <div className={`relative rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl border backdrop-blur-md transition-all duration-300 ${bubbleColor} hover:shadow-2xl hover:border-opacity-40`}>
          <div className={`flex items-center gap-2.5 mb-3 ${isPlayer ? 'justify-end' : 'justify-start'}`}>
            {!isPlayer && <span className="w-1.5 h-1.5 rounded-full bg-primary/60 blur-[1px]" />}
            <h3 className={`font-sans font-bold text-[11px] md:text-xs uppercase tracking-[0.2em] opacity-90 ${nameColor} drop-shadow-md`}>{block.characterName}</h3>
            {isPlayer && <span className="w-1.5 h-1.5 rounded-full bg-accent/60 blur-[1px]" />}
          </div>
          <p className="text-gray-200 text-[15px] md:text-[17px] leading-relaxed font-serif italic drop-shadow-sm opacity-95">"{block.dialogue}"</p>
        </div>
      </div>
    </motion.div>
  );
};

const CurrentScene: React.FC<CurrentSceneProps> = ({ part, subsequentLogs, character, npcs, useImageGeneration }) => {
  const { actions } = useGame();

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full pb-10">
      {/* Scene Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-primary font-adventure tracking-[0.3em] text-glow uppercase">
          {part.sceneTitle}
        </h2>
        <div className="h-0.5 w-48 mx-auto bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-3" />
      </motion.div>

      {/* Image Display */}
      <div className="relative mb-10">
        {part.isGeneratingVideo ? (
          <div className="w-full aspect-video bg-bg-card/50 border border-white/10 rounded-3xl flex flex-col items-center justify-center animate-pulse">
            <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin mb-6" />
            <p className="text-sm text-accent/80 uppercase tracking-[0.4em] font-adventure">Generating Video with Veo...</p>
            <p className="text-xs text-gray-500 mt-2">이 작업은 최대 몇 분이 소요될 수 있습니다.</p>
          </div>
        ) : part.videoUrl ? (
          <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group bg-black"
          >
            <video src={part.videoUrl} autoPlay loop controls playsInline className="w-full h-auto max-h-[600px] object-cover" />
          </motion.div>
        ) : part.isGeneratingImage ? (
          <div className="w-full aspect-video bg-bg-card/50 border border-white/10 rounded-3xl flex flex-col items-center justify-center animate-pulse">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
            <p className="text-sm text-primary/50 uppercase tracking-[0.4em] font-adventure">Visualizing Narrative...</p>
          </div>
        ) : part.imageUrl ? (
          <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group"
          >
            <img src={part.imageUrl} alt={part.sceneTitle} className="w-full h-auto max-h-[600px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/80 via-transparent to-transparent opacity-60 pointer-events-none" />
            
            <button
              onClick={() => actions.handleGenerateVideo(part.id, part.imagePrompt, part.imageUrl)}
              className="absolute bottom-4 right-4 bg-bg-deep/80 hover:bg-bg-deep border border-accent/30 text-accent font-bold py-2 px-4 rounded-full flex items-center gap-2 backdrop-blur-sm transition-all shadow-lg hover:shadow-accent/20 z-10"
              title="Veo 2 모델을 사용하여 동영상 생성 (API 키 필요)"
            >
              <Film className="w-4 h-4" />
              <span className="text-sm">동영상 생성</span>
            </button>
          </motion.div>
        ) : null}
      </div>

      {/* Description / Narration */}
      <div className="space-y-10 px-4">
        {part.contentBlocks && part.contentBlocks.length > 0 ? (
          <div className="space-y-8">
            {part.contentBlocks.map((block, idx) => {
              if (block.type === 'narration') {
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="markdown-body text-gray-200 leading-relaxed text-lg md:text-2xl font-serif relative py-4"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent rounded-full" />
                    <div className="pl-8">
                      <Markdown>{block.text}</Markdown>
                    </div>
                  </motion.div>
                );
              }
              if (block.type === 'dialogue') {
                return <DialogueBlockComponent key={idx} block={block} character={character} npcs={npcs} useImageGeneration={useImageGeneration} />;
              }
              return null;
            })}
          </div>
        ) : (
          <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="markdown-body text-gray-200 leading-relaxed text-lg md:text-2xl font-serif relative py-4"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent rounded-full" />
            <div className="pl-8">
              <Markdown>{part.text || ''}</Markdown>
            </div>
          </motion.div>
        )}
      </div>

      {/* Subsequent Logs (User Actions & System Messages since this scene) */}
      {subsequentLogs && subsequentLogs.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            {subsequentLogs.map((log) => {
               if (log.type === StoryPartType.USER) {
                   return <UserActionDisplay key={log.id} text={log.text} />;
               }
               if (log.type === StoryPartType.SYSTEM_MESSAGE) {
                   // For simplicity in CurrentScene, we can just wrap single system messages or we could group them.
                   // Actually grouping them is better visually, but for now rendering each is fine. Let's group them later or just use the group component for each.
                   return <SystemMessageGroupComponent key={log.id} messages={[log.text]} />;
               }
               // We might also have short AI actions or dialogues here if the AI didn't spawn a full scene
               if (log.type === StoryPartType.AI_SCENE) {
                  // Fallback if there's somehow another AI Scene (though slicing from the last one makes this impossible)
                  return null;
               }
               return null;
            })}
        </div>
      )}
    </div>
  );
};

export default CurrentScene;
