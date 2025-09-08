

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GameState, StoryLogEntry, UserStoryPart, AiScenePart, StoryPartType, Character, SystemMessagePart, Ability, Item, ChapterPlan, Npc, SpecialAction, WorldMap, CombatState, Enemy, UiEffect, Skill, StatEffect, ItemSlot, SpecialActionType } from './types';
import { generateInitialImage, editImage, generateCharacterImage } from './services/geminiService';
import * as orchestrator from './services/orchestratorService';
import StoryLog from './components/StoryLog';
import ActionInput from './components/ActionInput';
import CharacterCreator from './components/CharacterCreator';
import SuggestedActions from './components/SuggestedActions';
import Introduction from './components/Introduction';
import Prologue from './components/Prologue';
import LoadingSpinner from './components/LoadingSpinner';
import CharacterSheet from './components/CharacterSheet';
import SkillCheckPrompt from './components/SkillCheckPrompt';
import ImagePanel from './components/ImagePanel';
import ActionMenu from './components/ActionMenu';
import Header from './components/Header';
import QuestLog from './components/QuestLog';
import SkillMenu from './components/SkillMenu';
import Shop from './components/Shop';
import { FaCrosshairs, FaUser, FaHeart, FaBolt, FaStar } from 'react-icons/fa';

const LOCAL_STORAGE_KEY = 'gemini-text-adventure-state';

type LastAction =
    | { type: 'sendAction', payload: string }
    | { type: 'specialAction', payload: SpecialAction }
    | { type: 'combatAction', payload: string };

const useCharacterStats = (character: Character | null) => {
  return useMemo(() => {
    if (!character) return null;

    const baseScores = character.abilityScores;
    const calculatedStats: Record<StatEffect, number> = {
      '힘': baseScores['힘'], '민첩': baseScores['민첩'], '건강': baseScores['건강'],
      '지능': baseScores['지능'], '지혜': baseScores['지혜'], '매력': baseScores['매력'],
      'attack': 0, 'defense': 0, 'maxHp': character.maxHp, 'maxMp': character.maxMp
    };
    
    const equipmentEffects: Partial<Record<StatEffect, number>> = {};
    
    // Iterate over equipped item IDs
    Object.values(character.equipment).forEach(itemId => {
      if (itemId) {
        const item = character.inventory.find(i => i.id === itemId);
        if (item?.effects) {
          for (const effectKey in item.effects) {
            const key = effectKey as StatEffect;
            equipmentEffects[key] = (equipmentEffects[key] || 0) + (item.effects[key] || 0);
          }
        }
      }
    });
    
    // Apply effects
    for (const key in equipmentEffects) {
      const statKey = key as StatEffect;
      if (statKey in calculatedStats) {
         calculatedStats[statKey] += equipmentEffects[statKey]!;
      }
    }
    
    // Derive final attack/defense
    const finalAttack = Math.floor((calculatedStats['힘'] - 10) / 2) + (equipmentEffects['attack'] || 0);
    const finalDefense = 10 + Math.floor((calculatedStats['민첩'] - 10) / 2) + (equipmentEffects['defense'] || 0);
    
    return {
        ...calculatedStats,
        attack: finalAttack,
        defense: finalDefense,
        equipmentEffects,
    };
  }, [character]);
};

const ResourceBar: React.FC<{ current: number; max: number; color: string; icon: JSX.Element; }> = ({ current, max, color, icon }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-gray-600 rounded-full h-5 border-2 border-gray-800 relative flex items-center pl-2">
            <div className="absolute left-1.5 text-white z-10">{icon}</div>
            <div 
                className={`${color} h-full rounded-full transition-all duration-300`} 
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute w-full text-center text-xs font-bold text-white drop-shadow-md top-0 inset-0 flex items-center justify-center">{current}/{max}</span>
        </div>
    );
};

const CombatUI: React.FC<{
  character: Character;
  combatState: CombatState;
  onCombatAction: (actionText: string) => void;
  onOpenSkillMenu: () => void;
  onSetTarget: (targetId: string) => void;
  isLoading: boolean;
}> = ({ character, combatState, onCombatAction, onOpenSkillMenu, onSetTarget, isLoading }) => {
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
                                <img src={enemy.imageUrl} alt={enemy.name} className="h-24 md:h-32 w-full object-contain mx-auto mb-2 flex-grow" />
                                <h3 className="text-center font-bold text-xs md:text-sm truncate">{enemy.name}</h3>
                                <div className="relative mt-1">
                                    <ResourceBar current={enemy.hp} max={enemy.maxHp} color="bg-red-600" icon={<FaHeart size={10} />} />
                                </div>
                                {playerTargetId === enemy.id && <FaCrosshairs className="absolute top-2 right-2 text-red-500 text-xl md:text-2xl animate-pulse" />}
                            </>
                        ) : (
                             <>
                                <img src={enemy.imageUrl} alt={enemy.name} className="h-24 md:h-32 w-full object-contain mx-auto mb-2 opacity-50 grayscale flex-grow" />
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
                            <img src={character.imageUrl} alt={character.name} className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500" />
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

const GameOver: React.FC<{
  onRestart: () => void;
  onNewGame: () => void;
}> = ({ onRestart, onNewGame }) => {
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

const UiEffects: React.FC<{
    effects: UiEffect[];
    onEffectEnd: (id: string) => void;
}> = ({ effects, onEffectEnd }) => {
    return (
        <>
            {effects.map(effect => {
                const targetElement = document.getElementById(effect.elementId);
                if (!targetElement) return null;
                const rect = targetElement.getBoundingClientRect();
                return (
                    <div
                        key={effect.id}
                        className={`float-up-effect font-bold text-2xl ${effect.color}`}
                        style={{
                            left: `${rect.left + rect.width / 2}px`,
                            top: `${rect.top}px`,
                        }}
                        onAnimationEnd={() => onEffectEnd(effect.id)}
                    >
                        {effect.text}
                    </div>
                );
            })}
        </>
    );
};


const getInitialState = (): GameState => {
  return {
    storyLog: [],
    isLoading: false,
    error: null,
    character: null,
    gamePhase: 'start_menu',
    suggestedActions: [],
    currentSkillCheck: null,
    currentChapterPlan: null,
    chapterSummaries: [],
    npcs: {},
    isActionMenuOpen: false,
    worldMap: null,
    currentLocationId: null,
    currentTime: 8,
    currentDay: 1,
    combatState: null,
    currentShop: null,
    uiEffects: [],
  };
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [savedGameExists] = useState(() => !!localStorage.getItem(LOCAL_STORAGE_KEY));
  // Fix: The last action is an async function, so its type should be `() => Promise<void>`.
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);

  const calculatedStats = useCharacterStats(gameState.character);
  
  useEffect(() => {
    if (gameState.gamePhase === 'game_over' || gameState.gamePhase === 'start_menu') return;
    try {
      const stateToSave = JSON.parse(JSON.stringify({ ...gameState, isLoading: false, error: null }));

      stateToSave.storyLog.forEach((part: StoryLogEntry) => {
        if (part.type === StoryPartType.AI_SCENE) {
          (part as AiScenePart).imageUrl = '';
        }
      });
      if (stateToSave.character) stateToSave.character.imageUrl = '';
      if (stateToSave.npcs) {
        Object.keys(stateToSave.npcs).forEach(npcName => {
          if (stateToSave.npcs[npcName]) stateToSave.npcs[npcName].imageUrl = '';
        });
      }
      if(stateToSave.combatState) {
          stateToSave.combatState.enemies.forEach((enemy: Enemy) => { enemy.imageUrl = ''; });
      }
      stateToSave.uiEffects = []; // Do not save effects

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to local storage", error);
    }
  }, [gameState]);

  const handleStartCreation = () => {
    setGameState(prev => ({ ...getInitialState(), gamePhase: 'character_creation' }));
  };
  
  const handleContinueGame = () => {
    try {
        const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            setGameState({
                ...savedState,
                isLoading: false,
                error: null,
                isActionMenuOpen: false,
                combatState: savedState.gamePhase === 'in_combat' ? null : savedState.combatState,
                gamePhase: savedState.gamePhase === 'in_combat' ? 'in_game' : savedState.gamePhase,
            });
        }
    } catch (error) {
        console.error("Failed to load state from local storage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setGameState(getInitialState());
    }
  };

  const handleNewGame = () => {
    if (window.confirm("새로운 게임을 시작하면 현재 진행 상황이 모두 사라집니다. 정말 시작하시겠습니까?")) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setGameState(getInitialState());
        setIsCharacterSheetOpen(false);
    }
  };

  const addUiEffect = useCallback((text: string, color: string, elementId: string) => {
    setGameState(prev => {
        const newEffect: UiEffect = { id: crypto.randomUUID(), text, color, elementId };
        return { ...prev, uiEffects: [...prev.uiEffects, newEffect] };
    });
  }, []);

  const removeUiEffect = useCallback((id: string) => {
    setGameState(prev => ({ ...prev, uiEffects: prev.uiEffects.filter(e => e.id !== id) }));
  }, []);

  const processActionResult = useCallback(async (result: orchestrator.PlayerActionResult, previousImageUrl: string) => {
    const { newScene, updatedCharacter, updatedPlan, systemMessages, updatedSummaries, updatedNpcs, updatedLocationId, updatedWorldMap, enemiesToBattle, shop } = result;
    
    if (newScene.timeElapsed && newScene.timeElapsed > 0) {
        systemMessages.push({
            id: crypto.randomUUID(),
            type: StoryPartType.SYSTEM_MESSAGE,
            text: `${newScene.timeElapsed}시간이 흘렀습니다.`
        });
    }
    
    if (newScene.xpGained && newScene.xpGained > 0) {
        addUiEffect(`+${newScene.xpGained} XP`, 'text-yellow-400', 'character-sheet-button');
    }
    if (newScene.goldChange) {
        const text = `${newScene.goldChange > 0 ? '+' : ''}${newScene.goldChange} G`;
        const color = newScene.goldChange > 0 ? 'text-yellow-400' : 'text-red-500';
        addUiEffect(text, color, 'character-sheet-button');
    }

    const newStoryPartId = crypto.randomUUID();
    const newStoryPart: AiScenePart = {
      id: newStoryPartId,
      type: StoryPartType.AI_SCENE,
      content: newScene.content,
      sceneTitle: newScene.sceneTitle,
      imagePrompt: newScene.imagePrompt,
      imageUrl: previousImageUrl,
      isGeneratingImage: newScene.imageGenerationSetting !== 'NONE',
      suggestedActions: newScene.suggestedActions,
      skillCheck: newScene.skillCheck,
      isChapterComplete: newScene.isChapterComplete,
    };

    setGameState(prev => {
        let newTime = prev.currentTime;
        let newDay = prev.currentDay;
        if (newScene.timeElapsed && newScene.timeElapsed > 0) {
            newTime += newScene.timeElapsed;
            if (newTime >= 24) {
                newDay += Math.floor(newTime / 24);
                newTime = newTime % 24;
            }
        }

        const firstLogEntry = prev.storyLog[0];
        const newStoryLog = prev.storyLog.length > 0 && firstLogEntry.type === StoryPartType.AI_SCENE && firstLogEntry.sceneTitle === '...'
            ? [newStoryPart, ...systemMessages]
            : [...prev.storyLog, newStoryPart, ...systemMessages];

        return {
            ...prev,
            isLoading: false,
            storyLog: newStoryLog,
            character: updatedCharacter,
            currentChapterPlan: updatedPlan,
            suggestedActions: newScene.suggestedActions,
            currentSkillCheck: newScene.skillCheck || null,
            chapterSummaries: updatedSummaries,
            npcs: updatedNpcs,
            currentLocationId: updatedLocationId,
            worldMap: updatedWorldMap,
            currentTime: newTime,
            currentDay: newDay,
            currentShop: shop || null,
        };
    });
    
    if (enemiesToBattle && enemiesToBattle.length > 0) {
        setGameState(prev => ({
            ...prev,
            gamePhase: 'in_combat',
            combatState: {
                enemies: enemiesToBattle,
                turn: 'player',
                combatLog: [`${enemiesToBattle.map(e => e.name).join(', ')} (이)가 나타났다!`],
                playerTargetId: enemiesToBattle[0].id,
                skillCooldowns: {},
            },
            suggestedActions: [],
        }));
        setGameState(prev => ({
            ...prev,
            storyLog: prev.storyLog.map(p => p.id === newStoryPartId ? { ...p, isGeneratingImage: false } : p),
        }));
        return;
    }


    if (newScene.skillCheck) {
        setGameState(prev => ({
            ...prev,
            storyLog: prev.storyLog.map(p => p.id === newStoryPartId ? { ...p, isGeneratingImage: false } : p),
        }));
        return;
    }
    
    let finalImageUrl = previousImageUrl;
    const imageSetting = newScene.imageGenerationSetting || 'EDIT';
    const base64Data = previousImageUrl.split(',')[1];

    if (imageSetting === 'GENERATE' || (imageSetting === 'EDIT' && !base64Data)) {
        finalImageUrl = await generateInitialImage(newScene.imagePrompt);
    } else if (imageSetting === 'EDIT' && base64Data) {
        const editedImage = await editImage(newScene.imagePrompt, base64Data);
        finalImageUrl = editedImage ?? previousImageUrl;
    }

    setGameState(prev => ({
      ...prev,
      storyLog: prev.storyLog.map(part =>
        part.id === newStoryPartId
          ? { ...part, imageUrl: finalImageUrl, isGeneratingImage: false }
          : part
      ),
    }));
  }, [addUiEffect]);

  const handleCharacterCreate = async (character: Character) => {
    // 1. Show loading screen immediately
    setGameState({
      ...getInitialState(),
      character: character,
      gamePhase: 'prologue',
      isLoading: true,
      error: null,
    });

    try {
        // 2. Get only the chapter plan (fast operation)
        const { chapterPlan, initialLocationId, worldMap } = await orchestrator.initializeGame(character);

        // 3. Set up the game state with a placeholder for the first scene
        const placeholderScene: AiScenePart = {
            id: crypto.randomUUID(),
            type: StoryPartType.AI_SCENE,
            content: [{ type: 'narration', text: '모험의 서막이 오르고 있습니다...' }],
            sceneTitle: '...',
            imagePrompt: '',
            imageUrl: '',
            isGeneratingImage: true,
            suggestedActions: [],
        };
        
        setGameState(prev => ({
            ...prev,
            storyLog: [placeholderScene],
            isLoading: true, // Keep loading true for scene generation
            currentChapterPlan: chapterPlan,
            currentLocationId: initialLocationId,
            worldMap: worldMap,
        }));
        
        // 4. Now, asynchronously generate the first actual scene
        const initialPrompt = `모험이 시작됩니다. 캐릭터 "${character.name}"는 이제 막 "${chapterPlan.chapterTitle}"에 들어섰습니다. 시작 장소는 "${chapterPlan.locations[initialLocationId]?.name}" 입니다. 이 챕터의 첫 장면을 묘사해주세요.`;
        
        // Use processPlayerAction to generate the scene and handle all side effects
        const result = await orchestrator.processPlayerAction(initialPrompt, character, [], chapterPlan, [], {}, initialLocationId, worldMap, 8, 1);
        
        // 5. Process the result, which will replace the placeholder and generate images
        await processActionResult(result, '');
        
    } catch (err) {
        setGameState(prev => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
            gamePhase: 'character_creation',
        }));
    }
  };
  
  const handleContinueToGame = () => {
      setGameState(prev => ({ ...prev, gamePhase: 'in_game' }));
  };
  
  const handleAction = async (actionFn: () => Promise<void>) => {
    lastActionRef.current = actionFn;
    try {
      await actionFn();
    } catch (err) {
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      }));
    }
  };
  
  const handleSendAction = (actionText: string) => {
    if (!gameState.character || !gameState.currentChapterPlan || gameState.isLoading) return;
    
    const perform = async () => {
      const currentState = (await new Promise<GameState>(resolve => setGameState(prev => { resolve(prev); return prev; })));
      
      const userActionPart: UserStoryPart = { id: crypto.randomUUID(), type: StoryPartType.USER, text: actionText };
      const lastAiPart = [...currentState.storyLog].reverse().find(p => p.type === StoryPartType.AI_SCENE) as AiScenePart | undefined;
      const previousImageUrl = lastAiPart ? lastAiPart.imageUrl : '';
      
      setGameState(prev => ({ ...prev, isLoading: true, error: null, storyLog: [...prev.storyLog, userActionPart], suggestedActions: [], currentShop: null }));
      
      const result = await orchestrator.processPlayerAction(actionText, currentState.character!, currentState.storyLog, currentState.currentChapterPlan!, currentState.chapterSummaries, currentState.npcs, currentState.currentLocationId, currentState.worldMap, currentState.currentTime, currentState.currentDay);
      await processActionResult(result, previousImageUrl);
    };
    
    handleAction(perform);
  };
  
  const handleExecuteSpecialAction = (action: SpecialAction) => {
    if (!gameState.character || !gameState.currentChapterPlan || gameState.isLoading) return;
    
    const perform = async () => {
      const currentState = (await new Promise<GameState>(resolve => setGameState(prev => { resolve(prev); return prev; })));

      setGameState(p => ({ ...p, isActionMenuOpen: false, isLoading: true, error: null, suggestedActions: [], currentShop: null }));
      
      const lastAiPart = [...currentState.storyLog].reverse().find(p => p.type === StoryPartType.AI_SCENE) as AiScenePart | undefined;
      const previousImageUrl = lastAiPart ? lastAiPart.imageUrl : '';
      const result = await orchestrator.executeSpecialAction(action, currentState.character!, currentState.storyLog, currentState.currentChapterPlan!, currentState.chapterSummaries, currentState.npcs, currentState.currentLocationId, currentState.worldMap, currentState.currentTime, currentState.currentDay);

      if ('summaryMessage' in result) {
        setGameState(p => ({ ...p, storyLog: [...p.storyLog, result.summaryMessage], isLoading: false }));
      } else if ('actionResult' in result) {
        await processActionResult(result.actionResult, previousImageUrl);
      }
    };
    
    handleAction(perform);
  };
  
  const handleRetry = () => {
    if (lastActionRef.current) {
        handleAction(lastActionRef.current);
    }
  };

  const handleRollSkillCheck = () => {
    if (!gameState.character || !gameState.currentSkillCheck) return;
    const { ability, difficulty } = gameState.currentSkillCheck;
    const score = gameState.character.abilityScores[ability] || 10;
    const modifier = Math.floor((score - 10) / 2);
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const total = d20Roll + modifier;
    const resultText = `주사위 굴림: ${d20Roll} + ${modifier} (${ability}) = 총 ${total} (난이도: ${difficulty})`;
    const systemMessage: SystemMessagePart = { id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: resultText };
    setGameState(prev => ({ ...prev, storyLog: [...prev.storyLog, systemMessage], currentSkillCheck: null }));
    let outcome = d20Roll === 1 ? '대실패' : d20Roll === 20 ? '대성공' : total >= difficulty ? '성공' : '실패';
    const outcomeMessage = `판정 결과: '${outcome}'. 내 캐릭터가 ${ability} 판정을 시도했고, 결과는 이러했습니다. 이 결과에 따른 이야기를 계속해주세요.`;
    handleSendAction(outcomeMessage);
  };
  
  const endPlayerTurn = () => {
      setGameState(prev => {
          if (!prev.combatState) return prev;
          return { ...prev, combatState: { ...prev.combatState, turn: 'enemy' } };
      });
  };

  const handleCombatActionSubmit = async (actionText: string) => {
    if (!gameState.character || !gameState.combatState) return;

    setGameState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await orchestrator.processPlayerCombatAction(
        gameState.character,
        gameState.combatState,
        actionText
      );

      // Apply results from AI
      setGameState(prev => {
        if (!prev.character || !prev.combatState) return prev;

        let newCharacter = { ...prev.character };
        let newCombatState = { ...prev.combatState };
        
        newCombatState.combatLog = [...newCombatState.combatLog, result.combatLogEntry];

        if (result.damageDealt) {
          result.damageDealt.forEach(damage => {
            const enemyIndex = newCombatState.enemies.findIndex(e => e.id === damage.targetId);
            if (enemyIndex !== -1) {
              const enemy = { ...newCombatState.enemies[enemyIndex] };
              enemy.hp = Math.max(0, enemy.hp - damage.amount);
              addUiEffect(`${damage.amount}`, 'text-red-500', enemy.id);
              newCombatState.enemies[enemyIndex] = enemy;
              if (enemy.hp === 0) {
                 newCombatState.combatLog.push(`${enemy.name}(을)를 쓰러트렸다!`);
              }
            }
          });
        }
        
        if (result.playerHpChange) {
            const change = result.playerHpChange;
            newCharacter.hp = Math.max(0, Math.min(newCharacter.maxHp, newCharacter.hp + change));
            addUiEffect(`${change > 0 ? '+' : ''}${change}`, change > 0 ? 'text-green-400' : 'text-yellow-400', 'player-portrait');
        }
        if (result.playerMpChange) {
            newCharacter.mp = Math.max(0, newCharacter.mp + result.playerMpChange);
        }

        if (result.skillUsed) {
            const skill = newCharacter.skills.find(s => s.name === result.skillUsed);
            if (skill) {
                newCombatState.skillCooldowns[skill.id] = skill.cooldown;
            }
        }
        
        const currentTarget = newCombatState.enemies.find(e => e.id === newCombatState.playerTargetId);
        if (!currentTarget || currentTarget.hp <= 0) {
            const nextTarget = newCombatState.enemies.find(e => e.hp > 0);
            newCombatState.playerTargetId = nextTarget ? nextTarget.id : null;
        }

        return { ...prev, character: newCharacter, combatState: newCombatState };
      });

      endPlayerTurn();

    } catch (err) {
      setGameState(prev => ({ ...prev, error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.' }));
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleUseSkill = (skill: Skill, targetId: string | null) => {
    setIsSkillMenuOpen(false);
    const target = gameState.combatState?.enemies.find(e => e.id === targetId);
    let actionText = `${skill.name} 스킬 사용.`;
    if (target) {
        actionText += ` 대상: ${target.name}.`;
    }
    handleCombatActionSubmit(actionText);
  };

  useEffect(() => {
    if (gameState.gamePhase === 'in_combat' && gameState.combatState?.turn === 'enemy') {
        const livingEnemies = gameState.combatState.enemies.filter(e => e.hp > 0);
        if (livingEnemies.length === 0) {
            checkCombatEnd();
            return;
        }

        const enemyTurnTimeout = setTimeout(() => {
            setGameState(prev => {
                if (!prev.character || !prev.combatState || !calculatedStats) return prev;
                let newCharacter = { ...prev.character };
                let newCombatState = { ...prev.combatState };
                let newCombatLog = [...newCombatState.combatLog];

                livingEnemies.forEach(enemy => {
                     const enemyAttackRoll = Math.floor(Math.random() * 4) + 1;
                     const totalDamage = Math.max(1, enemy.attack + enemyAttackRoll - calculatedStats.defense);
                     newCharacter.hp = Math.max(0, newCharacter.hp - totalDamage);
                     newCombatLog.push(`${enemy.name}(이)가 ${newCharacter.name}에게 ${totalDamage}의 피해를 입혔다!`);
                     addUiEffect(`${totalDamage}`, 'text-yellow-400', 'player-portrait');
                });

                newCombatState.combatLog = newCombatLog;
                newCombatState.turn = 'player';
                for (const skillId in newCombatState.skillCooldowns) {
                    if (newCombatState.skillCooldowns[skillId] > 0) {
                        newCombatState.skillCooldowns[skillId]--;
                    }
                }
                
                return { ...prev, character: newCharacter, combatState: newCombatState };
            });
        }, 1500);

        return () => clearTimeout(enemyTurnTimeout);
    }
  }, [gameState.gamePhase, gameState.combatState?.turn, calculatedStats, addUiEffect]); // depends on turn now

  const checkCombatEnd = useCallback(() => {
    if (!gameState.combatState || !gameState.character) return;
    if (gameState.character.hp <= 0) {
        setGameState(prev => ({ ...prev, gamePhase: 'game_over' }));
        return;
    }
    const allEnemiesDefeated = gameState.combatState.enemies.every(e => e.hp <= 0);
    if (allEnemiesDefeated) {
        setGameState(prev => ({
            ...prev,
            gamePhase: 'in_game',
            combatState: null,
            storyLog: [...prev.storyLog, { id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: '전투에서 승리했다!' }]
        }));
        handleSendAction("전투에서 승리했다. 그 후의 상황을 묘사해줘.");
    }
  }, [gameState.combatState, gameState.character]);

  useEffect(() => {
    if(gameState.gamePhase === 'in_combat') checkCombatEnd();
  }, [gameState.combatState, gameState.character, checkCombatEnd]);

  const handleSetTarget = (targetId: string) => {
    setGameState(prev => {
        if (!prev.combatState) return prev;
        const target = prev.combatState.enemies.find(e => e.id === targetId);
        if (target && target.hp > 0) {
            return { ...prev, combatState: { ...prev.combatState, playerTargetId: targetId } };
        }
        return prev;
    });
  };

  const handleRestartFromDefeat = () => {
    handleContinueGame(); // Re-load last saved state
  };

  const handleBuyItem = (item: Item) => {
    setGameState(prev => {
        if (!prev.character) return prev;

        const price = item.value * 2;
        if (prev.character.gold < price) {
            return { ...prev, error: "골드가 부족합니다." };
        }
        
        const newCharacter = {
            ...prev.character,
            gold: prev.character.gold - price,
            inventory: [...prev.character.inventory, { ...item, id: crypto.randomUUID() }]
        };
        
        const systemMessage: SystemMessagePart = {
            id: crypto.randomUUID(),
            type: StoryPartType.SYSTEM_MESSAGE,
            text: `${item.name}을(를) ${price}G에 구매했습니다.`
        };

        return {
            ...prev,
            character: newCharacter,
            storyLog: [...prev.storyLog, systemMessage],
            error: null
        };
    });
  };
  
  const handleSellItem = (item: Item) => {
      setGameState(prev => {
          if (!prev.character) return prev;
          
          const price = item.value;
          const newInventory = prev.character.inventory.filter(i => i.id !== item.id);
          
          const newCharacter = {
              ...prev.character,
              gold: prev.character.gold + price,
              inventory: newInventory
          };

          const systemMessage: SystemMessagePart = {
              id: crypto.randomUUID(),
              type: StoryPartType.SYSTEM_MESSAGE,
              text: `${item.name}을(를) ${price}G에 판매했습니다.`
          };

          return {
              ...prev,
              character: newCharacter,
              storyLog: [...prev.storyLog, systemMessage],
              error: null
          };
      });
  };

  const handleEquipItem = (itemToEquip: Item) => {
    setGameState(prev => {
        if (!prev.character || itemToEquip.slot === 'none') return prev;
        
        const newEquipment = { ...prev.character.equipment };
        newEquipment[itemToEquip.slot] = itemToEquip.id;

        return {
            ...prev,
            character: { ...prev.character, equipment: newEquipment }
        };
    });
  };

  const handleUnequipItem = (slot: ItemSlot) => {
      setGameState(prev => {
          if (!prev.character || slot === 'none') return prev;
          
          const newEquipment = { ...prev.character.equipment };
          newEquipment[slot] = null;

          return {
              ...prev,
              character: { ...prev.character, equipment: newEquipment }
          };
      });
  };

  const isActionDisabled = () => {
    if (gameState.isLoading || gameState.currentSkillCheck || gameState.gamePhase === 'in_combat') return true;
    const lastPart = gameState.storyLog[gameState.storyLog.length - 1];
    return lastPart?.type === StoryPartType.AI_SCENE && lastPart.isGeneratingImage;
  };

  if (gameState.gamePhase === 'start_menu') return <Introduction onStartCreation={handleStartCreation} onContinueGame={handleContinueGame} hasSavedGame={savedGameExists} />;
  if (gameState.gamePhase === 'character_creation') return <CharacterCreator onCharacterCreate={handleCharacterCreate} />;
  if (gameState.gamePhase === 'prologue') {
    const prologuePart = gameState.storyLog[0] as AiScenePart | undefined;
    if (gameState.isLoading || !prologuePart) {
      return ( <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center"><LoadingSpinner /><p className="mt-4 text-lg text-gray-300 animate-pulse">모험의 서막을 여는 중...</p></div> );
    }
    if (!gameState.character) {
      return ( <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center p-4"><h2 className="text-2xl text-red-400 mb-4">오류 발생</h2><p className="text-gray-300 mb-6">{gameState.error || "모험을 시작하는데 필요한 정보를 불러오지 못했습니다."}</p><button onClick={() => setGameState(getInitialState())} className="bg-cyan-600 text-white font-bold rounded-lg py-2 px-6 hover:bg-cyan-500">처음으로 돌아가기</button></div> );
    }
    return <Prologue character={gameState.character} prologue={prologuePart} onContinue={handleContinueToGame} />;
  }
  if (gameState.gamePhase === 'game_over') return <GameOver onRestart={handleRestartFromDefeat} onNewGame={handleNewGame} />;

  const latestAiScene = [...gameState.storyLog].reverse().find(p => p.type === StoryPartType.AI_SCENE) as AiScenePart | undefined;
  const currentLocationName = (gameState.currentLocationId && gameState.worldMap) ? gameState.worldMap[gameState.currentLocationId].name : "알 수 없는 곳";

  return (
    <>
      <UiEffects effects={gameState.uiEffects} onEffectEnd={removeUiEffect} />
      <div className="h-screen bg-gray-900 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-1/2 h-1/3 md:h-full flex-shrink-0">
          <ImagePanel imageUrl={latestAiScene?.imageUrl ?? ''} altText={latestAiScene?.imagePrompt ?? ''} isLoading={latestAiScene ? latestAiScene.isGeneratingImage : false} />
        </aside>
        <div className="w-full md:w-1/2 h-2/3 md:h-full flex flex-col">
          <div className="w-full max-w-4xl mx-auto h-full flex flex-col gap-4 p-2 md:p-4">
             <Header locationName={currentLocationName} currentDay={gameState.currentDay} currentTime={gameState.currentTime} onOpenQuestLog={() => setIsQuestLogOpen(true)} />
            <main className="flex-grow flex flex-col overflow-hidden">
             {gameState.gamePhase !== 'in_combat' && <StoryLog storyLog={gameState.storyLog} character={gameState.character} npcs={gameState.npcs} />}
            </main>
            {gameState.error && (
              <div className="flex-shrink-0 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative flex justify-between items-center" role="alert">
                  <div>
                    <strong className="font-bold">오류 발생: </strong>
                    <span className="block sm:inline">{gameState.error}</span>
                  </div>
                  {lastActionRef.current && (
                      <button onClick={handleRetry} className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 rounded ml-4">
                          재시도
                      </button>
                  )}
              </div>
            )}
            <footer className="w-full flex flex-col gap-4 flex-shrink-0">
               {gameState.gamePhase === 'in_combat' && gameState.character && gameState.combatState ? (
                <CombatUI character={gameState.character} combatState={gameState.combatState} onCombatAction={handleCombatActionSubmit} onOpenSkillMenu={() => setIsSkillMenuOpen(true)} onSetTarget={handleSetTarget} isLoading={gameState.isLoading} />
              ) : gameState.currentSkillCheck ? (
                <SkillCheckPrompt skillCheck={gameState.currentSkillCheck} onRoll={handleRollSkillCheck} />
              ) : (
                <>
                  {gameState.currentShop && (
                    <div className="w-full text-center">
                      <button 
                        onClick={() => setIsShopOpen(true)}
                        disabled={isActionDisabled()}
                        className="bg-yellow-600 text-white font-bold rounded-lg py-2 px-8 hover:bg-yellow-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
                      >
                        {gameState.currentShop.name} 방문하기
                      </button>
                    </div>
                  )}
                  <SuggestedActions actions={gameState.suggestedActions} onActionSelect={handleSendAction} disabled={isActionDisabled()} />
                  <ActionInput onSubmit={handleSendAction} onOpenActionMenu={() => setGameState(p => ({ ...p, isActionMenuOpen: true }))} disabled={isActionDisabled()} />
                </>
              )}
            </footer>
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        <button id="character-sheet-button" onClick={() => setIsCharacterSheetOpen(true)} className="w-14 h-14 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500" aria-label="캐릭터 시트 열기">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
        </button>
      </div>
      {isCharacterSheetOpen && gameState.character && (
        <CharacterSheet
            character={gameState.character}
            calculatedStats={calculatedStats}
            onClose={() => setIsCharacterSheetOpen(false)}
            onNewGame={handleNewGame}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
        />
      )}
      {isQuestLogOpen && gameState.currentChapterPlan && <QuestLog plan={gameState.currentChapterPlan} onClose={() => setIsQuestLogOpen(false)} />}
      {isSkillMenuOpen && gameState.character && gameState.combatState && <SkillMenu skills={gameState.character.skills} characterMp={gameState.character.mp} cooldowns={gameState.combatState.skillCooldowns} targetId={gameState.combatState.playerTargetId} onUseSkill={handleUseSkill} onClose={() => setIsSkillMenuOpen(false)} />}
      {isShopOpen && gameState.character && gameState.currentShop && (
          <Shop
            character={gameState.character}
            shop={gameState.currentShop}
            onClose={() => setIsShopOpen(false)}
            onBuy={handleBuyItem}
            onSell={handleSellItem}
          />
      )}
      <ActionMenu isOpen={gameState.isActionMenuOpen} onClose={() => setGameState(p => ({ ...p, isActionMenuOpen: false }))} onExecuteAction={handleExecuteSpecialAction} character={gameState.character} npcs={gameState.npcs}/>
    </>
  );
};

export default App;