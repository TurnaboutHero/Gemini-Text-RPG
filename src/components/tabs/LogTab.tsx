import React from 'react';
import { History } from 'lucide-react';
import StoryLog from '../StoryLog';
import { GameState } from '../../types';

interface LogTabProps {
  gameState: GameState;
}

const LogTab: React.FC<LogTabProps> = ({ gameState }) => {
  return (
    <div className="flex flex-col h-full animate-fade-in space-y-4">
      <div className="flex items-center justify-between border-b border-primary/20 pb-2 mb-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          <History className="w-3 h-3" />
          전체 로그
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <StoryLog storyLog={gameState.storyLog} character={gameState.character} npcs={gameState.npcs} />
      </div>
    </div>
  );
};

export default LogTab;
