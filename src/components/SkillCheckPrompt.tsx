import React from 'react';
import { SkillCheck } from '../types';
import { Dices } from 'lucide-react';

interface SkillCheckPromptProps {
  skillCheck: SkillCheck;
  onRoll: () => void;
}

const SkillCheckPrompt: React.FC<SkillCheckPromptProps> = ({ skillCheck, onRoll }) => {
  return (
    <div className="w-full bg-gray-700/80 border-2 border-cyan-500 rounded-lg p-4 text-center fade-in">
      <h3 className="text-lg font-bold text-cyan-300 font-adventure tracking-wider">
        능력치 판정!
      </h3>
      <p className="text-gray-300 my-2">
        <span className="font-bold text-white">{skillCheck.ability}</span> 판정이 필요합니다. 
        성공하려면 난이도 <span className="font-bold text-white">{skillCheck.difficulty}</span> 이상이 나와야 합니다.
      </p>
      <button
        onClick={onRoll}
        className="mt-2 bg-cyan-600 text-white font-bold rounded-lg py-3 px-8 text-lg hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
      >
        <Dices className="w-5 h-5" />
        20면체 주사위 굴림
      </button>
    </div>
  );
};

export default SkillCheckPrompt;
