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
    updatedCharacter.gold += response.goldChange;
    const changeText = response.goldChange > 0 ? `획득: +${response.goldChange} G` : `소비: ${response.goldChange} G`;
    systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `골드 변경: ${changeText}` });
  }

  if (response.hpChange) {
    const oldHp = updatedCharacter.hp;
    const newHp = Math.max(0, Math.min(updatedCharacter.maxHp, oldHp + response.hpChange));
    updatedCharacter.hp = newHp;
    const changeText = response.hpChange > 0 ? `${response.hpChange} HP 회복` : `${Math.abs(response.hpChange)} 피해`;
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
      const newItems: Item[] = response.itemsGained.map(itemData => ({
        ...itemData,
        id: crypto.randomUUID(),
      }));
      updatedCharacter.inventory = [...updatedCharacter.inventory, ...newItems];
      const itemNames = newItems.map(i => i.name).join(', ');
      systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `아이템 획득: ${itemNames}` });
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
