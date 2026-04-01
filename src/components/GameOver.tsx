import React from 'react';

interface GameOverProps {
  onRestart: () => void;
  onNewGame: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ onRestart, onNewGame }) => {
  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4 text-center animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-red-500/5 pointer-events-none" />
      
      <div className="w-full max-w-xl relative z-10">
        <div className="mb-8 relative inline-block">
            <div className="absolute -inset-8 bg-red-500/10 blur-3xl rounded-full animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-bold text-red-500 font-adventure tracking-[0.2em] mb-2 text-glow uppercase">
              DEFEATED
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent mt-2" />
        </div>
        
        <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-lg mx-auto font-sans tracking-wide">
          당신의 모험은 여기서 끝이 났습니다.<br/>
          <span className="text-red-400/80">하지만 전설은 아직 끝나지 않았습니다.</span>
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onRestart}
              className="bg-red-500/10 border border-red-500/30 text-red-400 font-adventure tracking-widest rounded-xl py-3 px-10 text-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.1)] group"
            >
              <span className="group-hover:text-glow transition-all">RETRY</span>
            </button>
            <button
              onClick={onNewGame}
              className="bg-transparent border border-white/10 text-gray-500 font-adventure tracking-widest rounded-xl py-3 px-10 text-lg hover:bg-white/5 hover:text-white hover:border-white/30 transition-all duration-300 transform hover:scale-105"
            >
              NEW ADVENTURE
            </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
