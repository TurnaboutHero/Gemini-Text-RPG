// Fix: Corrected the import statement for React and its hooks.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GameState, StoryLogEntry, UserStoryPart, AiScenePart, StoryPartType, Character, SystemMessagePart, Item, SpecialAction, Enemy, ItemSlot } from './types';
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
import { audioService } from './services/audioService';
import WorldMapComponent from './components/WorldMap';

import { LOCAL_STORAGE_KEY, INITIAL_TIME, INITIAL_DAY, MAX_HOURS_PER_DAY } from './constants';
import { useCharacterStats } from './hooks/useCharacterStats';
import { useInventory } from './hooks/useInventory';
import { useCombat } from './hooks/useCombat';
import { useGameState, getInitialState } from './hooks/useGameState';
import { useGameActions } from './hooks/useGameActions';
import ResourceBar from './components/ResourceBar';
import CombatUI from './components/CombatUI';
import GameOver from './components/GameOver';
import UiEffects from './components/UiEffects';

type LastAction =
    | { type: 'sendAction', payload: string }
    | { type: 'specialAction', payload: SpecialAction }
    | { type: 'combatAction', payload: string };

const App: React.FC = () => {
  const {
    gameState,
    setGameState,
    handleStartCreation,
    handleContinueGame,
    handleNewGame,
    addUiEffect,
    removeUiEffect,
  } = useGameState();
  
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [savedGameExists, setSavedGameExists] = useState(() => !!localStorage.getItem(LOCAL_STORAGE_KEY));

  useEffect(() => {
    if (gameState.gamePhase === 'start_menu') {
      setSavedGameExists(!!localStorage.getItem(LOCAL_STORAGE_KEY));
    }
  }, [gameState.gamePhase]);

  const calculatedStats = useCharacterStats(gameState.character);
  
  const {
    handleSendAction,
    handleCharacterCreate,
    handleContinueToGame,
    handleExecuteSpecialAction,
    handleRollSkillCheck,
    handleRestartFromDefeat,
    handleRetry,
    lastActionRef
  } = useGameActions(
    gameState,
    setGameState,
    addUiEffect,
    handleNewGame,
    handleContinueGame,
    setIsCharacterSheetOpen
  );

  const { handleBuyItem, handleSellItem, handleEquipItem, handleUnequipItem } = useInventory(setGameState);
  const { handleCombatActionSubmit, handleUseSkill, handleSetTarget } = useCombat(
    gameState,
    setGameState,
    calculatedStats,
    addUiEffect,
    handleSendAction
  );

  const isActionDisabled = () => {
    if (gameState.isLoading || gameState.currentSkillCheck || gameState.gamePhase === 'in_combat') return true;
    const lastPart = gameState.storyLog[gameState.storyLog.length - 1];
    return lastPart?.type === StoryPartType.AI_SCENE && lastPart.isGeneratingImage;
  };

  if (gameState.gamePhase === 'start_menu') return <Introduction onStartCreation={handleStartCreation} onContinueGame={handleContinueGame} hasSavedGame={savedGameExists} />;
  if (gameState.gamePhase === 'character_creation') return <CharacterCreator onCharacterCreate={handleCharacterCreate} initialUseImageGeneration={gameState.useImageGeneration} initialImageModel={gameState.imageModel} error={gameState.error} />;
  if (gameState.gamePhase === 'prologue') {
    if (gameState.error) {
      return ( <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center p-4"><h2 className="text-2xl text-red-400 mb-4">오류 발생</h2><p className="text-gray-300 mb-6">{gameState.error}</p><button onClick={() => setGameState(getInitialState())} className="bg-cyan-600 text-white font-bold rounded-lg py-2 px-6 hover:bg-cyan-500">처음으로 돌아가기</button></div> );
    }
    const prologuePart = gameState.storyLog[0] as AiScenePart | undefined;
    if (gameState.isLoading || !prologuePart) {
      return ( <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center"><LoadingSpinner /><p className="mt-4 text-lg text-gray-300 animate-pulse">{gameState.loadingMessage || '모험의 서막을 여는 중...'}</p></div> );
    }
    if (!gameState.character || !gameState.currentChapterPlan) {
      return ( <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center p-4"><h2 className="text-2xl text-red-400 mb-4">오류 발생</h2><p className="text-gray-300 mb-6">{gameState.error || "모험을 시작하는데 필요한 정보를 불러오지 못했습니다."}</p><button onClick={() => setGameState(getInitialState())} className="bg-cyan-600 text-white font-bold rounded-lg py-2 px-6 hover:bg-cyan-500">처음으로 돌아가기</button></div> );
    }
    return <Prologue character={gameState.character} prologue={prologuePart} chapterPlan={gameState.currentChapterPlan} onContinue={handleContinueToGame} />;
  }
  if (gameState.gamePhase === 'game_over') return <GameOver onRestart={handleRestartFromDefeat} onNewGame={() => handleNewGame(setIsCharacterSheetOpen)} />;

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
             <Header 
                locationName={currentLocationName} 
                currentDay={gameState.currentDay} 
                currentTime={gameState.currentTime} 
                useImageGeneration={gameState.useImageGeneration}
                onOpenQuestLog={() => setIsQuestLogOpen(true)}
                onOpenMap={() => setIsMapOpen(true)}
                onToggleImageGeneration={() => setGameState(prev => ({ ...prev, useImageGeneration: !prev.useImageGeneration }))}
                onOpenCharacterSheet={() => setIsCharacterSheetOpen(true)}
             />
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
      {isCharacterSheetOpen && gameState.character && (
        <CharacterSheet
            character={gameState.character}
            calculatedStats={calculatedStats}
            onClose={() => setIsCharacterSheetOpen(false)}
            onNewGame={() => handleNewGame(setIsCharacterSheetOpen)}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
        />
      )}
      {isQuestLogOpen && gameState.currentChapterPlan && <QuestLog plan={gameState.currentChapterPlan} onClose={() => setIsQuestLogOpen(false)} />}
      {isSkillMenuOpen && gameState.character && gameState.combatState && <SkillMenu skills={gameState.character.skills} characterMp={gameState.character.mp} cooldowns={gameState.combatState.skillCooldowns} targetId={gameState.combatState.playerTargetId} onUseSkill={(skill) => handleUseSkill(skill, gameState.combatState!.playerTargetId, setIsSkillMenuOpen)} onClose={() => setIsSkillMenuOpen(false)} />}
      {isShopOpen && gameState.character && gameState.currentShop && (
          <Shop
            character={gameState.character}
            shop={gameState.currentShop}
            onClose={() => setIsShopOpen(false)}
            onBuy={handleBuyItem}
            onSell={handleSellItem}
          />
      )}
      {isMapOpen && gameState.currentChapterPlan && (
        <WorldMapComponent
            worldMap={gameState.worldMap}
            currentLocationId={gameState.currentLocationId}
            mapImageUrl={gameState.currentChapterPlan.mapImageUrl}
            onClose={() => setIsMapOpen(false)}
        />
      )}
      <ActionMenu isOpen={gameState.isActionMenuOpen} onClose={() => setGameState(p => ({ ...p, isActionMenuOpen: false }))} onExecuteAction={handleExecuteSpecialAction} character={gameState.character} npcs={gameState.npcs}/>
    </>
  );
};

export default App;