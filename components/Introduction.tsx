import React from 'react';

const LOCAL_STORAGE_KEY = 'gemini-text-adventure-state';

interface IntroductionProps {
  onStartCreation: () => void;
  onContinueGame: () => void;
  hasSavedGame: boolean;
}

const Introduction: React.FC<IntroductionProps> = ({ onStartCreation, onContinueGame, hasSavedGame }) => {
    
  const handleNewGameClick = () => {
    if (hasSavedGame) {
      if (window.confirm("새로운 게임을 시작하면 현재 진행 상황이 모두 사라집니다. 정말 시작하시겠습니까?")) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        onStartCreation();
      }
    } else {
      onStartCreation();
    }
  };
  
  const handleContinueClick = () => {
    onContinueGame();
  };

  return (
    <div className="relative min-h-screen animated-nebula flex flex-col items-center justify-center p-4 text-center overflow-hidden">
      <div className="relative z-10 w-full max-w-3xl fade-in">
        <h1 
            className="text-5xl md:text-7xl font-bold text-white font-adventure tracking-wider mb-4"
            style={{ textShadow: '0 0 20px rgba(173, 216, 230, 0.7), 0 0 8px rgba(255, 255, 255, 0.5)' }}
        >
          제미나이 연대기
        </h1>
        <p className="text-xl md:text-2xl font-bold text-cyan-200 font-adventure tracking-wider mb-8">
            무한의 서사
        </p>
        <p className="text-md md:text-lg text-gray-300 leading-relaxed mb-12 max-w-2xl mx-auto">
          AI 던전 마스터 '제미나이'가 실시간으로 엮어내는 당신만의 서사시. 끝없는 가능성의 세계에서 당신의 선택이 전설이 됩니다.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleContinueClick}
            disabled={!hasSavedGame}
            className="w-full sm:w-auto bg-cyan-600 text-white font-bold rounded-lg py-3 px-10 text-lg hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none"
          >
            모험 이어하기
          </button>
          <button
            onClick={handleNewGameClick}
            className="w-full sm:w-auto bg-transparent border-2 border-gray-500 text-gray-300 font-bold rounded-lg py-3 px-10 text-lg hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400 transition-all duration-300"
          >
            새로운 모험 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default Introduction;