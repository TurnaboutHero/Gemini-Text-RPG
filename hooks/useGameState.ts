import { useState, useEffect, useCallback } from 'react';
import { GameState, StoryLogEntry, StoryPartType, AiScenePart, Enemy, UiEffect } from '../types';
import { LOCAL_STORAGE_KEY, INITIAL_TIME, INITIAL_DAY } from '../constants';
import { audioService } from '../services/audioService';

export const getInitialState = (): GameState => {
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
    currentTime: INITIAL_TIME,
    currentDay: INITIAL_DAY,
    combatState: null,
    currentShop: null,
    uiEffects: [],
    useImageGeneration: true,
    imageModel: 'gemini-2.5-flash-image',
    hasApiKey: false,
    locationImages: {},
    entityImages: {},
  };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(getInitialState);

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
      if(stateToSave.currentChapterPlan) stateToSave.currentChapterPlan.mapImageUrl = '';
      stateToSave.uiEffects = []; // Do not save effects

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to local storage", error);
    }
  }, [gameState]);

  const handleStartCreation = useCallback(() => {
    setGameState(prev => ({ ...getInitialState(), gamePhase: 'character_creation' }));
    audioService.playBgm('character_creation');
  }, []);
  
  const handleContinueGame = useCallback(() => {
    try {
        const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            const loadedPhase = savedState.gamePhase === 'in_combat' ? 'in_game' : savedState.gamePhase;
            setGameState({
                ...savedState,
                isLoading: false,
                error: null,
                isActionMenuOpen: false,
                combatState: savedState.gamePhase === 'in_combat' ? null : savedState.combatState,
                gamePhase: loadedPhase
            });
            audioService.playBgm(loadedPhase === 'in_combat' ? 'combat' : 'adventure');
        }
    } catch (error) {
        console.error("Failed to load state from local storage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setGameState(getInitialState());
    }
  }, []);

  const handleNewGame = useCallback((setIsCharacterSheetOpen: (isOpen: boolean) => void) => {
    if (window.confirm("새로운 게임을 시작하면 현재 진행 상황이 모두 사라집니다. 정말 시작하시겠습니까?")) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setGameState(getInitialState());
        setIsCharacterSheetOpen(false);
        audioService.playBgm('main_menu');
    }
  }, []);

  const addUiEffect = useCallback((text: string, color: string, elementId: string) => {
    setGameState(prev => {
        const newEffect: UiEffect = { id: crypto.randomUUID(), text, color, elementId };
        return { ...prev, uiEffects: [...prev.uiEffects, newEffect] };
    });
  }, []);

  const removeUiEffect = useCallback((id: string) => {
    setGameState(prev => ({ ...prev, uiEffects: prev.uiEffects.filter(e => e.id !== id) }));
  }, []);

  return {
    gameState,
    setGameState,
    handleStartCreation,
    handleContinueGame,
    handleNewGame,
    addUiEffect,
    removeUiEffect,
  };
};
