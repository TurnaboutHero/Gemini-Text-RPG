import { generateChapterPlan, generateSceneState, summarizeText, generateCharacterImage, generateSummary, generateCombatTurnResult, generateMapImage } from './geminiService';
import { Character, ChapterPlan, GeminiResponse, StoryLogEntry, Item, SystemMessagePart, StoryPartType, AiScenePart, Npc, SpecialAction, SpecialActionType, WorldMap, Enemy, CombatState, GeminiCombatResponse, ImageModel } from '../types';
import { processStateChanges } from './stateManagerService';

export const initializeGame = async (character: Character, useImageGeneration: boolean, imageModel: ImageModel = 'gemini-2.5-flash-image'): Promise<{
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

  const mapImageUrl = useImageGeneration ? await generateMapImage(planData.locations, imageModel) : '';

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
  imageModel: ImageModel = 'gemini-2.5-flash-image',
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
                actionResult: await processPlayerAction(talkActionText, character, storyLog, currentPlan, chapterSummaries, currentNpcs, currentLocationId, worldMap, currentTime, currentDay, useImageGeneration, imageModel, entityImages) 
            };

        case SpecialActionType.USE_ITEM:
            if (!action.payload) throw new Error("사용할 아이템이 지정되지 않았습니다.");
            const useItemActionText = `"${action.payload}을(를) 사용한다."`;
             return { 
                actionResult: await processPlayerAction(useItemActionText, character, storyLog, currentPlan, chapterSummaries, currentNpcs, currentLocationId, worldMap, currentTime, currentDay, useImageGeneration, imageModel, entityImages) 
            };

        default:
            throw new Error("알 수 없는 특별 행동입니다.");
    }
};

export interface ImagePromiseResult {
    type: 'npc' | 'enemy';
    id: string;
    name: string;
    imageUrl: string;
}

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
  imageModel: ImageModel = 'gemini-2.5-flash-image',
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
  imagePromises: Promise<ImagePromiseResult>[];
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
                    return [entry.text || ''];
                }
                return [];
            })
            .join('\n');
          const summary = await summarizeText(chapterTextToSummarize);
          updatedSummaries.push(summary);
          systemMessages.push({ id: crypto.randomUUID(), type: StoryPartType.SYSTEM_MESSAGE, text: `지난 챕터 요약: ${summary}` });
      }

      const planData = await generateChapterPlan(character, updatedSummaries);
      const mapImageUrl = useImageGeneration ? await generateMapImage(planData.locations, imageModel) : '';
      plan = { ...planData, mapImageUrl };
      
      updatedWorldMap = plan.locations;
      updatedLocationId = Object.keys(updatedWorldMap)[0]; // Start at the first location of the new chapter
  }

  const newScene = await generateSceneState(character, storyLog, actionText, plan, updatedNpcs, updatedLocationId, updatedWorldMap, currentTime, currentDay, updatedSummaries);
  
  const imagePromises: Promise<ImagePromiseResult>[] = [];
  let newEntityImages = { ...entityImages };

  if (newScene.newNpcs) {
      for (const npcData of newScene.newNpcs) {
          const id = crypto.randomUUID();
          updatedNpcs[id] = {
              id,
              name: npcData.name,
              description: npcData.description,
              imageUrl: newEntityImages[npcData.name] || '',
          };
          if (useImageGeneration && !newEntityImages[npcData.name]) {
              const p = generateCharacterImage(npcData.imagePrompt, npcData.name, null, imageModel)
                  .then(url => ({ type: 'npc' as const, id, name: npcData.name, imageUrl: url }))
                  .catch(err => {
                      console.error(`Failed to generate image for NPC ${npcData.name}:`, err);
                      return { type: 'npc' as const, id, name: npcData.name, imageUrl: '' };
                  });
              imagePromises.push(p);
          }
      }
  }
  
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
          const id = crypto.randomUUID();
          enemiesToBattle.push({
              id,
              name: enemyData.name,
              hp: enemyData.hp,
              maxHp: enemyData.hp,
              attack: enemyData.attack,
              defense: enemyData.defense,
              imageUrl: newEntityImages[enemyData.name] || ''
          });
          if (useImageGeneration && !newEntityImages[enemyData.name]) {
              const p = generateCharacterImage(enemyData.imagePrompt, enemyData.name, null, imageModel)
                  .then(url => ({ type: 'enemy' as const, id, name: enemyData.name, imageUrl: url }))
                  .catch(err => {
                      console.error(`Failed to generate image for enemy ${enemyData.name}:`, err);
                      return { type: 'enemy' as const, id, name: enemyData.name, imageUrl: '' };
                  });
              imagePromises.push(p);
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

  return { newScene, updatedCharacter: currentCharacter, updatedPlan: plan, systemMessages, updatedSummaries, updatedNpcs, updatedLocationId, updatedWorldMap, enemiesToBattle, shop, newEntityImages, imagePromises };
};

export const processPlayerCombatAction = async (
    character: Character,
    combatState: CombatState,
    actionText: string
): Promise<GeminiCombatResponse> => {
    const result = await generateCombatTurnResult(character, combatState, actionText);
    return result;
};