import React, { useState } from 'react';
import { Character, Item, ItemSlot, StatEffect, Ability } from '../types';
import { ABILITIES } from '../dndData';
import { FaCoins } from 'react-icons/fa';
import Inventory from './Inventory';

type CalculatedStats = {
    [key in StatEffect]: number;
} & {
    equipmentEffects: Partial<Record<StatEffect, number>>;
};

interface CharacterSheetProps {
  character: Character;
  calculatedStats: CalculatedStats | null;
  onClose: () => void;
  onNewGame: () => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: ItemSlot) => void;
}

const ProgressBar: React.FC<{ value: number; max: number; label: string; color: string }> = ({ value, max, label, color }) => (
    <div>
        <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-bold text-gray-300">{label}</span>
            <span className="font-mono">{value} / {max}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${(value / max) * 100}%` }}></div>
        </div>
    </div>
);

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, calculatedStats, onClose, onNewGame, onEquipItem, onUnequipItem }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory'>('stats');

  const renderStat = (ability: Ability) => {
    const baseScore = character.abilityScores[ability] || 10;
    const finalScore = calculatedStats?.[ability] || baseScore;
    const modifier = Math.floor((finalScore - 10) / 2);
    const modifierString = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    const bonus = finalScore - baseScore;

    return (
        <div key={ability} className="bg-gray-700/50 p-2 rounded-lg flex flex-col justify-center items-center">
            <div className="text-sm text-gray-400">{ability}</div>
            <div className="text-2xl font-bold text-white">{finalScore}</div>
            <div className="text-md font-bold text-cyan-400">({modifierString})</div>
            {bonus !== 0 && <div className={`text-xs ${bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>{baseScore} {bonus > 0 ? `+${bonus}` : bonus}</div>}
        </div>
    );
  };
  
  const renderDerivedStat = (label: string, value: number, baseValue: number) => {
    const bonus = value - baseValue;
     return (
        <div className="bg-gray-700/50 p-2 rounded-lg">
            <div className="text-sm text-center text-gray-400">{label}</div>
            <div className="text-2xl text-center font-bold text-white">{value}</div>
            {bonus !== 0 && <div className={`text-xs text-center ${bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>{baseValue} {bonus > 0 ? `+${bonus}` : bonus}</div>}
        </div>
     )
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-gray-800/90 border border-cyan-500/30 rounded-lg shadow-lg shadow-cyan-500/20 p-6 text-gray-200 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="캐릭터 시트 닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-4 text-center">
          <div className="relative">
              {character.imageUrl ? (
                <img 
                  src={character.imageUrl} 
                  alt={character.name} 
                  className="w-28 h-28 rounded-full object-cover border-4 border-gray-600 shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-cyan-800 flex items-center justify-center border-4 border-gray-600 shadow-lg">
                  <span className="text-5xl font-adventure text-cyan-200">{character.name.substring(0, 1)}</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-gray-800">
                  {character.level}
              </div>
          </div>
          <h1 className="text-3xl font-bold text-white font-adventure tracking-wider mt-3">{character.name}</h1>
          <p className="text-md text-gray-400">{character.race} {character.class}</p>
          <div className="flex items-center gap-2 mt-1 text-yellow-400">
            <FaCoins />
            <span className="font-bold">{character.gold} G</span>
          </div>
        </div>

        {/* HP and XP Bars */}
        <div className="space-y-3 mb-4">
            <ProgressBar value={character.hp} max={calculatedStats?.maxHp || character.maxHp} label="체력" color="bg-red-500" />
            <ProgressBar value={character.mp} max={calculatedStats?.maxMp || character.maxMp} label="마나" color="bg-blue-500" />
            <ProgressBar value={character.xp} max={character.xpToNextLevel} label="경험치" color="bg-yellow-500" />
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-4">
            <button onClick={() => setActiveTab('stats')} className={`flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'stats' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>능력치</button>
            <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'inventory' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>장비/소지품</button>
        </div>

        {/* Tab Content */}
        <div className="flex-grow overflow-y-auto pr-2">
            {activeTab === 'stats' && calculatedStats && (
                <div className="fade-in space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {ABILITIES.map(ability => renderStat(ability))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {renderDerivedStat("공격력", calculatedStats.attack, Math.floor((character.abilityScores['힘'] - 10) / 2))}
                    {renderDerivedStat("방어력", calculatedStats.defense, 10 + Math.floor((character.abilityScores['민첩'] - 10) / 2))}
                  </div>
                   {character.statusEffects.length > 0 && (
                     <div>
                        <h3 className="text-sm font-bold text-cyan-300 mb-1">상태 효과</h3>
                        <div className="flex flex-wrap gap-2">
                            {character.statusEffects.map(effect => (
                                <span key={effect} className="bg-red-900/80 text-red-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">{effect}</span>
                            ))}
                        </div>
                     </div>
                   )}
                </div>
            )}
            {activeTab === 'inventory' && (
                <div className="fade-in">
                  <Inventory 
                    character={character} 
                    onEquipItem={onEquipItem} 
                    onUnequipItem={onUnequipItem} 
                  />
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center border-t border-gray-700 pt-4">
            <button
                onClick={onNewGame}
                className="bg-red-800 text-white font-bold rounded-lg py-2 px-6 text-sm hover:bg-red-700 transition-colors"
            >
                새로운 모험 시작하기
            </button>
        </div>

      </div>
    </div>
  );
};

export default CharacterSheet;