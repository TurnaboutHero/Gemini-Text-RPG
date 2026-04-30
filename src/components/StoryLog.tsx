import React from 'react';
import Markdown from 'react-markdown';
import { StoryLogEntry, StoryPartType, AiScenePart, ContentBlock, Character, Npc } from '../types';
import { Dices, Coins, ShieldPlus, Heart, Zap, ArrowUpCircle, AlertCircle, ShoppingBag, Swords, Book } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';

interface StoryLogProps {
  storyLog: StoryLogEntry[];
  character: Character | null;
  npcs: Record<string, Npc>;
}

const getCharacterData = (name: string, character: Character | null, npcs: Record<string, Npc>): { imageUrl: string; isPlayer: boolean } => {
  if (character && character.name === name) {
    return { imageUrl: character.imageUrl || '', isPlayer: true };
  }
  const npc = Object.values(npcs).find(n => n.name === name);
  return { imageUrl: npc?.imageUrl || '', isPlayer: false };
};

const SystemMessageItem: React.FC<{ text: string }> = ({ text }) => {
    // Parse the message to determine its type and add icon/color
    let icon = <Dices className="w-3 h-3 shrink-0" />;
    let textColor = "text-gray-400";
    let bgPulse = "";

    if (text.includes("아이템 획득") || text.includes("새로운 아이템")) {
        icon = <ShoppingBag className="w-3 h-3 shrink-0 text-yellow-300" />;
        textColor = "text-yellow-200";
        bgPulse = "bg-yellow-900/20 border-yellow-500/20";
    } else if (text.includes("경험치 획득") || text.includes("XP") || text.includes("레벨 업")) {
        icon = <ArrowUpCircle className="w-3 h-3 shrink-0 text-cyan-300" />;
        textColor = "text-cyan-200 font-bold";
        bgPulse = "bg-cyan-900/20 border-cyan-500/20";
    } else if (text.includes("골드 변경") || text.includes("골드")) {
        icon = <Coins className="w-3 h-3 shrink-0 text-yellow-400" />;
        textColor = "text-yellow-400";
    } else if (text.includes("체력 변경") || text.includes("회복") || text.includes("피해")) {
        if (text.includes("피해") || text.includes("-")) {
            icon = <Heart className="w-3 h-3 shrink-0 text-red-500" />;
            textColor = "text-red-400";
            bgPulse = "bg-red-900/20 border-red-500/20";
        } else {
            icon = <Heart className="w-3 h-3 shrink-0 text-green-500" />;
            textColor = "text-green-400";
            bgPulse = "bg-green-900/20 border-green-500/20";
        }
    } else if (text.includes("상태 효과") || text.includes("상태 이상")) {
        icon = <AlertCircle className="w-3 h-3 shrink-0 text-purple-400" />;
        textColor = "text-purple-300";
    } else if (text.includes("전투 시작") || text.includes("전투 종료")) {
        icon = <Swords className="w-3 h-3 shrink-0 text-red-400" />;
        textColor = "text-red-300 font-bold tracking-widest";
    } else if (text.includes("평판")) {
        icon = <ShieldPlus className="w-3 h-3 shrink-0 text-blue-400" />;
        textColor = "text-blue-300 font-bold";
        bgPulse = "bg-blue-900/20 border-blue-500/20";
    } else if (text.includes("스킬 습득")) {
        icon = <Book className="w-3 h-3 shrink-0 text-purple-400" />;
        textColor = "text-purple-300 font-bold";
        bgPulse = "bg-purple-900/20 border-purple-500/20";
    }

    return (
        <div className={`flex items-center gap-2 p-1.5 rounded bg-gray-900/40 border border-transparent ${bgPulse}`}>
            <div className="bg-gray-800/80 p-1 rounded border border-white/5 opacity-80 shadow-inner">
                {icon}
            </div>
            <p className={`text-[10px] md:text-[11px] font-sans leading-tight tracking-wide flex-1 ${textColor}`}>
                {text}
            </p>
        </div>
    );
};

const SystemMessageGroupComponent: React.FC<{ messages: string[] }> = ({ messages }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-1"
    >
        <div className="w-full max-w-2xl bg-bg-card/30 backdrop-blur-sm border border-primary/10 py-3 px-3 shadow-lg relative group rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-xl" />
            <div className="absolute -top-2.5 left-4 bg-bg-deep px-2.5 py-0.5 rounded-full border border-primary/20 z-10 shadow-sm shadow-primary/10">
                <h4 className="font-sans font-bold text-[9px] text-primary/70 flex items-center gap-1.5 uppercase tracking-[0.1em]"><Dices className="w-3 h-3" /> 시스템 로그</h4>
            </div>
            <div className="space-y-1 mt-1">
                {messages.map((text, idx) => (
                    <SystemMessageItem key={idx} text={text} />
                ))}
            </div>
        </div>
    </motion.div>
);

const ThoughtBubbleComponent: React.FC<{ block: ContentBlock; character: Character | null, npcs: Record<string, Npc> }> = ({ block, character, npcs }) => {
    if (block.type !== 'dialogue' && block.type !== 'thought') return null;

    const text = block.type === 'dialogue' ? block.dialogue.slice(1, -1) : block.text;
    const name = block.type === 'dialogue' ? block.characterName : (character?.name || 'Player');
    const { imageUrl, isPlayer } = getCharacterData(name, character, npcs);
    const alignment = isPlayer ? 'justify-end' : 'justify-start';
    const flexDirection = isPlayer ? 'flex-row-reverse' : 'flex-row';

    return (
        <motion.div 
            initial={{ opacity: 0, x: isPlayer ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-1.5 w-full ${alignment} my-1 group`}
        >
            <div className={`flex items-start gap-1.5 max-w-[85%] ${flexDirection}`}>
                <div className="relative flex-shrink-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt={name} className="w-5 h-5 rounded-full object-cover border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-gray-500 font-bold border border-white/10 text-[8px]">
                            {name.substring(0, 1)}
                        </div>
                    )}
                </div>
                <div className={`relative rounded-lg px-2 py-1 shadow-xl border border-white/10 bg-white/5 backdrop-blur-md italic`}>
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-serif">"{text}"</p>
                    <div className={`absolute top-2 ${isPlayer ? '-right-1' : '-left-1'} w-1.5 h-1.5 bg-white/5 border-t border-l border-white/10 rotate-45`} />
                </div>
            </div>
        </motion.div>
    );
};

const NarrationBlockComponent: React.FC<{ block: ContentBlock }> = ({ block }) => {
    if (block.type !== 'narration') return null;
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="markdown-body text-gray-300 leading-relaxed space-y-1.5 text-xs md:text-sm font-serif py-1 px-2 border-l border-primary/20 ml-1"
        >
            <Markdown>{block.text}</Markdown>
        </motion.div>
    );
};

const ActionBlockComponent: React.FC<{ block: ContentBlock }> = ({ block }) => {
    if (block.type !== 'action') return null;
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center my-1.5"
        >
            <div className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-full shadow-inner group hover:bg-primary/10 transition-colors duration-500">
                <p className="text-[9px] md:text-[10px] font-bold text-primary/80 tracking-[0.2em] flex items-center gap-1.5 text-glow">
                    <span className="w-1 h-1 rounded-full bg-primary/50 animate-ping" />
                    {block.text}
                    <span className="w-1 h-1 rounded-full bg-primary/50 animate-ping" />
                </p>
            </div>
        </motion.div>
    );
};

const DialogueBlockComponent: React.FC<{ block: ContentBlock; character: Character | null, npcs: Record<string, Npc> }> = ({ block, character, npcs }) => {
  if (block.type !== 'dialogue') return null;

  const isThought = block.dialogue.startsWith('(') && block.dialogue.endsWith(')');
  if (isThought) {
      return <ThoughtBubbleComponent block={block} character={character} npcs={npcs} />;
  }

  const { imageUrl, isPlayer } = getCharacterData(block.characterName, character, npcs);
  const alignment = isPlayer ? 'justify-end' : 'justify-start';
  const bubbleColor = isPlayer ? 'bg-accent/15 border-accent/30 bg-gradient-to-bl from-accent/10 to-transparent shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'bg-black/60 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent shadow-[0_0_15px_rgba(212,175,55,0.1)]';
  const nameColor = isPlayer ? 'text-accent' : 'text-primary';
  const flexDirection = isPlayer ? 'flex-row-reverse' : 'flex-row';

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`flex items-start w-full ${alignment} my-2 group`}
    >
      <div className={`flex items-start gap-2.5 max-w-[85%] ${flexDirection}`}>
        <div className="relative flex-shrink-0 mt-1">
            <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {imageUrl ? (
                <img src={imageUrl} alt={block.characterName} className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover border border-white/10 shadow-lg relative z-10 transition-transform duration-300 group-hover:scale-105" />
            ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-bg-card flex items-center justify-center text-gray-500 font-adventure border border-white/10 text-sm md:text-base relative z-10 transition-transform duration-300 group-hover:scale-105 shadow-inner">
                    {block.characterName.substring(0, 1)}
                </div>
            )}
            <div className={`absolute -bottom-0.5 ${isPlayer ? '-left-0.5' : '-right-0.5'} w-2.5 h-2.5 rounded-full border border-bg-deep z-20 ${isPlayer ? 'bg-accent' : 'bg-primary'}`} />
        </div>
        <div className={`relative rounded-xl md:rounded-2xl p-2.5 md:p-3.5 shadow-md border backdrop-blur-md transition-all duration-300 ${bubbleColor} hover:shadow-lg hover:border-opacity-40`}>
          <div className={`flex items-center gap-1.5 mb-1.5 ${isPlayer ? 'justify-end' : 'justify-start'}`}>
            <h3 className={`font-sans font-bold text-[9px] md:text-[10px] uppercase tracking-[0.1em] opacity-80 ${nameColor} drop-shadow-md`}>{block.characterName}</h3>
          </div>
          <p className="text-gray-200 text-xs md:text-sm leading-relaxed font-serif italic drop-shadow-sm opacity-95">"{block.dialogue}"</p>
        </div>
      </div>
    </motion.div>
  );
};

const AiSceneDisplay: React.FC<{ part: AiScenePart, character: Character | null, npcs: Record<string, Npc> }> = ({ part, character, npcs }) => {
  return (
    <div className="my-3 pl-2 border-l-2 border-primary/30 relative">
      <div className="absolute -left-1 top-0 w-2 h-2 rounded-full bg-primary/80 shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
      <h2 className="text-xs md:text-sm font-bold text-primary tracking-widest uppercase mb-1">
        {part.sceneTitle}
      </h2>

      {part.contentBlocks && part.contentBlocks.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {part.contentBlocks.map((block, idx) => {
            switch (block.type) {
              case 'narration':
                // Instead of a full block, don't show narration in the action log, or just a tiny snippet
                return null; 
              case 'dialogue':
                return null; // Dialogue is exclusively in DialogueTab now
              case 'action':
                return <ActionBlockComponent key={idx} block={block} />;
              default:
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
};

const UserActionDisplay: React.FC<{ text: string }> = ({ text }) => {
  return (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end my-2"
    >
        <div className="max-w-xl">
            <div className="px-4 py-1.5 text-xs md:text-sm text-accent bg-accent/5 border border-accent/10 rounded-xl italic text-right shadow-lg backdrop-blur-sm relative group">
                <div className="absolute top-0 right-0 w-0.5 h-full bg-accent/20 rounded-r-xl" />
                <span className="block text-[8px] uppercase tracking-[0.3em] mb-0.5 opacity-60 not-italic text-glow">Your Action</span>
                {text}
            </div>
        </div>
    </motion.div>
  );
};

const StoryLog: React.FC<StoryLogProps> = ({ storyLog, character, npcs }) => {

  // Group consecutive system messages
  const groupedLog: (StoryLogEntry | { type: 'SYSTEM_GROUP', messages: string[], id: string })[] = [];
  storyLog.forEach(part => {
    const last = groupedLog[groupedLog.length - 1];
    if (part.type === StoryPartType.SYSTEM_MESSAGE) {
      if (last && last.type === 'SYSTEM_GROUP') {
        last.messages.push(part.text);
      } else {
        groupedLog.push({ type: 'SYSTEM_GROUP', messages: [part.text], id: part.id });
      }
    } else {
      groupedLog.push(part);
    }
  });

  return (
    <div className="flex-grow w-full space-y-2 p-1 md:p-2">
      <AnimatePresence initial={false}>
        {groupedLog.map((part) => {
          if (part.type === StoryPartType.AI_SCENE) {
            return <AiSceneDisplay key={part.id} part={part} character={character} npcs={npcs} />;
          }
          if (part.type === StoryPartType.USER) {
            // 사용자의 입력이 따옴표로 묶여 있는지 확인하여 대화와 행동을 구분
            const isDialogue = part.text.startsWith('"') && part.text.endsWith('"');
            
            if (isDialogue) {
              const userBlock: ContentBlock = { 
                type: 'dialogue', 
                characterName: character?.name || 'Player', 
                dialogue: part.text.slice(1, -1) // 따옴표 제거
              };
              return (
                <div key={part.id}>
                  <DialogueBlockComponent block={userBlock} character={character} npcs={npcs} />
                </div>
              );
            } else {
              // 따옴표가 없으면 행동으로 간주
              return <UserActionDisplay key={part.id} text={part.text} />;
            }
          }
          if (part.type === 'SYSTEM_GROUP') {
            return (
              <SystemMessageGroupComponent key={part.id} messages={part.messages} />
            );
          }
          return null;
        })}
      </AnimatePresence>
    </div>
  );
};

export default StoryLog;
