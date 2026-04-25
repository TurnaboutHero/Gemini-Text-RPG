import React from 'react';
import Markdown from 'react-markdown';
import { AiScenePart, Character, Npc, ContentBlock } from '../types';
import { motion } from 'motion/react';
import { useGame } from '../contexts/GameContext';
import { Film } from 'lucide-react';

interface CurrentSceneProps {
  part: AiScenePart;
  character: Character | null;
  npcs: Record<string, Npc>;
  useImageGeneration: boolean;
}

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
  const bubbleColor = isPlayer ? 'bg-accent/5 border-accent/20' : 'bg-primary/5 border-primary/20';
  const nameColor = isPlayer ? 'text-accent' : 'text-primary';
  const flexDirection = isPlayer ? 'flex-row-reverse' : 'flex-row';

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`flex items-start gap-4 w-full ${alignment} my-6`}
    >
      <div className={`flex items-start gap-4 max-w-[90%] ${flexDirection}`}>
        {useImageGeneration && (
          <div className="relative flex-shrink-0 mt-1">
              <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              {imageUrl ? (
                  <img src={imageUrl} alt={block.characterName} className="w-14 h-14 md:w-20 md:h-20 rounded-2xl object-cover border border-white/10 shadow-2xl relative z-10" />
              ) : (
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-bg-card flex items-center justify-center text-gray-500 font-adventure border border-white/10 text-xl relative z-10">
                      {block.characterName.substring(0, 1)}
                  </div>
              )}
              <div className={`absolute -bottom-1 ${isPlayer ? '-left-1' : '-right-1'} w-4 h-4 rounded-full border-2 border-bg-deep z-20 ${isPlayer ? 'bg-accent shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]'}`} />
          </div>
        )}
        <div className={`relative rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] border backdrop-blur-md ${bubbleColor}`}>
          <div className={`flex items-center gap-2 mb-2 ${isPlayer ? 'justify-end' : 'justify-start'}`}>
            {!isPlayer && <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />}
            <h3 className={`font-adventure text-[10px] uppercase tracking-[0.3em] opacity-80 ${nameColor} text-glow`}>{block.characterName}</h3>
            {isPlayer && <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />}
          </div>
          <p className="text-gray-100 text-base md:text-lg leading-relaxed font-serif italic opacity-90">"{block.dialogue}"</p>
        </div>
      </div>
    </motion.div>
  );
};

const CurrentScene: React.FC<CurrentSceneProps> = ({ part, character, npcs, useImageGeneration }) => {
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
    </div>
  );
};

export default CurrentScene;
