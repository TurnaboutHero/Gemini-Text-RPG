import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, History, ScrollText, ShoppingBag, User } from "lucide-react";

import { StoryPartType, AiScenePart } from './types';
import { useGame } from './contexts/GameContext';
import { useBackgroundMusic } from './hooks/useBackgroundMusic';

// Components
import Introduction from './components/Introduction';
import CharacterCreator from './components/CharacterCreator';
import Prologue from './components/Prologue';
import LoadingSpinner from './components/LoadingSpinner';
import CharacterSheet from './components/CharacterSheet';
import SkillCheckPrompt from './components/SkillCheckPrompt';
import ActionInput from './components/ActionInput';
import SuggestedActions from './components/SuggestedActions';
import ActionMenu from './components/ActionMenu';
import Header from './components/Header';
import QuestLog from './components/QuestLog';
import SkillMenu from './components/SkillMenu';
import Shop from './components/Shop';
import WorldMapComponent from './components/WorldMap';
import CombatUI from './components/CombatUI';
import GameOver from './components/GameOver';
import UiEffects from './components/UiEffects';
import CurrentScene from './components/CurrentScene';

// Tabs
import DialogueTab from './components/tabs/DialogueTab';
import LogTab from './components/tabs/LogTab';
import QuestTab from './components/tabs/QuestTab';
import InventoryTab from './components/tabs/InventoryTab';
import ProfileTab from './components/tabs/ProfileTab';

import { LOCAL_STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const {
    gameState,
    setGameState,
    calculatedStats,
    actions,
    inventory,
    combat
  } = useGame();

  const audioService = useBackgroundMusic();
  const [isAudioMuted, setIsAudioMuted] = useState(audioService.getIsMuted());

  const handleToggleAudio = useCallback(() => {
    setIsAudioMuted(audioService.toggleMute());
  }, [audioService]);

  const {
    handleStartCreation,
    handleContinueGame,
    handleNewGame,
    handleExportSave,
    handleImportSave,
    handleSendAction,
    handleCharacterCreate,
    handleContinueToGame,
    handleExecuteSpecialAction,
    handleRollSkillCheck,
    handleRestartFromDefeat,
    addUiEffect,
    removeUiEffect,
  } = actions;

  const { handleEquipItem, handleUnequipItem, handleUseItem, handleBuyItem, handleSellItem } = inventory;
  const { handleCombatActionSubmit, handleUseSkill, handleSetTarget } = combat;

  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dialogue' | 'log' | 'quest' | 'items' | 'profile'>('dialogue');
  const [savedGameExists, setSavedGameExists] = useState(() => !!localStorage.getItem(LOCAL_STORAGE_KEY));
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (activeTab === 'dialogue') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = mainScrollRef.current.scrollHeight;
      }
    };

    const timeoutId = setTimeout(scrollToBottom, 100);
    
    if (gameState.gamePhase === 'start_menu') {
      setSavedGameExists(!!localStorage.getItem(LOCAL_STORAGE_KEY));
    }

    return () => clearTimeout(timeoutId);
  }, [gameState.storyLog, activeTab, gameState.gamePhase]);

  const isActionDisabled = () => {
    if (gameState.isLoading || gameState.currentSkillCheck || gameState.gamePhase === 'in_combat') return true;
    const lastPart = gameState.storyLog[gameState.storyLog.length - 1];
    return lastPart?.type === StoryPartType.AI_SCENE && lastPart.isGeneratingImage;
  };

  const latestAiScene = [...gameState.storyLog].reverse().find(p => p.type === StoryPartType.AI_SCENE) as AiScenePart | undefined;

  const currentLocationName = React.useMemo(() => {
    if (gameState.currentLocationId && gameState.worldMap) {
      return gameState.worldMap[gameState.currentLocationId]?.name || "알 수 없는 장소";
    }
    return "알 수 없는 장소";
  }, [gameState.currentLocationId, gameState.worldMap]);

  const toggleImageGeneration = useCallback(() => {
    setGameState(prev => ({ ...prev, useImageGeneration: !prev.useImageGeneration }));
  }, [setGameState]);

  if (gameState.gamePhase === 'start_menu') return (
    <Introduction 
      onStartCreation={handleStartCreation} 
      onContinueGame={handleContinueGame} 
      hasSavedGame={savedGameExists} 
      onExportSave={handleExportSave}
      onImportSave={handleImportSave}
    />
  );

  if (gameState.gamePhase === 'character_creation') return (
    <CharacterCreator 
      onCharacterCreate={handleCharacterCreate} 
      initialUseImageGeneration={gameState.useImageGeneration} 
      initialImageModel={gameState.imageModel} 
      error={gameState.error} 
    />
  );

  if (gameState.gamePhase === 'prologue') {
    if (gameState.error) {
      return (
        <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-2xl text-red-400 mb-4 font-adventure">오류 발생</h2>
          <p className="text-gray-300 mb-6">{gameState.error}</p>
          <button onClick={() => window.location.reload()} className="bg-primary text-bg-deep font-bold rounded-lg py-2 px-6 hover:bg-primary/80 transition-all">새로고침</button>
        </div>
      );
    }
    const prologuePart = gameState.storyLog[0] as AiScenePart | undefined;
    if (gameState.isLoading || !prologuePart) {
      return (
        <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-primary animate-pulse font-adventure tracking-widest">{gameState.loadingMessage || '모험의 서막을 여는 중...'}</p>
        </div>
      );
    }
    return <Prologue character={gameState.character!} prologue={prologuePart} chapterPlan={gameState.currentChapterPlan!} onContinue={handleContinueToGame} />;
  }

  if (gameState.gamePhase === 'game_over') return <GameOver onRestart={handleRestartFromDefeat} onNewGame={() => handleNewGame(setIsCharacterSheetOpen)} />;

  return (
    <div className={`h-[100dvh] flex flex-col bg-bg-deep text-gray-100 selection:bg-primary/30 selection:text-primary overflow-hidden font-sans ${gameState.isShaking ? 'animate-shake' : ''}`}>
      <UiEffects effects={gameState.uiEffects} onEffectEnd={removeUiEffect} />
      
      <Header 
        title={gameState.currentChapterPlan?.chapterTitle || "제미나이 연대기"} 
        currentTime={gameState.currentTime} 
        currentLocationName={currentLocationName}
        useImageGeneration={gameState.useImageGeneration}
        isAudioMuted={isAudioMuted}
        onToggleImageGeneration={toggleImageGeneration}
        onToggleAudio={handleToggleAudio}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenCharacterSheet={() => setIsCharacterSheetOpen(true)}
      />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Main Panel (Left) - Story & Actions */}
        <main className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-primary/10 bg-grid-pattern relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState.gamePhase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col h-full"
            >
              {gameState.gamePhase === 'in_combat' ? (
                <CombatUI 
                  character={gameState.character!}
                  combatState={gameState.combatState!}
                  onCombatAction={handleCombatActionSubmit}
                  onOpenSkillMenu={() => setIsSkillMenuOpen(true)}
                  onOpenInventory={() => setIsInventoryOpen(true)}
                  onSetTarget={handleSetTarget}
                  isLoading={gameState.isLoading}
                />
              ) : (
                <>
                  <div ref={mainScrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                    <div className="max-w-4xl mx-auto w-full">
                      {latestAiScene ? (
                        <CurrentScene 
                          part={latestAiScene} 
                          character={gameState.character} 
                          npcs={gameState.npcs} 
                          useImageGeneration={gameState.useImageGeneration}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500 italic">
                          이야기를 불러오는 중...
                        </div>
                      )}
                    </div>
                  </div>

                  <footer className="p-6 md:p-8 bg-gradient-to-t from-bg-deep via-bg-deep/95 to-transparent backdrop-blur-sm space-y-6 shrink-0 relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    {gameState.isLoading ? (
                      <div className="flex flex-col items-center justify-center py-4 space-y-3">
                        <LoadingSpinner />
                        <p className="text-[10px] font-adventure text-primary/60 animate-pulse tracking-[0.4em] uppercase">구상 중...</p>
                      </div>
                    ) : gameState.currentSkillCheck ? (
                      <SkillCheckPrompt skillCheck={gameState.currentSkillCheck} onRoll={handleRollSkillCheck} />
                    ) : (
                      <div className="max-w-4xl mx-auto space-y-5">
                        <SuggestedActions actions={gameState.suggestedActions} onActionSelect={handleSendAction} disabled={isActionDisabled()} />
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-primary/10 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                          <ActionInput onSubmit={handleSendAction} onOpenActionMenu={() => setGameState(p => ({ ...p, isActionMenuOpen: true }))} disabled={isActionDisabled()} />
                        </div>
                      </div>
                    )}
                  </footer>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Side Panel (Right) - History & Data */}
        <aside className="flex w-full lg:w-[450px] h-1/3 lg:h-auto flex-col bg-bg-card/20 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/5 overflow-hidden shrink-0 shadow-2xl z-10">
          <div className="flex border-b border-white/5 bg-bg-deep/20 p-1 gap-1">
            {[
              { id: 'dialogue', label: '대화', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'log', label: '로그', icon: <History className="w-4 h-4" /> },
              { id: 'quest', label: '퀘스트', icon: <ScrollText className="w-4 h-4" /> },
              { id: 'items', label: '아이템', icon: <ShoppingBag className="w-4 h-4" /> },
              { id: 'profile', label: '프로필', icon: <User className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all relative group ${activeTab === tab.id ? 'bg-primary/10 text-primary shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              >
                <div className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {tab.icon}
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabGlow" 
                    className="absolute inset-0 rounded-xl border border-primary/30 pointer-events-none"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent bg-gradient-to-b from-transparent to-bg-deep/20">
            {activeTab === 'dialogue' && <DialogueTab gameState={gameState} chatEndRef={chatEndRef} />}
            {activeTab === 'log' && <LogTab gameState={gameState} />}
            {activeTab === 'quest' && <QuestTab gameState={gameState} />}
            {activeTab === 'items' && <InventoryTab gameState={gameState} onEquipItem={handleEquipItem} onUnequipItem={handleUnequipItem} onUseItem={handleUseItem} />}
            {activeTab === 'profile' && <ProfileTab gameState={gameState} onOpenCharacterSheet={() => setIsCharacterSheetOpen(true)} />}
          </div>
        </aside>
      </div>

      <AnimatePresence>
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
        {!!gameState.currentShop && gameState.character && (
            <Shop
              character={gameState.character}
              shop={gameState.currentShop}
              onClose={() => setGameState(prev => ({ ...prev, currentShop: null }))}
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
      </AnimatePresence>
      
      <ActionMenu 
        isOpen={gameState.isActionMenuOpen} 
        onClose={() => setGameState(p => ({ ...p, isActionMenuOpen: false }))} 
        onExecuteAction={handleExecuteSpecialAction} 
        character={gameState.character} 
        npcs={gameState.npcs}
      />
      
      {isInventoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-bg-deep/50">
              <h2 className="text-lg font-adventure text-primary tracking-widest uppercase">인벤토리</h2>
              <button onClick={() => setIsInventoryOpen(false)} className="text-gray-500 hover:text-white transition-colors">닫기</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <InventoryTab gameState={gameState} onEquipItem={handleEquipItem} onUnequipItem={handleUnequipItem} onUseItem={handleUseItem} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
