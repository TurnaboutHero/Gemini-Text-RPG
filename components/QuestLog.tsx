import React from 'react';
import { ChapterPlan } from '../types';
import { FaTimes, FaBullseye, FaCheckCircle, FaStream } from 'react-icons/fa';

interface QuestLogProps {
  plan: ChapterPlan;
  onClose: () => void;
}

const QuestLog: React.FC<QuestLogProps> = ({ plan, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gray-800/90 border border-yellow-500/30 rounded-lg shadow-lg shadow-yellow-500/20 p-6 text-gray-200 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="임무 일지 닫기"
        >
          <FaTimes className="h-6 w-6" />
        </button>

        <h1 className="text-3xl font-bold text-yellow-300 font-adventure tracking-wider text-center mb-2">
          {plan.chapterTitle}
        </h1>
        
        <div className="text-center text-gray-400 mb-6 border-b border-gray-700 pb-4">
          <h2 className="text-lg font-semibold flex items-center justify-center gap-2">
            <FaBullseye />
            최종 목표
          </h2>
          <p>{plan.overallGoal}</p>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          <h3 className="text-md font-semibold text-gray-300 flex items-center gap-2">
             <FaStream />
             진행 단계
          </h3>
          <ul className="space-y-3">
            {plan.plotPoints.map((point, index) => {
              const isCompleted = index < plan.currentPlotPointIndex;
              const isCurrent = index === plan.currentPlotPointIndex;
              
              return (
                <li key={index} className={`p-3 rounded-lg transition-all duration-300 ${isCurrent ? 'bg-cyan-900/50 border-l-4 border-cyan-400' : 'bg-gray-700/50'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isCompleted ? (
                        <FaCheckCircle className="text-green-400 w-5 h-5" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${isCurrent ? 'border-cyan-400 animate-pulse' : 'border-gray-500'}`} />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-bold ${isCurrent ? 'text-cyan-300' : 'text-gray-300'} ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {point.objective}
                      </h4>
                      <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                        {point.details}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuestLog;
