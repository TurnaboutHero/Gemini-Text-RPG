import React, { useState } from 'react';
import { Character, CombatState } from '../types';
import { Crosshair, User, Star, Briefcase } from 'lucide-react';
import ResourceBar from './ResourceBar';
import LoadingSpinner from './LoadingSpinner';

interface CombatUIProps {
  character: Character;
  combatState: CombatState;
  onCombatAction: (actionText: string) => void;
  onOpenSkillMenu: () => void;
  onOpenInventory: () => void;
  onSetTarget: (targetId: string) => void;
  isLoading: boolean;
}

const CombatUI: React.FC<CombatUIProps> = ({ character, combatState, onCombatAction, onOpenSkillMenu, onOpenInventory, onSetTarget, isLoading }) => {
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
        <div className="w-full h-full flex flex-col p-2 md:p-4 bg-bg-card/60 backdrop-blur-md text-gray-100 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            
            {/* Enemy Area */}
            <div className="flex-grow grid grid-cols-3 gap-1.5 items-end mb-2 relative z-10">
                {enemies.map(enemy => (
                    <div 
                        key={enemy.id} 
                        id={enemy.id}
                        onClick={() => onSetTarget(enemy.id)}
                        className={`relative p-1.5 rounded-lg cursor-pointer transition-all duration-300 h-full flex flex-col justify-end group ${playerTargetId === enemy.id ? 'bg-red-500/10 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
                    >
                        {enemy.hp > 0 ? (
                            <>
                                {enemy.imageUrl ? (
                                    <img src={enemy.imageUrl} alt={enemy.name} className={`h-20 md:h-28 w-full object-contain mx-auto mb-1.5 flex-grow group-hover:scale-105 transition-transform duration-500 ${enemy.isShaking ? 'animate-shake' : ''}`} />
                                ) : (
                                    <div className={`h-20 md:h-28 w-full flex items-center justify-center bg-bg-deep/50 rounded-lg mb-1.5 flex-grow border border-white/5 ${enemy.isShaking ? 'animate-shake' : ''}`}>
                                        <span className="text-gray-600 font-bold text-xl font-adventure">{enemy.name.substring(0, 1)}</span>
                                    </div>
                                )}
                                <h3 className="text-center font-adventure text-[9px] md:text-[10px] tracking-widest uppercase text-gray-300 truncate animate-flicker">{enemy.name}</h3>
                                <div className="relative mt-0.5">
                                    <ResourceBar current={enemy.hp} max={enemy.maxHp} color="bg-red-600" />
                                </div>
                                {enemy.statusEffects && enemy.statusEffects.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                                        {enemy.statusEffects.map((effect, idx) => (
                                            <span key={idx} className="text-[8px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-500/30">
                                                {effect}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {playerTargetId === enemy.id && <Crosshair className="absolute top-1 right-1 text-red-500 text-lg md:text-xl animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                            </>
                        ) : (
                             <>
                                {enemy.imageUrl ? (
                                    <img src={enemy.imageUrl} alt={enemy.name} className="h-20 md:h-28 w-full object-contain mx-auto mb-1.5 opacity-30 grayscale flex-grow" />
                                ) : (
                                    <div className="h-20 md:h-28 w-full flex items-center justify-center bg-bg-deep/50 rounded-lg mb-1.5 opacity-30 grayscale flex-grow border border-white/5">
                                        <span className="text-gray-700 font-bold text-xl font-adventure">{enemy.name.substring(0, 1)}</span>
                                    </div>
                                )}
                                <h3 className="text-center font-adventure text-[9px] md:text-[10px] text-gray-600 line-through truncate tracking-widest uppercase">{enemy.name}</h3>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Combat Log & Player Area */}
            <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-2 relative z-10">
                <div className="bg-bg-deep/50 border border-white/5 p-2 rounded-lg h-24 md:h-32 overflow-y-auto scrollbar-hide">
                    <ul className="text-[10px] font-mono space-y-0.5 text-gray-400">
                        {combatLog.slice().reverse().map((log, index) => (
                            <li key={index} className="border-l-2 border-primary/20 pl-1.5 py-0.5 leading-relaxed">
                                <span className="text-primary/60 mr-1">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                {log}
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="flex flex-col justify-between bg-bg-deep/50 border border-white/5 p-2 rounded-lg">
                    <div className="flex items-center gap-3">
                         <div id="player-portrait" className="relative flex-shrink-0 group">
                            {character.imageUrl ? (
                                <img src={character.imageUrl} alt={character.name} className="w-10 h-10 rounded-lg object-cover border-2 border-accent shadow-lg group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-lg border-2 border-accent">
                                    {character.name.substring(0, 1)}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 bg-accent text-bg-deep rounded-md p-0.5 text-[8px] border-2 border-bg-deep shadow-lg">
                                <User size={10} />
                            </div>
                        </div>
                        <div className="w-full space-y-0.5">
                            <h2 className="text-base font-adventure text-white tracking-widest uppercase text-glow animate-flicker">{character.name}</h2>
                            <div className="space-y-0.5">
                                <ResourceBar current={character.hp} max={character.maxHp} color="bg-red-500" />
                                <ResourceBar current={character.mp} max={character.maxMp} color="bg-accent" />
                            </div>
                            {character.statusEffects && character.statusEffects.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {character.statusEffects.map((effect, idx) => (
                                        <span key={idx} className="text-[8px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-500/30">
                                            {effect}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                     <div className="w-full flex items-center gap-1.5 mt-1.5">
                         <button
                            type="button"
                            onClick={onOpenSkillMenu}
                            disabled={turn !== 'player' || isLoading}
                            className="flex-shrink-0 w-8 h-8 bg-bg-card border border-primary/20 text-primary rounded-lg flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg group"
                            title="스킬 메뉴"
                          >
                            <Star className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            type="button"
                            onClick={onOpenInventory}
                            disabled={turn !== 'player' || isLoading}
                            className="flex-shrink-0 w-8 h-8 bg-bg-card border border-accent/20 text-accent rounded-lg flex items-center justify-center hover:bg-accent/10 hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg group"
                            title="아이템 사용"
                          >
                            <Briefcase className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <form onSubmit={handleSubmit} className="w-full flex-grow">
                            <div className="relative group">
                              <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={turn !== 'player' || isLoading}
                                placeholder={turn === 'player' && !isLoading ? "행동 입력..." : "적의 차례..."}
                                className="w-full bg-bg-card/60 border border-white/10 rounded-lg py-1.5 pl-3 pr-20 text-gray-100 text-xs placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-300 disabled:opacity-40 h-8 font-sans shadow-inner"
                              />
                              <button
                                type="submit"
                                disabled={turn !== 'player' || isLoading}
                                className="absolute inset-y-0.5 right-0.5 flex items-center justify-center bg-accent/20 text-accent border border-accent/30 font-adventure tracking-widest rounded-md px-3 hover:bg-accent/30 hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-300 disabled:bg-gray-800/50 disabled:text-gray-600 disabled:border-gray-700 disabled:cursor-not-allowed uppercase text-[8px]"
                              >
                                {isLoading ? <LoadingSpinner /> : 'Execute'}
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
