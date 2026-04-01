import React, { createContext, useContext, ReactNode } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useGameActions } from '../hooks/useGameActions';
import { useInventory } from '../hooks/useInventory';
import { useCombat } from '../hooks/useCombat';
import { useCharacterStats } from '../hooks/useCharacterStats';
import { GameState, Character, ImageModel, SpecialAction, Item, ItemSlot, Skill } from '../types';

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  calculatedStats: any;
  actions: {
    handleStartCreation: () => void;
    handleContinueGame: () => void;
    handleNewGame: (setIsCharacterSheetOpen: (isOpen: boolean) => void) => void;
    handleExportSave: () => void;
    handleImportSave: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleSendAction: (action: string) => void;
    handleCharacterCreate: (character: Character, useImageGeneration: boolean, imageModel: ImageModel) => Promise<void>;
    handleContinueToGame: () => void;
    handleExecuteSpecialAction: (action: SpecialAction) => void;
    handleRollSkillCheck: () => void;
    handleRestartFromDefeat: () => void;
    handleRetry: () => void;
    addUiEffect: (text: string, color: string, elementId: string) => void;
    removeUiEffect: (id: string) => void;
  };
  inventory: {
    handleBuyItem: (item: Item) => void;
    handleSellItem: (item: Item) => void;
    handleEquipItem: (item: Item) => void;
    handleUnequipItem: (slot: ItemSlot) => void;
    handleUseItem: (item: Item) => void;
  };
  combat: {
    handleCombatActionSubmit: (action: string) => Promise<void>;
    handleUseSkill: (skill: Skill, targetId: string | null, setIsSkillMenuOpen: (isOpen: boolean) => void) => void;
    handleSetTarget: (targetId: string) => void;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const gameStateHook = useGameState();
  const { gameState, setGameState, addUiEffect, removeUiEffect, handleNewGame, handleContinueGame } = gameStateHook;
  
  const calculatedStats = useCharacterStats(gameState.character);
  
  const gameActions = useGameActions(
    gameState,
    setGameState,
    addUiEffect,
    handleNewGame,
    handleContinueGame,
    () => {} // Placeholder for setIsCharacterSheetOpen, will handle in App or via local state
  );

  const inventoryActions = useInventory(setGameState);
  
  const combatActions = useCombat(
    gameState,
    setGameState,
    calculatedStats,
    addUiEffect,
    gameActions.handleSendAction
  );

  const value: GameContextType = {
    gameState,
    setGameState,
    calculatedStats,
    actions: {
      handleStartCreation: gameStateHook.handleStartCreation,
      handleContinueGame: gameStateHook.handleContinueGame,
      handleNewGame: gameStateHook.handleNewGame,
      handleExportSave: gameStateHook.handleExportSave,
      handleImportSave: gameStateHook.handleImportSave,
      handleSendAction: gameActions.handleSendAction,
      handleCharacterCreate: gameActions.handleCharacterCreate,
      handleContinueToGame: gameActions.handleContinueToGame,
      handleExecuteSpecialAction: gameActions.handleExecuteSpecialAction,
      handleRollSkillCheck: gameActions.handleRollSkillCheck,
      handleRestartFromDefeat: gameActions.handleRestartFromDefeat,
      handleRetry: gameActions.handleRetry,
      addUiEffect,
      removeUiEffect,
    },
    inventory: inventoryActions,
    combat: combatActions,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
