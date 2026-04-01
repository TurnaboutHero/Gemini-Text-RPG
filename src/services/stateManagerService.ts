import { Character, GeminiResponse, SystemMessagePart, StoryPartType, Item, Skill } from '../types';
import { CLASSES } from '../dndData';
import { audioService } from './audioService';

export const processStateChanges = (
  character: Character,
  response: GeminiResponse
): { updatedCharacter: Character; systemMessages: SystemMessagePart[] } => {
  let updatedCharacter = { ...character };
  const systemMessages: SystemMessagePart[] = [];

  if (response.goldChange) {
    // Limit gold change to reasonable bounds to prevent AI hallucinations
    const boundedGoldChange = Math.max(-1000, Math.min(1000, response.goldChange));
    updatedCharacter.gold += boundedGoldChange;
    const changeText = boundedGoldChange > 0 ? `획득: +${boundedGoldChange} G` : `소비: ${boundedGoldChange} G`;
    systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `골드 변경: ${changeText}` });
  }

  if (response.hpChange) {
    // Limit HP change to reasonable bounds
    const boundedHpChange = Math.max(-updatedCharacter.maxHp, Math.min(updatedCharacter.maxHp, response.hpChange));
    const oldHp = updatedCharacter.hp;
    const newHp = Math.max(0, Math.min(updatedCharacter.maxHp, oldHp + boundedHpChange));
    updatedCharacter.hp = newHp;
    const changeText = boundedHpChange > 0 ? `${boundedHpChange} HP 회복` : `${Math.abs(boundedHpChange)} 피해`;
    systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `체력 변경: ${changeText}` });
  }

  if (response.statusEffect) {
      if (response.statusEffect.type === 'add' && !updatedCharacter.statusEffects.includes(response.statusEffect.name)) {
          updatedCharacter.statusEffects.push(response.statusEffect.name);
          systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `상태 이상 발생: ${response.statusEffect.name}` });
      } else if (response.statusEffect.type === 'remove') {
          updatedCharacter.statusEffects = updatedCharacter.statusEffects.filter(e => e !== response.statusEffect.name);
          systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `상태 이상 해제: ${response.statusEffect.name}` });
      }
  }
  
  if (response.itemsGained && response.itemsGained.length > 0) {
      const validItems = response.itemsGained.filter(item => item.name && item.itemType && item.slot);
      if (validItems.length > 0) {
          const newItems: Item[] = validItems.map(itemData => ({
            ...itemData,
            id: crypto.randomUUID(),
          }));
          updatedCharacter.inventory = [...updatedCharacter.inventory, ...newItems];
          const itemNames = newItems.map(i => i.name).join(', ');
          systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `아이템 획득: ${itemNames}` });
      }
  }
  
  if (response.itemsLost && response.itemsLost.length > 0) {
    updatedCharacter.inventory = updatedCharacter.inventory.filter(item => !response.itemsLost?.includes(item.name));
    systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `아이템 상실: ${response.itemsLost.join(', ')}` });
  }

  if (response.skillLearned) {
      const newSkill: Skill = {
          ...response.skillLearned,
          id: crypto.randomUUID(),
      };
      if (!updatedCharacter.skills.some(s => s.name === newSkill.name)) {
        updatedCharacter.skills = [...updatedCharacter.skills, newSkill];
        systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `새로운 스킬 습득: ${newSkill.name}!` });
      }
  }
  
  if (response.xpGained && response.xpGained > 0) {
    updatedCharacter.xp += response.xpGained;
    systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `경험치 획득: +${response.xpGained} XP` });

    if (updatedCharacter.xp >= updatedCharacter.xpToNextLevel) {
      updatedCharacter.level += 1;
      updatedCharacter.xp -= updatedCharacter.xpToNextLevel;
      updatedCharacter.xpToNextLevel = Math.floor(updatedCharacter.xpToNextLevel * 1.5);
      const selectedClass = CLASSES.find(c => c.name === updatedCharacter.class);
      const healthModifier = Math.floor((updatedCharacter.abilityScores['건강'] - 10) / 2);
      const hpGain = (selectedClass?.baseHp || 8) / 2 + healthModifier;
      updatedCharacter.maxHp += Math.max(1, Math.floor(hpGain));
      updatedCharacter.hp = updatedCharacter.maxHp;
      systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `레벨 업! LV ${updatedCharacter.level} 달성!` });
      audioService.playSfx('event_levelup');
    }
  }

  return { updatedCharacter, systemMessages };
};
