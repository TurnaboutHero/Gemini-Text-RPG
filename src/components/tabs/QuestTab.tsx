import React from 'react';
import { ScrollText, Search } from 'lucide-react';
import { GameState } from '../../types';

interface QuestTabProps {
  gameState: GameState;
}

const QuestTab: React.FC<QuestTabProps> = ({ gameState }) => {
  return (
    <div className="flex flex-col h-full animate-fade-in space-y-6">
      <div className="flex items-center justify-between border-b border-primary/20 pb-2 mb-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          <ScrollText className="w-3 h-3" />
          퀘스트 기록
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Search className="w-3 h-3" />
            현재 목표
          </h4>
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 italic text-sm text-gray-200 leading-relaxed relative shadow-inner">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 rounded-l-xl" />
            {gameState.currentChapterPlan?.plotPoints[gameState.currentChapterPlan.currentPlotPointIndex]?.objective || "정보를 수집하세요."}
            <p className="text-[10px] text-gray-500 not-italic mt-2 opacity-60">
              {gameState.currentChapterPlan?.plotPoints[gameState.currentChapterPlan.currentPlotPointIndex]?.details}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">여정의 발자취</h4>
          <div className="space-y-4 relative">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-primary/10" />
            {gameState.currentChapterPlan?.plotPoints.slice(0, gameState.currentChapterPlan.currentPlotPointIndex + 1).map((point, idx) => (
              <div key={idx} className="flex gap-4 items-start relative z-10">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 bg-bg-deep ${idx === gameState.currentChapterPlan?.currentPlotPointIndex ? 'border-primary shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'border-gray-700'}`}>
                  {idx < gameState.currentChapterPlan!.currentPlotPointIndex ? <span className="text-[8px] text-green-500 font-bold">✓</span> : <span className="text-[8px] text-primary">{idx + 1}</span>}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${idx === gameState.currentChapterPlan?.currentPlotPointIndex ? 'text-primary' : 'text-gray-500'}`}>{point.objective}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{point.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestTab;
