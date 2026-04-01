import { useCallback, useRef } from 'react';
import { GameState, Character, SpecialAction, StoryPartType, AiScenePart, UserStoryPart, SystemMessagePart, ImageModel } from '../types';
import * as orchestrator from '../services/orchestratorService';
import { generateInitialImage, editImage } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { getInitialState } from './useGameState';

export const useGameActions = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  addUiEffect: (text: string, color: string, elementId: string) => void,
  handleNewGame: (setIsCharacterSheetOpen: (isOpen: boolean) => void) => void,
  handleContinueGame: () => void,
  setIsCharacterSheetOpen: (isOpen: boolean) => void
) => {
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);

  const checkApiKey = async (model: ImageModel): Promise<boolean> => {
    if (model === 'gemini-3-pro-image-preview' || model === 'gemini-3.1-flash-image-preview') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Assume success after opening dialog as per instructions
        setGameState(prev => ({ ...prev, hasApiKey: true }));
        return true;
      }
      setGameState(prev => ({ ...prev, hasApiKey: true }));
      return true;
    }
    return true;
  };

  const handleAction = async (actionFn: () => Promise<void>) => {
    lastActionRef.current = actionFn;
    try {
      await actionFn();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      if (errorMessage.includes('Requested entity was not found.') || errorMessage.includes('403') || errorMessage.includes('Permission')) {
         setGameState(prev => ({ ...prev, hasApiKey: false, isLoading: false, error: 'API 키가 유효하지 않거나 권한이 없습니다. 다시 선택해주세요.' }));
         await window.aistudio.openSelectKey();
         return;
      }
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  const handleRetry = () => {
    if (lastActionRef.current) {
        handleAction(lastActionRef.current);
    }
  };

  const processActionResult = useCallback(async (result: orchestrator.PlayerActionResult, actionText: string, previousImageUrl: string, useImageGeneration: boolean, currentLocationId: string | null, locationImages: Record<string, string>, imageModel: ImageModel) => {
    const { newScene, updatedCharacter, updatedPlan, systemMessages, updatedSummaries, updatedNpcs, updatedLocationId, updatedWorldMap, enemiesToBattle, shop, newEntityImages, imagePromises } = result;
    
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
      text: '',
      contentBlocks: newScene.contentBlocks,
      sceneTitle: newScene.sceneTitle,
      imagePrompt: newScene.imagePrompt,
      imageUrl: previousImageUrl,
      isGeneratingImage: useImageGeneration && newScene.imageGenerationSetting !== 'NONE',
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
            // Filter out system messages from previous turn before adding new ones
            : [...prev.storyLog.filter(p => p.type !== StoryPartType.SYSTEM_MESSAGE), newStoryPart, ...systemMessages];


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
            entityImages: newEntityImages,
        };
    });

    // Start streaming narrative
    setGameState(prev => ({ ...prev, isLoading: true })); // Keep loading state while streaming
    
    // Start image generation asynchronously
    let imagePromise: Promise<string> = Promise.resolve(previousImageUrl);
    if (useImageGeneration && !enemiesToBattle?.length && !newScene.skillCheck) {
        const imageSetting = newScene.imageGenerationSetting || 'EDIT';
        const base64Data = previousImageUrl.split(',')[1];

        if (updatedLocationId && updatedLocationId !== currentLocationId && locationImages[updatedLocationId]) {
             imagePromise = Promise.resolve(locationImages[updatedLocationId]);
        } else if (imageSetting === 'GENERATE' || (imageSetting === 'EDIT' && !base64Data)) {
            imagePromise = generateInitialImage(newScene.imagePrompt, imageModel);
        } else if (imageSetting === 'EDIT' && base64Data) {
            imagePromise = editImage(newScene.imagePrompt, base64Data, imageModel).then(res => res ?? previousImageUrl);
        }
        
        imagePromise.then(finalImageUrl => {
            setGameState(prev => {
                const newLocationImages = { ...prev.locationImages };
                if (updatedLocationId) {
                    newLocationImages[updatedLocationId] = finalImageUrl;
                }
                return {
                    ...prev,
                    currentSceneImageUrl: finalImageUrl,
                    locationImages: newLocationImages,
                    storyLog: prev.storyLog.map(part =>
                        part.id === newStoryPartId
                            ? { ...part, imageUrl: finalImageUrl, isGeneratingImage: false }
                            : part
                    ),
                };
            });
        }).catch(err => {
            console.error("Error generating image:", err);
            setGameState(prev => ({
                ...prev,
                storyLog: prev.storyLog.map(part =>
                    part.id === newStoryPartId
                        ? { ...part, isGeneratingImage: false }
                        : part
                ),
            }));
        });
    }

    if (imagePromises && imagePromises.length > 0) {
        imagePromises.forEach(p => {
            p.then(res => {
                setGameState(prev => {
                    const updatedImages = { ...prev.entityImages, [res.name]: res.imageUrl };
                    if (res.type === 'npc') {
                        return {
                            ...prev,
                            currentSceneImageUrl: res.imageUrl,
                            entityImages: updatedImages,
                            npcs: {
                                ...prev.npcs,
                                [res.id]: { ...prev.npcs[res.id], imageUrl: res.imageUrl }
                            }
                        };
                    } else if (res.type === 'enemy') {
                        return {
                            ...prev,
                            currentSceneImageUrl: res.imageUrl,
                            entityImages: updatedImages,
                            combatState: prev.combatState ? {
                                ...prev.combatState,
                                enemies: prev.combatState.enemies.map(e => e.id === res.id ? { ...e, imageUrl: res.imageUrl } : e)
                            } : null
                        };
                    }
                    return prev;
                });
            });
        });
    }

    setGameState(prev => ({ ...prev, isLoading: false }));
    
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
        audioService.playBgm('combat');
        return;
    }


    if (newScene.skillCheck) {
        setGameState(prev => ({
            ...prev,
            storyLog: prev.storyLog.map(p => p.id === newStoryPartId ? { ...p, isGeneratingImage: false } : p),
        }));
        return;
    }
  }, [addUiEffect, setGameState]);

  const handleSendAction = (actionText: string) => {
    if (!gameState.character || !gameState.currentChapterPlan || gameState.isLoading) return;
    
    const perform = async () => {
      const currentState = (await new Promise<GameState>(resolve => setGameState(prev => { resolve(prev); return prev; })));

      if (currentState.useImageGeneration) {
        await checkApiKey(currentState.imageModel);
      }

      const userActionPart: UserStoryPart = { id: crypto.randomUUID(), type: StoryPartType.USER, text: actionText };
      
      const lastAiPart = [...currentState.storyLog].reverse().find(p => p.type === StoryPartType.AI_SCENE) as AiScenePart | undefined;
      const previousImageUrl = lastAiPart ? lastAiPart.imageUrl : '';
      
      setGameState(prev => ({ ...prev, isLoading: true, loadingMessage: 'AI가 행동 결과를 계산하는 중...', error: null, storyLog: [...prev.storyLog, userActionPart], suggestedActions: [], currentShop: null }));
      
      const result = await orchestrator.processPlayerAction(actionText, currentState.character!, currentState.storyLog, currentState.currentChapterPlan!, currentState.chapterSummaries, currentState.npcs, currentState.currentLocationId, currentState.worldMap, currentState.currentTime, currentState.currentDay, currentState.useImageGeneration, currentState.imageModel, currentState.entityImages);
      
      setGameState(prev => ({ ...prev, loadingMessage: 'AI가 장면 이미지를 생성하는 중...' }));
      
      await processActionResult(result, actionText, previousImageUrl, currentState.useImageGeneration, currentState.currentLocationId, currentState.locationImages, currentState.imageModel);
    };
    
    handleAction(perform);
  };

  const handleCharacterCreate = async (character: Character, useImageGeneration: boolean, imageModel: ImageModel) => {
    if (useImageGeneration) {
      await checkApiKey(imageModel);
    }

    // 1. Show loading screen immediately
    setGameState({
      ...getInitialState(),
      character: character,
      gamePhase: 'prologue',
      isLoading: true,
      loadingMessage: '모험 준비 중...',
      error: null,
      useImageGeneration: useImageGeneration,
      imageModel: imageModel,
    });

    try {
        // 2. Get only the chapter plan (fast operation)
        const { chapterPlan, initialLocationId, worldMap } = await orchestrator.initializeGame(
            character, 
            useImageGeneration, 
            imageModel,
            (msg) => setGameState(prev => ({ ...prev, loadingMessage: msg }))
        );

        // 3. Set up the game state with a placeholder for the first scene
        const placeholderScene: AiScenePart = {
            id: crypto.randomUUID(),
            type: StoryPartType.AI_SCENE,
            text: '모험의 서막이 오르고 있습니다...',
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
            loadingMessage: 'AI가 첫 장면 스토리를 작성하는 중...',
            currentChapterPlan: chapterPlan,
            currentLocationId: initialLocationId,
            worldMap: worldMap,
        }));
        
        // 4. Now, asynchronously generate the first actual scene
        const initialPrompt = `모험이 시작됩니다. 캐릭터 "${character.name}"는 이제 막 "${chapterPlan.chapterTitle}"에 들어섰습니다. 시작 장소는 "${chapterPlan.locations[initialLocationId]?.name}" 입니다. 이 챕터의 첫 장면을 묘사해주세요.`;
        
        // Use processPlayerAction to generate the scene and handle all side effects
        const result = await orchestrator.processPlayerAction(initialPrompt, character, [], chapterPlan, [], {}, initialLocationId, worldMap, 8, 1, useImageGeneration, imageModel, {});
        
        setGameState(prev => ({ ...prev, loadingMessage: 'AI가 첫 장면의 이미지를 그리는 중...' }));
        
        // 5. Process the result, which will replace the placeholder and generate images
        await processActionResult(result, initialPrompt, '', useImageGeneration, initialLocationId, {}, imageModel);
        
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        if (errorMessage.includes('Requested entity was not found.') || errorMessage.includes('403') || errorMessage.includes('Permission')) {
            setGameState(prev => ({ ...prev, hasApiKey: false, isLoading: false, error: 'API 키가 유효하지 않거나 권한이 없습니다. 다시 선택해주세요.', gamePhase: 'character_creation' }));
            await window.aistudio.openSelectKey();
            return;
        }
        setGameState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
            gamePhase: 'character_creation',
        }));
    }
  };

  const handleContinueToGame = () => {
      setGameState(prev => ({ ...prev, gamePhase: 'in_game' }));
      audioService.playBgm('adventure');
  };

  const handleExecuteSpecialAction = (action: SpecialAction) => {
    if (!gameState.character || !gameState.currentChapterPlan || gameState.isLoading) return;
    
    const perform = async () => {
      const currentState = (await new Promise<GameState>(resolve => setGameState(prev => { resolve(prev); return prev; })));
      
      if (currentState.useImageGeneration) {
        await checkApiKey(currentState.imageModel);
      }

      setGameState(p => ({ ...p, isActionMenuOpen: false, isLoading: true, loadingMessage: '특수 행동을 처리하는 중...', error: null, suggestedActions: [], currentShop: null }));
      
      const lastAiPart = [...currentState.storyLog].reverse().find(p => p.type === StoryPartType.AI_SCENE) as AiScenePart | undefined;
      const previousImageUrl = lastAiPart ? lastAiPart.imageUrl : '';
      const result = await orchestrator.executeSpecialAction(action, currentState.character!, currentState.storyLog, currentState.currentChapterPlan!, currentState.chapterSummaries, currentState.npcs, currentState.currentLocationId, currentState.worldMap, currentState.currentTime, currentState.currentDay, currentState.useImageGeneration, currentState.imageModel, currentState.entityImages);

      if ('summaryMessage' in result) {
        setGameState(p => ({ ...p, storyLog: [...p.storyLog, result.summaryMessage], isLoading: false }));
      } else if ('actionResult' in result) {
        setGameState(p => ({ ...p, loadingMessage: '행동 결과를 적용하는 중...' }));
        await processActionResult(result.actionResult, action.type, previousImageUrl, currentState.useImageGeneration, currentState.currentLocationId, currentState.locationImages, currentState.imageModel);
      }
    };
    
    handleAction(perform);
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
    const outcomeMessage = `판정 결과: '${outcome}'. 내 캐릭터가 ${ability} 판정을 시도했고, 결과는 이러했습니다. 이 결과에 따른 이야기를 계속해주세요. (중요: 판정 결과만으로 갑자기 다른 장소로 이동하지 말고, 현재 장소("${gameState.worldMap?.[gameState.currentLocationId || '']?.name || '알 수 없음'}")에서의 상황 변화를 묘사해주세요.)`;
    handleSendAction(outcomeMessage);
  };

  const handleRestartFromDefeat = () => {
    handleContinueGame(); // Re-load last saved state
  };

  return {
    handleSendAction,
    handleCharacterCreate,
    handleContinueToGame,
    handleExecuteSpecialAction,
    handleRollSkillCheck,
    handleRestartFromDefeat,
    handleRetry,
    lastActionRef
  };
};
