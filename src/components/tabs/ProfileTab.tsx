import React from 'react';
import { User, Search } from 'lucide-react';
import { motion } from 'motion/react';
import ResourceBar from '../ResourceBar';
import { GameState } from '../../types';

interface ProfileTabProps {
  gameState: GameState;
  onOpenCharacterSheet: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ gameState, onOpenCharacterSheet }) => {
  if (!gameState.character) return null;

  return (
    <div className="flex flex-col h-full animate-fade-in space-y-8">
      <div className="flex items-center justify-between border-b border-primary/20 pb-2 mb-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          <User className="w-3 h-3" />
          캐릭터 프로필
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-10">
        <div className="flex flex-col items-center space-y-4 py-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl -z-10" />
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-2 border-primary/30 p-1.5 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-bg-deep border border-white/10 shadow-inner">
                {gameState.character.imageUrl ? <img src={gameState.character.imageUrl} className="w-full h-full object-cover" /> : <User className="w-14 h-14 text-gray-700 m-7" />}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-bg-deep text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-bg-deep">
              LV.{gameState.character.level}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-adventure text-primary tracking-[0.2em] uppercase text-glow">{gameState.character.name}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold mt-1">{gameState.character.race} {gameState.character.class}</p>
            <p className="text-[10px] text-primary/40 uppercase tracking-widest mt-2 italic">{gameState.character.background}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-gray-500"><span>HP</span><span>{gameState.character.hp}/{gameState.character.maxHp}</span></div>
              <ResourceBar current={gameState.character.hp} max={gameState.character.maxHp} color="bg-red-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-gray-500"><span>MP</span><span>{gameState.character.mp}/{gameState.character.maxMp}</span></div>
              <ResourceBar current={gameState.character.mp} max={gameState.character.maxMp} color="bg-accent" />
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 shadow-inner">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">능력치</h4>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(gameState.character.abilityScores).map(([stat, val]) => (
                <div key={stat} className="bg-bg-deep/50 rounded-xl p-3 text-center border border-white/5 hover:border-primary/20 transition-colors group">
                  <div className="text-[9px] uppercase text-gray-500 font-bold tracking-tighter group-hover:text-primary/60 transition-colors">{stat}</div>
                  <div className="text-lg font-adventure text-primary group-hover:scale-110 transition-transform">{val as number}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">보유 기술</h4>
            <div className="grid grid-cols-1 gap-2">
              {gameState.character.skills.map(skill => (
                <div key={skill.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center group hover:bg-white/10 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-200">{skill.name}</span>
                    <span className="text-[9px] text-gray-500 line-clamp-1">{skill.description}</span>
                  </div>
                  <div className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">
                    {skill.mpCost} MP
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={onOpenCharacterSheet}
              className="w-full py-3 bg-primary/10 border border-primary/30 rounded-xl text-xs font-bold text-primary hover:bg-primary/20 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              상세 정보 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
