import React from 'react';
import Markdown from 'react-markdown';
import { StoryLogEntry, StoryPartType, AiScenePart, ContentBlock, Character, Npc } from '../types';
import { Dices } from "lucide-react";
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

const SystemMessageGroupComponent: React.FC<{ messages: string[] }> = ({ messages }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-1"
    >
        <div className="w-full max-w-2xl bg-bg-card/10 backdrop-blur-sm border border-primary/5 py-1.5 px-3 shadow-lg relative group rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -top-2.5 left-4 bg-bg-deep px-2 py-0.5 rounded-full border border-primary/20 z-10">
                <h4 className="font-adventure text-[8px] text-primary/60 flex items-center gap-1.5 uppercase tracking-[0.2em] text-glow"><Dices className="w-2.5 h-2.5" /> System Log</h4>
            </div>
            <div className="space-y-0.5 mt-0.5">
                {messages.map((text, idx) => (
                    <p key={idx} className="text-gray-500 text-left italic text-[10px] md:text-xs font-serif leading-tight tracking-tight opacity-70">{text}</p>
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
  const bubbleColor = isPlayer ? 'bg-accent/10 border-accent/20' : 'bg-white/5 border-white/10';
  const nameColor = isPlayer ? 'text-accent' : 'text-primary';
  const flexDirection = isPlayer ? 'flex-row-reverse' : 'flex-row';

  return (
    <motion.div 
        initial={{ opacity: 0, x: isPlayer ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-start gap-1.5 w-full ${alignment} my-1 group`}
    >
      <div className={`flex items-start gap-1.5 max-w-[85%] ${flexDirection}`}>
        <div className="relative flex-shrink-0">
            {imageUrl ? (
                <img src={imageUrl} alt={block.characterName} className="w-6 h-6 rounded object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300" />
            ) : (
                <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-gray-400 font-bold border border-white/10 text-[9px]">
                    {block.characterName.substring(0, 1)}
                </div>
            )}
            {isPlayer && <div className="absolute -top-0.5 -right-0.5 bg-accent w-1.5 h-1.5 rounded-full border border-bg-deep" />}
        </div>
        <div className={`relative rounded-lg p-2 shadow-2xl border backdrop-blur-sm ${bubbleColor}`}>
          <h3 className={`font-adventure text-[8px] mb-0.5 uppercase tracking-[0.2em] opacity-90 ${nameColor} text-glow`}>{block.characterName}</h3>
          <p className="text-gray-100 text-xs md:text-sm leading-relaxed font-sans">{block.dialogue}</p>
          <div className={`absolute top-3 ${isPlayer ? '-right-1' : '-left-1'} w-1.5 h-1.5 ${bubbleColor} border-t border-l rotate-45`} />
        </div>
      </div>
    </motion.div>
  );
};

const AiSceneDisplay: React.FC<{ part: AiScenePart, character: Character | null, npcs: Record<string, Npc> }> = ({ part, character, npcs }) => {
  return (
    <div className="my-2 pt-0.5">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center relative mb-2"
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        <h2 className="relative inline-block px-3 bg-bg-deep text-sm md:text-base font-bold text-primary font-adventure tracking-[0.1em] text-glow uppercase">
          {part.sceneTitle}
        </h2>
      </motion.div>

      {/* Image Display */}
      {part.isGeneratingImage ? (
        <div className="w-full h-48 md:h-64 bg-bg-card/50 border border-white/5 rounded-xl flex flex-col items-center justify-center mb-4 animate-pulse">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
          <p className="text-[10px] text-primary/50 uppercase tracking-widest font-adventure">Visualizing Scene...</p>
        </div>
      ) : part.imageUrl ? (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mb-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group"
        >
          <img src={part.imageUrl} alt={part.sceneTitle} className="w-full h-auto max-h-[400px] object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/80 via-transparent to-transparent opacity-60" />
        </motion.div>
      ) : null}
      
      {part.contentBlocks && part.contentBlocks.length > 0 ? (
        <div className="space-y-2">
          {part.contentBlocks.map((block, idx) => {
            switch (block.type) {
              case 'narration':
                return <NarrationBlockComponent key={idx} block={block} />;
              case 'dialogue':
                return <DialogueBlockComponent key={idx} block={block} character={character} npcs={npcs} />;
              case 'action':
                return <ActionBlockComponent key={idx} block={block} />;
              default:
                return null;
            }
          })}
        </div>
      ) : (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="markdown-body text-gray-300 leading-relaxed space-y-4 text-sm md:text-base"
        >
          <Markdown>{part.text || ''}</Markdown>
        </motion.div>
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
