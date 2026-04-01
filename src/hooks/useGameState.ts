import { useState, useEffect, useCallback } from 'react';
import { GameState, StoryLogEntry, StoryPartType, AiScenePart, Enemy, UiEffect } from '../types';
import { LOCAL_STORAGE_KEY, INITIAL_TIME, INITIAL_DAY } from '../constants';
import { audioService } from '../services/audioService';

export const getInitialState = (): GameState => {
  return {
    storyLog: [],
    isLoading: false,
    loadingMessage: '',
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
    currentSceneImageUrl: null,
    locationImages: {},
    entityImages: {},
  };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(getInitialState);

  useEffect(() => {
    if (gameState.gamePhase === 'game_over' || gameState.gamePhase === 'start_menu') return;
    
    const saveToLocalStorage = (state: any) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.message.includes('exceeded the quota')) {
          return false;
        }
        throw e;
      }
    };

    try {
      const stateToSave = JSON.parse(JSON.stringify({ ...gameState, isLoading: false, error: null }));
      stateToSave.uiEffects = []; // Never save temporary UI effects

      // Try saving with images first
      let success = saveToLocalStorage(stateToSave);

      if (!success) {
        console.warn("Local storage quota exceeded. Stripping older images...");
        // Find the index of the latest AI scene with an image
        let latestAiSceneIdx = -1;
        for (let i = stateToSave.storyLog.length - 1; i >= 0; i--) {
          if (stateToSave.storyLog[i].type === StoryPartType.AI_SCENE && (stateToSave.storyLog[i] as AiScenePart).imageUrl) {
            latestAiSceneIdx = i;
            break;
          }
        }

        // Strip images from all but the latest AI scene
        stateToSave.storyLog.forEach((part: StoryLogEntry, idx: number) => {
          if (part.type === StoryPartType.AI_SCENE && idx !== latestAiSceneIdx) {
            (part as AiScenePart).imageUrl = '';
          }
        });
        // Clear other image caches but keep currentSceneImageUrl if possible
        stateToSave.locationImages = {};
        stateToSave.entityImages = {};
        
        success = saveToLocalStorage(stateToSave);
      }

      if (!success) {
        console.warn("Still exceeding quota. Stripping all story log images but keeping currentSceneImageUrl...");
        stateToSave.storyLog.forEach((part: StoryLogEntry) => {
          if (part.type === StoryPartType.AI_SCENE) {
            (part as AiScenePart).imageUrl = '';
          }
        });
        // Keep currentSceneImageUrl as a last resort for visual continuity
        
        success = saveToLocalStorage(stateToSave);
      }

      if (!success) {
        console.warn("Still exceeding quota. Stripping character and NPC images...");
        if (stateToSave.character) stateToSave.character.imageUrl = '';
        if (stateToSave.npcs) {
          Object.keys(stateToSave.npcs).forEach(npcId => {
            if (stateToSave.npcs[npcId]) stateToSave.npcs[npcId].imageUrl = '';
          });
        }
        if (stateToSave.combatState) {
          stateToSave.combatState.enemies.forEach((enemy: Enemy) => { enemy.imageUrl = ''; });
        }
        if (stateToSave.currentChapterPlan) stateToSave.currentChapterPlan.mapImageUrl = '';
        
        success = saveToLocalStorage(stateToSave);
      }

      if (!success) {
        console.warn("Still exceeding quota. Stripping currentSceneImageUrl...");
        stateToSave.currentSceneImageUrl = null;
        success = saveToLocalStorage(stateToSave);
      }

      if (!success) {
        console.warn("Still exceeding quota. Truncating story log...");
        let maxLogSize = 30;
        while (maxLogSize > 0 && !success) {
          stateToSave.storyLog = stateToSave.storyLog.slice(-maxLogSize);
          success = saveToLocalStorage(stateToSave);
          maxLogSize -= 10;
        }
      }
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
            
            // If the game was saved during prologue generation (placeholder scene), it's corrupted.
            if (savedState.gamePhase === 'prologue' && savedState.storyLog[0]?.sceneTitle === '...') {
                console.warn("Found interrupted prologue generation. Restarting from character creation.");
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                setGameState(getInitialState());
                return;
            }

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
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setGameState(getInitialState());
    setIsCharacterSheetOpen(false);
    audioService.playBgm('main_menu');
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

  const handleExportSave = useCallback(() => {
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!savedStateJSON) {
        alert("저장된 게임 데이터가 없습니다.");
        return;
      }
      const blob = new Blob([savedStateJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gemini_Chronicles_Save_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("데이터 내보내기에 실패했습니다.");
    }
  }, []);

  const handleImportSave = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("파일을 읽을 수 없습니다.");
        const importedData = JSON.parse(text);
        
        // 간단한 유효성 검사 (필수 필드 확인)
        if (!importedData.gamePhase || !importedData.storyLog) {
          throw new Error("유효하지 않은 저장 파일 형식입니다.");
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, text);
        alert("데이터를 성공적으로 불러왔습니다. 페이지를 새로고침합니다.");
        window.location.reload();
      } catch (error: any) {
        console.error("Import failed:", error);
        alert(`데이터 불러오기 실패: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  return {
    gameState,
    setGameState,
    handleStartCreation,
    handleContinueGame,
    handleNewGame,
    addUiEffect,
    removeUiEffect,
    handleExportSave,
    handleImportSave,
  };
};
