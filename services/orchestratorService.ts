import { generateChapterPlan, generateScene, summarizeText, generateCharacterImage, generateSummary, generateCombatTurnResult } from './geminiService';
import { Character, ChapterPlan, GeminiResponse, StoryLogEntry, Item, SystemMessagePart, StoryPartType, AiScenePart, Npc, ContentBlock, SpecialAction, SpecialActionType, WorldMap, Enemy, Skill, CombatState, GeminiCombatResponse } from '../types';
import { CLASSES } from '../dndData';

export const initializeGame = async (character: Character): Promise<{
  chapterPlan: ChapterPlan;
  initialLocationId: string;
  worldMap: WorldMap;
}> => {
  const chapterPlan = await generateChapterPlan(character, []);
  
  const locations = chapterPlan?.locations;
  const locationIds = locations ? Object.keys(locations) : [];

  // More robust check: ensure there is at least one valid location with a name.
  if (locationIds.length === 0 || !locations[locationIds[0]]?.name) {
      throw new Error("AI가 생성한 챕터 계획에 유효한 시작 장소가 없습니다. 다시 시도해 주세요.");
  }

  const initialLocationId = locationIds[0];
  return { chapterPlan, initialLocationId, worldMap: chapterPlan.locations };
};

// FIX: Export PlayerActionResult type to be used in App.tsx
export type PlayerActionResult = Awaited<ReturnType<typeof processPlayerAction>>;

export const executeSpecialAction = async (
  action: SpecialAction,
  character: Character,
  storyLog: StoryLogEntry[],
  currentPlan: ChapterPlan,
  chapterSummaries: string[],
  currentNpcs: Record<string, Npc>,
  currentLocationId: string | null,
  worldMap: WorldMap | null,
  currentTime: number,
  currentDay: number
): Promise<{ summaryMessage: SystemMessagePart } | { actionResult: PlayerActionResult }> => {
    switch (action.type) {
        case SpecialActionType.SUMMARY:
            const summaryText = await generateSummary(chapterSummaries, storyLog);
            const message: SystemMessagePart = {
                id: crypto.randomUUID(),
                type: StoryPartType.SYSTEM_MESSAGE,
                text: `상황 요약: ${summaryText}`
            };
            return { summaryMessage: message };

        case SpecialActionType.TALK_TO_NPC:
            if (!action.payload) throw new Error("대화할 NPC가 지정되지 않았습니다.");
            const talkActionText = `${action.payload}에게 말을 건다.`;
            return { 
                actionResult: await processPlayerAction(talkActionText, character, storyLog, currentPlan, chapterSummaries, currentNpcs, currentLocationId, worldMap, currentTime, currentDay) 
            };

        case SpecialActionType.USE_ITEM:
            if (!action.payload) throw new Error("사용할 아이템이 지정되지 않았습니다.");
            const useItemActionText = `${action.payload}을(를) 사용한다.`;
             return { 
                actionResult: await processPlayerAction(useItemActionText, character, storyLog, currentPlan, chapterSummaries, currentNpcs, currentLocationId, worldMap, currentTime, currentDay) 
            };

        default:
            throw new Error("알 수 없는 특별 행동입니다.");
    }
};

export const processPlayerAction = async (
  actionText: string,
  character: Character,
  storyLog: StoryLogEntry[],
  currentPlan: ChapterPlan,
  chapterSummaries: string[],
  currentNpcs: Record<string, Npc>,
  currentLocationId: string | null,
  worldMap: WorldMap | null,
  currentTime: number,
  currentDay: number
): Promise<{
  newScene: GeminiResponse;
  updatedCharacter: Character;
  updatedPlan: ChapterPlan;
  systemMessages: SystemMessagePart[];
  updatedSummaries: string[];
  updatedNpcs: Record<string, Npc>;
  updatedLocationId: string | null;
  updatedWorldMap: WorldMap | null;
  enemiesToBattle?: Enemy[];
  shop?: { name: string; inventory: Item[] } | null;
}> => {
  let plan = { ...currentPlan };
  let currentCharacter = { ...character };
  let updatedSummaries = [...chapterSummaries];
  const systemMessages: SystemMessagePart[] = [];
  let updatedNpcs = { ...currentNpcs };
  let updatedLocationId = currentLocationId;
  let updatedWorldMap = worldMap;

  const lastAiPart = [...storyLog].reverse().find(p => p.type === StoryPartType.AI_SCENE) as AiScenePart | undefined;
  if (lastAiPart?.isChapterComplete) {
      let lastChapterStartIndex = 0;
      for (let i = storyLog.length - 2; i >= 0; i--) {
          const part = storyLog[i];
          if (part.type === StoryPartType.AI_SCENE && part.isChapterComplete) {
              lastChapterStartIndex = i + 1;
              break;
          }
      }
      const lastChapterLog = storyLog.slice(lastChapterStartIndex);
      
      if (lastChapterLog.length > 0) {
        const chapterTextToSummarize = lastChapterLog
            .flatMap(entry => {
                if (entry.type === StoryPartType.USER) return [entry.text];
                if (entry.type === StoryPartType.AI_SCENE) {
                    return entry.content.map(block => {
                        switch (block.type) {
                            case 'narration':
                            case 'thought':
                            case 'action':
                                return block.text;
                            case 'dialogue':
                                return `${block.characterName}: "${block.dialogue}"`;
                            default: return '';
                        }
                    });
                }
                return [];
            })
            .join('\n');
          const summary = await summarizeText(chapterTextToSummarize);
          updatedSummaries.push(summary);
          systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `지난 챕터 요약: ${summary}` });
      }

      plan = await generateChapterPlan(character, updatedSummaries);
      updatedWorldMap = plan.locations;
      updatedLocationId = Object.keys(updatedWorldMap)[0]; // Start at the first location of the new chapter
  }

  const newScene = await generateScene(character, storyLog, actionText, plan, updatedNpcs, updatedLocationId, updatedWorldMap, currentTime, currentDay);
  
  const newNpcs = await processNewNpcs(newScene);
  updatedNpcs = { ...updatedNpcs, ...newNpcs };
  
  let shop: { name: string; inventory: Item[] } | null = null;
  if (newScene.shopInventory) {
      shop = {
          name: newScene.shopInventory.shopName,
          inventory: newScene.shopInventory.items.map(itemData => ({
              ...itemData,
              id: crypto.randomUUID(),
          }))
      };
  }

  let enemiesToBattle: Enemy[] | undefined = undefined;
  if (newScene.enterCombat && newScene.enterCombat.length > 0) {
      systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `전투 시작!` });
      enemiesToBattle = [];
      for (const enemyData of newScene.enterCombat) {
          try {
              const imageUrl = await generateCharacterImage(enemyData.imagePrompt, enemyData.name);
              enemiesToBattle.push({
                  id: crypto.randomUUID(),
                  name: enemyData.name,
                  hp: enemyData.hp,
                  maxHp: enemyData.hp,
                  attack: enemyData.attack,
                  defense: enemyData.defense,
                  imageUrl: imageUrl
              });
          } catch (error) {
              console.error(`Failed to generate image for enemy ${enemyData.name}:`, error);
              enemiesToBattle.push({ // Add enemy with a placeholder/no image
                  id: crypto.randomUUID(),
                  name: enemyData.name,
                  hp: enemyData.hp,
                  maxHp: enemyData.hp,
                  attack: enemyData.attack,
                  defense: enemyData.defense,
                  imageUrl: '' // Fallback
              });
          }
      }
  }

  const { updatedCharacter, systemMessages: stateChangeMessages } = processStateChanges(currentCharacter, newScene);
  currentCharacter = updatedCharacter;
  systemMessages.push(...stateChangeMessages);
  
  if (newScene.playerMovedTo && updatedWorldMap && updatedWorldMap[newScene.playerMovedTo]) {
    updatedLocationId = newScene.playerMovedTo;
    systemMessages.push({
        id: crypto.randomUUID(),
        type: StoryPartType.SYSTEM_MESSAGE,
        text: `장소 이동: ${updatedWorldMap[updatedLocationId].name}`
    });
  }

  if (newScene.isPlotPointComplete) {
    if (plan.currentPlotPointIndex < plan.plotPoints.length - 1) {
        plan.plotPoints[plan.currentPlotPointIndex].completed = true;
        plan.currentPlotPointIndex++;
        const nextPlotPoint = plan.plotPoints[plan.currentPlotPointIndex];
        systemMessages.push({ 
            id: crypto.randomUUID(), 
            type: StoryPartType.SYSTEM_MESSAGE, 
            text: `단계 목표 달성! 다음 목표: ${nextPlotPoint.objective}` 
        });
    }
  }

  return { newScene, updatedCharacter: currentCharacter, updatedPlan: plan, systemMessages, updatedSummaries, updatedNpcs, updatedLocationId, updatedWorldMap, enemiesToBattle, shop };
};

export const processPlayerCombatAction = async (
    character: Character,
    combatState: CombatState,
    actionText: string
): Promise<GeminiCombatResponse> => {
    const result = await generateCombatTurnResult(character, combatState, actionText);
    return result;
};

const processNewNpcs = async (scene: GeminiResponse): Promise<Record<string, Npc>> => {
    const npcs: Record<string, Npc> = {};
    if (!scene.newNpcs) {
        return npcs;
    }
    const npcImagePromises = scene.newNpcs.map(async (npcData) => {
        try {
            const imageUrl = await generateCharacterImage(npcData.imagePrompt, npcData.name);
            return {
                name: npcData.name,
                data: {
                    id: crypto.randomUUID(),
                    name: npcData.name,
                    description: npcData.description,
                    imageUrl: imageUrl,
                }
            };
        } catch (error) {
            console.error(`Failed to generate image for NPC ${npcData.name}:`, error);
            return {
                name: npcData.name,
                data: {
                    id: crypto.randomUUID(),
                    name: npcData.name,
                    description: npcData.description,
                    imageUrl: '', // Fallback image
                }
            };
        }
    });

    const results = await Promise.all(npcImagePromises);
    for (const result of results) {
        npcs[result.name] = result.data;
    }
    return npcs;
};

const processStateChanges = (
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
    }
  }

  return { updatedCharacter, systemMessages };
};