import React from 'react';
import { Character, AiScenePart, ChapterPlan } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface PrologueProps {
  character: Character;
  prologue: AiScenePart;
  chapterPlan: ChapterPlan;
  onContinue: () => void;
}

const Prologue: React.FC<PrologueProps> = ({ character, prologue, chapterPlan, onContinue }) => {
  return (
    <div className="relative min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      
      {/* Background Image */}
      {prologue.imageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${prologue.imageUrl})` }}
        />
      )}

      {prologue.isGeneratingImage && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/80">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-gray-300 animate-pulse">모험의 배경을 그리는 중...</p>
        </div>
      )}

      {/* Content */}
      <div className={`relative z-20 w-full max-w-3xl mx-auto transition-opacity duration-1000 ease-in-out flex flex-col items-center justify-center text-center ${prologue.isGeneratingImage ? 'opacity-0' : 'opacity-100'}`}>
        
        <div className="w-full bg-gray-900/70 backdrop-blur-sm p-8 md:p-12 rounded-xl border border-gray-700 shadow-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-cyan-400 font-adventure tracking-wider mb-8 drop-shadow-lg">
                {chapterPlan.chapterTitle}
            </h1>
            <div className="flex items-center justify-center">
                <p className="font-adventure text-xl md:text-3xl leading-relaxed text-gray-200 whitespace-pre-wrap drop-shadow-md">
                    {chapterPlan.overallGoal}
                </p>
            </div>
        </div>

        <div className="mt-12 fade-in">
            <button
                onClick={onContinue}
                className="bg-cyan-600/90 backdrop-blur-sm text-white font-bold rounded-lg py-4 px-12 text-xl hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300 animate-pulse-glow border border-cyan-400/50 shadow-lg shadow-cyan-900/50"
            >
                모험 시작하기
            </button>
        </div>
      </div>

       {/* Character Info Overlay */}
       <div className="absolute bottom-4 left-4 z-30 fade-in">
          <div className="flex gap-4 items-center bg-gray-900/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 shadow-lg">
              {character.imageUrl ? (
                  <img src={character.imageUrl} alt={character.name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-gray-500"/>
              ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-bold text-2xl border-2 border-gray-500">
                      {character.name.substring(0, 1)}
                  </div>
              )}
              <div>
                  <p className="text-lg font-bold text-cyan-300 drop-shadow-md">{character.name}</p>
                  <p className="text-sm text-gray-400 drop-shadow-md">{character.race} {character.class}</p>
              </div>
          </div>
       </div>
    </div>
  );
};

export default Prologue;