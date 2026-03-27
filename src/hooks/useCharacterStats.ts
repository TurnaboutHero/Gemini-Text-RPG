import { Character, StatEffect } from '../types';
import { useMemo } from 'react';

export const useCharacterStats = (character: Character | null) => {
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
