import { generateChapterPlan, generateScene, summarizeText, generateCharacterImage, generateSummary, generateCombatTurnResult, generateMapImage } from './geminiService';
import { Character, ChapterPlan, GeminiResponse, StoryLogEntry, Item, SystemMessagePart, StoryPartType, AiScenePart, Npc, SpecialAction, SpecialActionType, WorldMap, Enemy, CombatState, GeminiCombatResponse } from '../types';
import { processStateChanges } from './stateManagerService';

export const initializeGame = async (character: Character, useImageGeneration: boolean): Promise<{
  chapterPlan: ChapterPlan;
  initialLocationId: string;
  worldMap: WorldMap;
}> => {
  const planData = await generateChapterPlan(character, []);
  
  const locations = planData?.locations;
  const locationIds = locations ? Object.keys(locations) : [];

  // More robust check: ensure there is at least one valid location with a name.
  if (locationIds.length === 0 || !locations[locationIds[0]]?.name) {
      throw new Error("AI가 생성한 챕터 계획에 유효한 시작 장소가 없습니다. 다시 시도해 주세요.");
  }

  const mapImageUrl = useImageGeneration ? await generateMapImage(planData.locations) : '';

  const chapterPlan: ChapterPlan = {
      ...planData,
      mapImageUrl: mapImageUrl,
  };

  const initialLocationId = locationIds[0];
  return { chapterPlan, initialLocationId, worldMap: chapterPlan.locations };
};

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
  currentDay: number,
  useImageGeneration: boolean,
  entityImages: Record<string, string> = {}
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
            const talkActionText = `"${action.payload}에게 말을 건다."`;
            return { 
                actionResult: await processPlayerAction(talkActionText, character, storyLog, currentPlan, chapterSummaries, currentNpcs, currentLocationId, worldMap, currentTime, currentDay, useImageGeneration, entityImages) 
            };

        case SpecialActionType.USE_ITEM:
            if (!action.payload) throw new Error("사용할 아이템이 지정되지 않았습니다.");
            const useItemActionText = `"${action.payload}을(를) 사용한다."`;
             return { 
                actionResult: await processPlayerAction(useItemActionText, character, storyLog, currentPlan, chapterSummaries, currentNpcs, currentLocationId, worldMap, currentTime, currentDay, useImageGeneration, entityImages) 
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
  currentDay: number,
  useImageGeneration: boolean,
  entityImages: Record<string, string> = {}
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
  newEntityImages: Record<string, string>;
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

      const planData = await generateChapterPlan(character, updatedSummaries);
      const mapImageUrl = useImageGeneration ? await generateMapImage(planData.locations) : '';
      plan = { ...planData, mapImageUrl };
      
      updatedWorldMap = plan.locations;
      updatedLocationId = Object.keys(updatedWorldMap)[0]; // Start at the first location of the new chapter
  }

  const newScene = await generateScene(character, storyLog, actionText, plan, updatedNpcs, updatedLocationId, updatedWorldMap, currentTime, currentDay);
  
  const { npcs: newNpcs, newEntityImages: updatedEntityImages1 } = await processNewNpcs(newScene, useImageGeneration, entityImages);
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

  let newEntityImages = { ...updatedEntityImages1 };
  let enemiesToBattle: Enemy[] | undefined = undefined;
  if (newScene.enterCombat && newScene.enterCombat.length > 0) {
      systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `전투 시작!` });
      enemiesToBattle = [];
      for (const enemyData of newScene.enterCombat) {
          try {
              let imageUrl = '';
              if (useImageGeneration) {
                  if (newEntityImages[enemyData.name]) {
                      imageUrl = newEntityImages[enemyData.name];
                  } else {
                      imageUrl = await generateCharacterImage(enemyData.imagePrompt, enemyData.name);
                      newEntityImages[enemyData.name] = imageUrl;
                  }
              }
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

  return { newScene, updatedCharacter: currentCharacter, updatedPlan: plan, systemMessages, updatedSummaries, updatedNpcs, updatedLocationId, updatedWorldMap, enemiesToBattle, shop, newEntityImages };
};

export const processPlayerCombatAction = async (
    character: Character,
    combatState: CombatState,
    actionText: string
): Promise<GeminiCombatResponse> => {
    const result = await generateCombatTurnResult(character, combatState, actionText);
    return result;
};

const processNewNpcs = async (scene: GeminiResponse, useImageGeneration: boolean, entityImages: Record<string, string>): Promise<{ npcs: Record<string, Npc>, newEntityImages: Record<string, string> }> => {
    const npcs: Record<string, Npc> = {};
    let newEntityImages = { ...entityImages };
    if (!scene.newNpcs) {
        return { npcs, newEntityImages };
    }
    const npcImagePromises = scene.newNpcs.map(async (npcData) => {
        try {
            let imageUrl = '';
            if (useImageGeneration) {
                if (newEntityImages[npcData.name]) {
                    imageUrl = newEntityImages[npcData.name];
                } else {
                    imageUrl = await generateCharacterImage(npcData.imagePrompt, npcData.name);
                    newEntityImages[npcData.name] = imageUrl;
                }
            }
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
    return { npcs, newEntityImages };
};