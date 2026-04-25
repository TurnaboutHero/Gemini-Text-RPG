import { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { audioService } from '../services/audioService';
import { BgmTrack } from '../types';

export const useBackgroundMusic = () => {
  const { gameState } = useGame();
  
  useEffect(() => {
    let currentPhase: BgmTrack = 'none';

    switch (gameState.gamePhase) {
      case 'start_menu':
        currentPhase = 'main_menu';
        break;
      case 'character_creation':
        currentPhase = 'character_creation';
        break;
      case 'prologue':
      case 'in_game':
        currentPhase = 'adventure';
        break;
      case 'in_combat':
        currentPhase = 'combat';
        break;
      case 'game_over':
        currentPhase = 'game_over';
        break;
    }

    // You could also override based on location or specific story events
    // if state.currentLocationId == 'boss_room', track = 'combat'
    
    audioService.playMusic(currentPhase);

  }, [gameState.gamePhase, gameState.currentLocationId]);

  return audioService;
};
