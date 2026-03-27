import React, { useState, useEffect } from 'react';
import { Character, AiScenePart, ChapterPlan } from '../types';
import LoadingSpinner from './LoadingSpinner';

const useTypewriter = (text: string, speed = 50, enabled = true) => {
    const [displayText, setDisplayText] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (!text || !enabled) {
            setDisplayText(text);
            setIsFinished(true);
            return;
        }
        
        let i = 0;
        setDisplayText('');
        setIsFinished(false);
        
        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(intervalId);
                setIsFinished(true);
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed, enabled]);

    const skip = () => {
        setDisplayText(text);
        setIsFinished(true);
    };

    return { displayText, isFinished, skip };
};

interface PrologueProps {
  character: Character;
  prologue: AiScenePart;
  chapterPlan: ChapterPlan;
  onContinue: () => void;
}

const Prologue: React.FC<PrologueProps> = ({ character, prologue, chapterPlan, onContinue }) => {
  const prologueText = `새로운 모험이 시작됩니다.\n\n당신의 목표: ${chapterPlan.overallGoal}`;
  const { displayText, isFinished, skip } = useTypewriter(prologueText, 40, !prologue.isGeneratingImage);

  return (
    <div className="relative min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      
      {prologue.isGeneratingImage && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/80">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-gray-300 animate-pulse">모험의 배경을 그리는 중...</p>
        </div>
      )}

      {/* Content */}
      <div className={`relative z-20 w-full max-w-3xl mx-auto transition-opacity duration-1000 ease-in-out flex flex-col items-center justify-center text-center ${prologue.isGeneratingImage ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Image Area */}
        {prologue.imageUrl && (
          <div className="w-full max-w-2xl aspect-video mb-8 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl shadow-cyan-900/20">
            <img
              src={prologue.imageUrl}
              alt={prologue.imagePrompt}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div 
            className="w-full bg-gray-800/80 p-6 md:p-10 rounded-lg border border-gray-700 shadow-xl"
            onClick={!isFinished ? skip : undefined}
            style={{ cursor: !isFinished ? 'pointer' : 'default' }}
        >
            <h1 className="text-3xl md:text-5xl font-bold text-cyan-400 font-adventure tracking-wider mb-6">
                {chapterPlan.chapterTitle}
            </h1>
            <div className="min-h-[100px] flex items-center justify-center">
                <p className="font-adventure text-lg md:text-2xl leading-relaxed text-gray-200 whitespace-pre-wrap">
                    {displayText}
                    {!isFinished && <span className="inline-block w-2 h-6 md:w-3 md:h-8 bg-gray-200 ml-1 animate-pulse" aria-hidden="true"></span>}
                </p>
            </div>
        </div>

        {isFinished && (
            <div className="mt-10 fade-in">
                <button
                    onClick={onContinue}
                    className="bg-cyan-600 text-white font-bold rounded-lg py-4 px-12 text-xl hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300 animate-pulse-glow"
                >
                    모험 시작하기
                </button>
            </div>
        )}
      </div>

       {/* Character Info Overlay */}
       <div className="absolute bottom-4 left-4 z-30 fade-in">
          <div className="flex gap-4 items-center bg-gray-800/80 p-3 rounded-lg border border-gray-700">
              {character.imageUrl ? (
                  <img src={character.imageUrl} alt={character.name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-gray-500"/>
              ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-bold text-2xl border-2 border-gray-500">
                      {character.name.substring(0, 1)}
                  </div>
              )}
              <div>
                  <p className="text-lg font-bold text-cyan-300">{character.name}</p>
                  <p className="text-sm text-gray-400">{character.race} {character.class}</p>
              </div>
          </div>
       </div>
    </div>
  );
};

export default Prologue;