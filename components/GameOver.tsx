import React from 'react';

interface GameOverProps {
  onRestart: () => void;
  onNewGame: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ onRestart, onNewGame }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center fade-in">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold text-red-500 font-adventure tracking-wider mb-6">
          당신은 패배했습니다
        </h1>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-10">
          당신의 모험은 여기서 끝이 났습니다. 하지만 이야기는 끝나지 않습니다.
        </p>
        <div className="flex justify-center gap-4">
            <button
              onClick={onRestart}
              className="bg-cyan-600 text-white font-bold rounded-lg py-3 px-8 text-lg hover:bg-cyan-500 transition-all duration-300"
            >
              다시 도전하기
            </button>
            <button
              onClick={onNewGame}
              className="bg-gray-600 text-white font-bold rounded-lg py-3 px-8 text-lg hover:bg-gray-500 transition-all duration-300"
            >
              새로운 모험 시작
            </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
