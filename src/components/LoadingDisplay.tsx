import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingSpinner from './LoadingSpinner';

const TIPS = [
  "단서: 날씨가 좋지 않은 날에는 몬스터들이 더 흉폭해질 수 있습니다.",
  "단서: NPC와 자주 대화하여 좋은 관계를 유지하면 중요한 정보를 얻을 수도 있습니다.",
  "단서: '주변을 탐색한다'와 같은 구체적인 행동은 숨겨진 아이템을 발견할 확률을 높입니다.",
  "세계관: 아스테리아는 과거 찬란했던 마법 문명의 유적 위에 세워진 마을입니다.",
  "세계관: 별빛 숲 깊은 곳에는 아직 밝혀지지 않은 고대 마법사의 탑이 잠들어 있습니다.",
  "전투 팁: 불리한 전투에서는 도망치는 것도 훌륭한 전략입니다.",
  "활용 팁: 특수 행동 메뉴의 '환경 묘사'를 통해 생각지 못한 단서를 발견할 수 있습니다.",
];

interface LoadingDisplayProps {
  message?: string;
}

const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ message = '구상 중...' }) => {
  const [currentTip, setCurrentTip] = useState('');

  useEffect(() => {
    setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    
    // Change tip every 5 seconds if loading is long
    const interval = setInterval(() => {
        setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 space-y-4">
      <div className="relative">
          <LoadingSpinner />
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      </div>
      <p className="text-sm font-semibold text-primary animate-pulse tracking-wide text-center">
          {message}
      </p>
      
      <div className="max-w-xs text-center min-h-[40px] mt-2">
          <AnimatePresence mode="wait">
              <motion.p 
                key={currentTip}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.5 }}
                className="text-xs text-gray-400 font-medium"
              >
                {currentTip}
              </motion.p>
          </AnimatePresence>
      </div>
    </div>
  );
};

export default LoadingDisplay;
