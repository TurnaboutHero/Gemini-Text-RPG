import { useCallback } from 'react';
import { GameState, Item, ItemSlot, StoryPartType, SystemMessagePart } from '../types';
import { audioService } from '../services/audioService';

export const useInventory = (
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const handleBuyItem = useCallback((item: Item) => {
    setGameState(prev => {
      if (!prev.character) return prev;

      const price = item.value * 2;
      if (prev.character.gold < price) {
        return { ...prev, error: "골드가 부족합니다." };
      }
      
      const newCharacter = {
        ...prev.character,
        gold: prev.character.gold - price,
        inventory: [...prev.character.inventory, { ...item, id: crypto.randomUUID() }]
      };
      
      const systemMessage: SystemMessagePart = {
        id: crypto.randomUUID(),
        type: StoryPartType.SYSTEM_MESSAGE,
        text: `${item.name}을(를) ${price}G에 구매했습니다.`
      };
      
      audioService.playSfx('event_buy');
      return {
        ...prev,
        character: newCharacter,
        storyLog: [...prev.storyLog, systemMessage],
        error: null
      };
    });
  }, [setGameState]);

  const handleSellItem = useCallback((item: Item) => {
    setGameState(prev => {
      if (!prev.character) return prev;
      
      const price = item.value;
      const newInventory = prev.character.inventory.filter(i => i.id !== item.id);
      
      const newCharacter = {
        ...prev.character,
        gold: prev.character.gold + price,
        inventory: newInventory
      };

      const systemMessage: SystemMessagePart = {
        id: crypto.randomUUID(),
        type: StoryPartType.SYSTEM_MESSAGE,
        text: `${item.name}을(를) ${price}G에 판매했습니다.`
      };
      
      audioService.playSfx('event_sell');
      return {
        ...prev,
        character: newCharacter,
        storyLog: [...prev.storyLog, systemMessage],
        error: null
      };
    });
  }, [setGameState]);

  const handleEquipItem = useCallback((itemToEquip: Item) => {
    setGameState(prev => {
      if (!prev.character || itemToEquip.slot === 'none') return prev;
      
      const newEquipment = { ...prev.character.equipment };
      newEquipment[itemToEquip.slot] = itemToEquip.id;
      
      audioService.playSfx('event_equip');
      return {
        ...prev,
        character: { ...prev.character, equipment: newEquipment }
      };
    });
  }, [setGameState]);

  const handleUnequipItem = useCallback((slot: ItemSlot) => {
    setGameState(prev => {
      if (!prev.character || slot === 'none') return prev;
      
      const newEquipment = { ...prev.character.equipment };
      newEquipment[slot] = null;
      
      audioService.playSfx('ui_click');
      return {
        ...prev,
        character: { ...prev.character, equipment: newEquipment }
      };
    });
  }, [setGameState]);

  const handleUseItem = useCallback((item: Item) => {
    setGameState(prev => {
      if (!prev.character || item.itemType !== 'consumable') return prev;

      const newCharacter = { ...prev.character };
      const newInventory = newCharacter.inventory.filter(i => i.id !== item.id);
      newCharacter.inventory = newInventory;

      let message = `${item.name}을(를) 사용했습니다.`;

      if (item.effects) {
        if (item.effects.maxHp) {
          newCharacter.hp = Math.min(newCharacter.maxHp, newCharacter.hp + item.effects.maxHp);
          message += ` 체력이 ${item.effects.maxHp} 회복되었습니다.`;
        }
        if (item.effects.maxMp) {
          newCharacter.mp = Math.min(newCharacter.maxMp, newCharacter.mp + item.effects.maxMp);
          message += ` 마나가 ${item.effects.maxMp} 회복되었습니다.`;
        }
      }

      const systemMessage: SystemMessagePart = {
        id: crypto.randomUUID(),
        type: StoryPartType.SYSTEM_MESSAGE,
        text: message
      };

      audioService.playSfx('ui_click');

      return {
        ...prev,
        character: newCharacter,
        storyLog: [...prev.storyLog, systemMessage]
      };
    });
  }, [setGameState]);

  return {
    handleBuyItem,
    handleSellItem,
    handleEquipItem,
    handleUnequipItem,
    handleUseItem,
  };
};
