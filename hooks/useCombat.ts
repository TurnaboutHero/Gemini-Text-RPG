import { useCallback, useEffect } from 'react';
import { GameState, StoryPartType, Skill } from '../types';
import * as orchestrator from '../services/orchestratorService';
import { audioService } from '../services/audioService';

export const useCombat = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  calculatedStats: any,
  addUiEffect: (text: string, colorClass: string, targetId: string) => void,
  handleSendAction: (actionText: string) => void
) => {
  const endPlayerTurn = useCallback(() => {
    setGameState(prev => {
      if (!prev.combatState) return prev;
      return { ...prev, combatState: { ...prev.combatState, turn: 'enemy' } };
    });
  }, [setGameState]);

  const handleCombatActionSubmit = useCallback(async (actionText: string) => {
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
              audioService.playSfx('combat_hit_enemy');
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
                audioService.playSfx('combat_skill');
            } else {
                audioService.playSfx('combat_attack');
            }
        } else {
            audioService.playSfx('combat_attack');
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
  }, [gameState.character, gameState.combatState, setGameState, addUiEffect, endPlayerTurn]);

  const handleUseSkill = useCallback((skill: Skill, targetId: string | null, setIsSkillMenuOpen: (isOpen: boolean) => void) => {
    setIsSkillMenuOpen(false);
    const target = gameState.combatState?.enemies.find(e => e.id === targetId);
    let actionText = `${skill.name} 스킬 사용.`;
    if (target) {
        actionText += ` 대상: ${target.name}.`;
    }
    handleCombatActionSubmit(actionText);
  }, [gameState.combatState?.enemies, handleCombatActionSubmit]);

  const checkCombatEnd = useCallback(() => {
    if (!gameState.combatState || !gameState.character) return;
    if (gameState.character.hp <= 0) {
        setGameState(prev => ({ ...prev, gamePhase: 'game_over' }));
        audioService.playBgm('game_over');
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
        audioService.playBgm('adventure');
        handleSendAction("전투에서 승리했다. 그 후의 상황을 묘사해줘.");
    }
  }, [gameState.combatState, gameState.character, setGameState, handleSendAction]);

  useEffect(() => {
    if(gameState.gamePhase === 'in_combat') checkCombatEnd();
  }, [gameState.combatState, gameState.character, checkCombatEnd, gameState.gamePhase]);

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
                let hitPlayer = false;

                livingEnemies.forEach(enemy => {
                     const enemyAttackRoll = Math.floor(Math.random() * 4) + 1;
                     const totalDamage = Math.max(1, enemy.attack + enemyAttackRoll - calculatedStats.defense);
                     newCharacter.hp = Math.max(0, newCharacter.hp - totalDamage);
                     newCombatLog.push(`${enemy.name}(이)가 ${newCharacter.name}에게 ${totalDamage}의 피해를 입혔다!`);
                     addUiEffect(`${totalDamage}`, 'text-yellow-400', 'player-portrait');
                     hitPlayer = true;
                });
                
                if (hitPlayer) audioService.playSfx('combat_hit_player');

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
  }, [gameState.gamePhase, gameState.combatState?.turn, calculatedStats, addUiEffect, checkCombatEnd, setGameState]);

  const handleSetTarget = useCallback((targetId: string) => {
    setGameState(prev => {
        if (!prev.combatState) return prev;
        const target = prev.combatState.enemies.find(e => e.id === targetId);
        if (target && target.hp > 0) {
            return { ...prev, combatState: { ...prev.combatState, playerTargetId: targetId } };
        }
        return prev;
    });
  }, [setGameState]);

  return {
    handleCombatActionSubmit,
    handleUseSkill,
    handleSetTarget,
  };
};
