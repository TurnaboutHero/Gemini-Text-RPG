import React, { useState } from 'react';
import { Character, CombatState } from '../types';
import { FaCrosshairs, FaUser, FaHeart, FaBolt, FaStar } from 'react-icons/fa';
import ResourceBar from './ResourceBar';
import LoadingSpinner from './LoadingSpinner';

interface CombatUIProps {
  character: Character;
  combatState: CombatState;
  onCombatAction: (actionText: string) => void;
  onOpenSkillMenu: () => void;
  onSetTarget: (targetId: string) => void;
  isLoading: boolean;
}

const CombatUI: React.FC<CombatUIProps> = ({ character, combatState, onCombatAction, onOpenSkillMenu, onSetTarget, isLoading }) => {
    const { enemies, combatLog, turn, playerTargetId } = combatState;
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && turn === 'player' && !isLoading) {
            onCombatAction(inputValue.trim());
            setInputValue('');
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col p-1 md:p-4 bg-gray-900/80 backdrop-blur-sm text-white rounded-lg border border-gray-700">
            {/* Enemy Area */}
            <div className="flex-grow grid grid-cols-3 gap-2 items-end">
                {enemies.map(enemy => (
                    <div 
                        key={enemy.id} 
                        id={enemy.id}
                        onClick={() => onSetTarget(enemy.id)}
                        className={`relative p-2 rounded-lg cursor-pointer transition-all duration-200 h-full flex flex-col justify-end ${playerTargetId === enemy.id ? 'bg-red-900/50 border-2 border-red-500' : 'bg-gray-800/50 border-2 border-transparent'}`}
                    >
                        {enemy.hp > 0 ? (
                            <>
                                {enemy.imageUrl ? (
                                    <img src={enemy.imageUrl} alt={enemy.name} className="h-24 md:h-32 w-full object-contain mx-auto mb-2 flex-grow" />
                                ) : (
                                    <div className="h-24 md:h-32 w-full flex items-center justify-center bg-gray-700/50 rounded-lg mb-2 flex-grow">
                                        <span className="text-gray-400 font-bold text-3xl">{enemy.name.substring(0, 1)}</span>
                                    </div>
                                )}
                                <h3 className="text-center font-bold text-xs md:text-sm truncate">{enemy.name}</h3>
                                <div className="relative mt-1">
                                    <ResourceBar current={enemy.hp} max={enemy.maxHp} color="bg-red-600" icon={<FaHeart size={10} />} />
                                </div>
                                {playerTargetId === enemy.id && <FaCrosshairs className="absolute top-2 right-2 text-red-500 text-xl md:text-2xl animate-pulse" />}
                            </>
                        ) : (
                             <>
                                {enemy.imageUrl ? (
                                    <img src={enemy.imageUrl} alt={enemy.name} className="h-24 md:h-32 w-full object-contain mx-auto mb-2 opacity-50 grayscale flex-grow" />
                                ) : (
                                    <div className="h-24 md:h-32 w-full flex items-center justify-center bg-gray-700/50 rounded-lg mb-2 opacity-50 grayscale flex-grow">
                                        <span className="text-gray-400 font-bold text-3xl">{enemy.name.substring(0, 1)}</span>
                                    </div>
                                )}
                                <h3 className="text-center font-bold text-xs md:text-sm text-gray-500 line-through truncate">{enemy.name}</h3>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Combat Log & Player Area */}
            <div className="flex-shrink-0 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/70 p-3 rounded-lg h-32 md:h-40 overflow-y-auto">
                    <ul className="text-sm space-y-1">
                        {combatLog.slice().reverse().map((log, index) => (
                            <li key={index} className="fade-in">{log}</li>
                        ))}
                    </ul>
                </div>
                
                <div className="flex flex-col justify-between bg-gray-800/70 p-3 rounded-lg">
                    <div className="flex items-center gap-4">
                         <div id="player-portrait" className="relative flex-shrink-0">
                            {character.imageUrl ? (
                                <img src={character.imageUrl} alt={character.name} className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-bold text-2xl border-2 border-cyan-500">
                                    {character.name.substring(0, 1)}
                                </div>
                            )}
                            <FaUser className="absolute -bottom-1 -right-1 bg-cyan-600 text-white rounded-full p-1 text-lg border-2 border-gray-800" />
                        </div>
                        <div className="w-full space-y-1">
                            <h2 className="text-lg font-bold">{character.name}</h2>
                            <ResourceBar current={character.hp} max={character.maxHp} color="bg-red-500" icon={<FaHeart size={10} />} />
                            <ResourceBar current={character.mp} max={character.maxMp} color="bg-blue-500" icon={<FaBolt size={10} />} />
                        </div>
                    </div>
                    
                     <div className="w-full flex items-center gap-2 mt-2">
                         <button
                            type="button"
                            onClick={onOpenSkillMenu}
                            disabled={turn !== 'player' || isLoading}
                            className="flex-shrink-0 w-12 h-12 bg-gray-700 text-blue-400 rounded-lg flex items-center justify-center hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="스킬 사용"
                          >
                            <FaStar className="w-6 h-6" />
                          </button>
                          <form onSubmit={handleSubmit} className="w-full flex-grow">
                            <div className="relative">
                              <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={turn !== 'player' || isLoading}
                                placeholder={turn === 'player' && !isLoading ? "어떻게 행동하시겠습니까?" : "적의 차례입니다..."}
                                className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg py-3 pl-4 pr-24 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-60 h-12"
                              />
                              <button
                                type="submit"
                                disabled={turn !== 'player' || isLoading}
                                className="absolute inset-y-0 right-0 flex items-center justify-center bg-cyan-600 text-white font-bold rounded-r-lg px-4 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                              >
                                {isLoading ? <LoadingSpinner /> : '행동'}
                              </button>
                            </div>
                          </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CombatUI;
