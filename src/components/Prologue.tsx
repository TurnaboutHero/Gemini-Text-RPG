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
    <div className="relative min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      
      {/* Background Image */}
      {prologue.imageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20 grayscale"
          style={{ backgroundImage: `url(${prologue.imageUrl})` }}
        />
      )}

      {prologue.isGeneratingImage && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-deep/80 backdrop-blur-sm">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-primary animate-pulse font-adventure tracking-widest uppercase">Drawing the scene...</p>
        </div>
      )}

      {/* Content */}
      <div className={`relative z-20 w-full max-w-2xl mx-auto transition-opacity duration-1000 ease-in-out flex flex-col items-center justify-center text-center ${prologue.isGeneratingImage ? 'opacity-0' : 'opacity-100'}`}>
        
        <div className="w-full bg-bg-card/40 backdrop-blur-md p-6 md:p-10 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />
            
            <h1 className="text-3xl md:text-5xl font-bold text-white font-adventure tracking-[0.2em] mb-6 text-glow uppercase">
                {chapterPlan.chapterTitle}
            </h1>
            <div className="flex items-center justify-center">
                <p className="font-adventure text-lg md:text-2xl leading-relaxed text-primary/90 whitespace-pre-wrap tracking-wider uppercase opacity-80">
                    {chapterPlan.overallGoal}
                </p>
            </div>
        </div>

        <div className="mt-10 animate-fade-in">
            <button
                onClick={onContinue}
                className="bg-primary/10 border border-primary/30 text-primary font-adventure tracking-[0.4em] rounded-xl py-3 px-10 text-xl hover:bg-primary/20 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(212,175,55,0.1)] group"
            >
                <span className="group-hover:text-glow transition-all">BEGIN ADVENTURE</span>
            </button>
        </div>
      </div>

       {/* Character Info Overlay */}
       <div className="absolute bottom-6 left-6 z-30 animate-fade-in">
          <div className="flex gap-4 items-center bg-bg-card/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl group">
              {character.imageUrl ? (
                  <img src={character.imageUrl} alt={character.name} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-white/10 group-hover:scale-105 transition-transform duration-500"/>
              ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-2xl border-2 border-white/10">
                      {character.name.substring(0, 1)}
                  </div>
              )}
              <div className="space-y-0.5">
                  <p className="text-lg font-adventure text-primary tracking-widest uppercase text-glow">{character.name}</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{character.race} {character.class}</p>
              </div>
          </div>
       </div>
    </div>
  );
};

export default Prologue;