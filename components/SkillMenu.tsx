import React from 'react';
import { Skill } from '../types';
import { FaTimes, FaBolt, FaHourglassHalf } from 'react-icons/fa';

interface SkillMenuProps {
  skills: Skill[];
  characterMp: number;
  cooldowns: Record<string, number>;
  targetId: string | null;
  onUseSkill: (skill: Skill, targetId: string | null) => void;
  onClose: () => void;
}

const SkillMenu: React.FC<SkillMenuProps> = ({ skills, characterMp, cooldowns, targetId, onUseSkill, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-gray-800/90 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/20 p-6 text-gray-200 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="스킬 메뉴 닫기"
        >
          <FaTimes className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-blue-300 font-adventure tracking-wider text-center mb-6">스킬 사용</h2>

        <div className="flex-grow overflow-y-auto pr-2 space-y-3">
          {skills.length === 0 ? (
            <p className="text-center text-gray-500 italic mt-4">사용 가능한 스킬이 없습니다.</p>
          ) : (
            skills.map(skill => {
              const mpCost = skill.mpCost;
              const cooldown = cooldowns[skill.id] || 0;
              const hasEnoughMp = characterMp >= mpCost;
              const isOffCooldown = cooldown === 0;
              // Some skills might not need a target (e.g., self-heal)
              const needsTarget = skill.effect.toLowerCase().includes('damage');
              const isTargetSelected = !!targetId;
              const isUsable = hasEnoughMp && isOffCooldown && (!needsTarget || isTargetSelected);
              
              return (
                <button
                  key={skill.id}
                  onClick={() => onUseSkill(skill, targetId)}
                  disabled={!isUsable}
                  className="w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start gap-4 bg-gray-700/50 hover:bg-gray-700/80 disabled:bg-gray-700/30 disabled:cursor-not-allowed"
                >
                  <div className="flex-grow">
                    <h3 className={`font-bold ${isUsable ? 'text-gray-100' : 'text-gray-500'}`}>{skill.name}</h3>
                    <p className={`text-sm mt-1 ${isUsable ? 'text-gray-400' : 'text-gray-600'}`}>{skill.description}</p>
                    <div className="flex items-center gap-4 text-xs mt-2">
                        <div className={`flex items-center gap-1 ${hasEnoughMp ? 'text-blue-300' : 'text-red-400'}`}>
                            <FaBolt />
                            <span>{mpCost} MP</span>
                        </div>
                        {skill.cooldown > 0 && (
                            <div className={`flex items-center gap-1 ${isOffCooldown ? 'text-gray-400' : 'text-yellow-400'}`}>
                                <FaHourglassHalf />
                                <span>
                                    {isOffCooldown ? `${skill.cooldown}턴` : `${cooldown}턴 남음`}
                                </span>
                            </div>
                        )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillMenu;
