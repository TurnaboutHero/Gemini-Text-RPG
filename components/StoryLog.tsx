import React, { useEffect, useRef } from 'react';
import { StoryLogEntry, StoryPartType, AiScenePart, ContentBlock, Character, Npc } from '../types';
import { FaDiceD20 } from "react-icons/fa";

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

const GameMasterMessageComponent: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex justify-center my-6 fade-in">
        <div className="w-full max-w-2xl bg-gradient-to-b from-gray-800 to-gray-800/80 border-t-2 border-b-2 border-yellow-600/50 py-4 px-6 shadow-md relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-800 px-2 rounded-full border border-yellow-600/50">
                <h4 className="font-adventure text-md text-yellow-400 flex items-center gap-2"><FaDiceD20 /> GM</h4>
            </div>
            <p className="text-gray-300 text-center italic pt-3">{text}</p>
        </div>
    </div>
);

const ThoughtBubbleComponent: React.FC<{ block: ContentBlock; character: Character | null, npcs: Record<string, Npc> }> = ({ block, character, npcs }) => {
    if (block.type !== 'dialogue') return null;

    const thoughtText = block.dialogue.slice(1, -1);
    const { imageUrl, isPlayer } = getCharacterData(block.characterName, character, npcs);
    const alignment = isPlayer ? 'justify-end' : 'justify-start';
    const flexDirection = isPlayer ? 'flex-row-reverse' : 'flex-row';
    const bubbleColor = 'bg-gray-700/90 border-gray-600'; // Thoughts are neutral color

    return (
        <div className={`flex items-start gap-3 w-full ${alignment} my-2`}>
            <div className={`flex items-start gap-3 max-w-xl ${flexDirection}`}>
                {imageUrl ? (
                    <img src={imageUrl} alt={block.characterName} className="w-10 h-10 rounded-full object-cover border-2 border-gray-500 flex-shrink-0" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-bold flex-shrink-0 border-2 border-gray-500">
                        {block.characterName.substring(0, 1)}
                    </div>
                )}
                <div className={`relative rounded-full px-4 py-3 shadow-lg border italic ${bubbleColor}`}>
                    <p className="text-gray-300 whitespace-pre-wrap">{thoughtText}</p>
                </div>
            </div>
        </div>
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
  const bubbleColor = isPlayer ? 'bg-cyan-800/80 border-cyan-700' : 'bg-gray-700/90 border-gray-600';
  const nameColor = isPlayer ? 'text-cyan-300' : 'text-purple-300';
  const flexDirection = isPlayer ? 'flex-row-reverse' : 'flex-row';

  return (
    <div className={`flex items-start gap-3 w-full ${alignment} my-2`}>
      <div className={`flex items-start gap-3 max-w-xl ${flexDirection}`}>
        {imageUrl ? (
            <img src={imageUrl} alt={block.characterName} className="w-10 h-10 rounded-full object-cover border-2 border-gray-500 flex-shrink-0" />
        ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-bold flex-shrink-0 border-2 border-gray-500">
                {block.characterName.substring(0, 1)}
            </div>
        )}
        <div className={`relative rounded-lg p-3 shadow-lg border ${bubbleColor}`}>
          <h3 className={`font-bold text-sm mb-1 ${nameColor}`}>{block.characterName}</h3>
          <p className="text-gray-200 whitespace-pre-wrap">{block.dialogue}</p>
        </div>
      </div>
    </div>
  );
};

const NarrationBlockComponent: React.FC<{ block: ContentBlock }> = ({ block }) => {
    if (block.type !== 'narration') return null;
    return (
        <div className="my-6 text-justify">
            <p className="font-adventure text-lg md:text-xl leading-relaxed text-gray-300 whitespace-pre-wrap p-4 bg-gray-800/20 border-l-4 border-cyan-900/70 italic">
                {block.text}
            </p>
        </div>
    );
};

const ActionBlockComponent: React.FC<{ block: ContentBlock }> = ({ block }) => {
    if (block.type !== 'action') return null;
    return (
      <div className="text-center my-4">
        <p className="font-bold text-purple-300 bg-purple-900/30 border border-purple-700 rounded-md py-2 px-4 inline-block">{block.text}</p>
      </div>
    );
};

const AiSceneDisplay: React.FC<{ part: AiScenePart, character: Character | null, npcs: Record<string, Npc> }> = ({ part, character, npcs }) => {
  return (
    <div className="fade-in my-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-cyan-300 font-adventure tracking-wider border-b-2 border-cyan-800/50 pb-3 mb-6">
          {part.sceneTitle}
        </h2>
      </div>
      {part.content.map((block, index) => {
        switch (block.type) {
            case 'narration': return <NarrationBlockComponent key={index} block={block} />;
            case 'dialogue': return <DialogueBlockComponent key={index} block={block} character={character} npcs={npcs} />;
            case 'action': return <ActionBlockComponent key={index} block={block} />;
            default: return null;
        }
      })}
    </div>
  );
};

// 사용자 행동을 표시하기 위한 새로운 컴포넌트
const UserActionDisplay: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex justify-end my-4 fade-in">
        <div className="max-w-xl">
            <p className="px-4 py-2 text-md text-cyan-200 bg-gray-700/60 border-2 border-gray-600 rounded-lg italic text-right">
                {text}
            </p>
        </div>
    </div>
  );
};

const StoryLog: React.FC<StoryLogProps> = ({ storyLog, character, npcs }) => {
  const endOfLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyLog]);

  return (
    <div className="flex-grow w-full space-y-2 overflow-y-auto p-1 md:p-2">
      {storyLog.map((part) => {
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
              <div key={part.id} className="fade-in">
                <DialogueBlockComponent block={userBlock} character={character} npcs={npcs} />
              </div>
            );
          } else {
            // 따옴표가 없으면 행동으로 간주
            return <UserActionDisplay key={part.id} text={part.text} />;
          }
        }
        if (part.type === StoryPartType.SYSTEM_MESSAGE) {
          return (
            <GameMasterMessageComponent key={part.id} text={part.text} />
          );
        }
        return null;
      })}
      <div ref={endOfLogRef} />
    </div>
  );
};

export default StoryLog;