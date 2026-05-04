

import { GoogleGenAI, Chat, Type, Modality, Content, ThinkingLevel } from "@google/genai";
import { GeminiResponse, Character, StoryLogEntry, StoryPartType, AiScenePart, ChapterPlan, ContentBlock, Npc, WorldMap, ItemSlot, ItemType, Ability, CombatState, GeminiCombatResponse, ImageModel } from '../types';
import { SYSTEM_INSTRUCTION_INTERACTOR, SYSTEM_INSTRUCTION_PLANNER, SYSTEM_INSTRUCTION_COMBAT } from "../scenarioData";
import { RACES, CLASSES, BACKGROUNDS } from "../dndData";
import { RagService } from "./ragService";
import { AgentOrchestrator, AgentHarness } from "./agentService";

const getApiKey = () => (typeof process !== 'undefined' && process.env && process.env.API_KEY) || process.env.GEMINI_API_KEY || "";

// Initialize core services
const ragService = new RagService(getApiKey());
const orchestrator = new AgentOrchestrator(getApiKey(), ragService);
const harness = new AgentHarness(getApiKey());

let isRagInitialized = false;

/**
 * Initialize RAG with game lore and data.
 */
const ensureRagInitialized = async () => {
    if (isRagInitialized) return;

    const loreData = [
        ...RACES.map(r => `종족: ${r.name} - ${r.description}`),
        ...CLASSES.map(c => `직업: ${c.name} - ${c.description}`),
        ...BACKGROUNDS.map(b => `배경: ${b.name} - ${b.description}`),
        `시스템 지침(플래너): ${SYSTEM_INSTRUCTION_PLANNER}`,
        `시스템 지침(상호작용): ${SYSTEM_INSTRUCTION_INTERACTOR}`,
        `시스템 지침(전투): ${SYSTEM_INSTRUCTION_COMBAT}`,
    ];

    await ragService.initialize(loreData);
    isRagInitialized = true;
};

const getAiInstance = () => {
    return new GoogleGenAI({ apiKey: getApiKey() });
};

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        value: { type: Type.INTEGER },
        itemType: { type: Type.STRING, enum: ['weapon', 'armor', 'consumable', 'quest', 'misc'] as ItemType[] },
        slot: { type: Type.STRING, enum: ['mainHand', 'offHand', 'armor', 'none'] as ItemSlot[] },
        effects: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                attack: { type: Type.INTEGER, nullable: true },
                defense: { type: Type.INTEGER, nullable: true },
                maxHp: { type: Type.INTEGER, nullable: true },
                maxMp: { type: Type.INTEGER, nullable: true },
                힘: { type: Type.INTEGER, nullable: true },
                민첩: { type: Type.INTEGER, nullable: true },
                건강: { type: Type.INTEGER, nullable: true },
                지능: { type: Type.INTEGER, nullable: true },
                지혜: { type: Type.INTEGER, nullable: true },
                매력: { type: Type.INTEGER, nullable: true },
            }
        },
    },
    required: ["name", "description", "value", "itemType", "slot"]
};


const sceneResponseSchema = {
    type: Type.OBJECT,
    properties: {
        sceneTitle: { type: Type.STRING, description: "현재 장면에 대한 짧고 연상적인 제목." },
        imagePrompt: { type: Type.STRING, description: "이미지 생성을 위한 간결하고 묘사적인 문구." },
        contentBlocks: {
            type: Type.ARRAY,
            description: "이야기를 구성하는 블록들 (나레이션, 대사, 생각, 행동 등).",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['narration', 'dialogue', 'thought', 'action'] },
                    text: { type: Type.STRING, nullable: true, description: "나레이션, 생각, 행동의 내용." },
                    characterName: { type: Type.STRING, nullable: true, description: "대사일 경우 캐릭터 이름." },
                    dialogue: { type: Type.STRING, nullable: true, description: "대사 내용." }
                },
                required: ["type"]
            }
        },
        suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "플레이어에게 제공할 3-4개의 추천 행동." },
        skillCheck: {
            type: Type.OBJECT, nullable: true,
            properties: {
                ability: { type: Type.STRING },
                difficulty: { type: Type.INTEGER },
                successOutcome: { type: Type.STRING, description: "판정 성공 시 예상되는 결과 요약" },
                failureOutcome: { type: Type.STRING, description: "판정 실패 시 예상되는 결과나 위험 요약" }
            },
        },
        xpGained: { type: Type.INTEGER, nullable: true },
        hpChange: { type: Type.INTEGER, nullable: true },
        goldChange: { type: Type.INTEGER, nullable: true },
        playerMovedTo: { type: Type.STRING, nullable: true },
        timeElapsed: { type: Type.INTEGER, nullable: true, description: "이 행동으로 인해 경과된 시간 (시간 단위)." },
        weatherChange: { type: Type.STRING, nullable: true, enum: ['맑음', '흐림', '비', '눈', '폭풍', '안개'], description: "시간의 흐름이나 마법적 요인으로 인한 날씨의 변화." },
        itemsGained: { type: Type.ARRAY, nullable: true, items: itemSchema },
        itemsLost: { type: Type.ARRAY, nullable: true, items: { type: Type.STRING } },
        statusEffect: {
            type: Type.OBJECT, nullable: true,
            properties: { name: { type: Type.STRING }, type: { type: Type.STRING, enum: ['add', 'remove'] } }
        },
        newNpcs: {
            type: Type.ARRAY, nullable: true, description: "장면에 새로 등장하는 NPC 목록. 처음 등장할 때만 포함하세요.",
            items: {
                type: Type.OBJECT, properties: {
                    name: { type: Type.STRING, description: "NPC의 이름." },
                    description: { type: Type.STRING, description: "NPC의 외모나 특징에 대한 간략한 묘사." },
                    imagePrompt: { type: Type.STRING, description: "NPC 초상화 생성을 위한 이미지 프롬프트." },
                    faction: { type: Type.STRING, nullable: true, description: "NPC가 소속된 파벌 또는 세력. 무소속이라면 생략 가능." },
                }, required: ["name", "description", "imagePrompt"]
            }
        },
        npcAffinityChanges: {
            type: Type.ARRAY, nullable: true, description: "NPC와의 상호작용에 따른 호감도 변화.",
            items: {
                type: Type.OBJECT, properties: {
                    npcName: { type: Type.STRING, description: "호감도가 변하는 NPC의 이름." },
                    change: { type: Type.INTEGER, description: "호감도 변화량 (예: 5, -10)." },
                }, required: ["npcName", "change"]
            }
        },
        newNpcMemories: {
            type: Type.ARRAY, nullable: true, description: "NPC가 플레이어에 대해 새롭게 기억하게 된 일들 (오랜 시간이 지나도 잊지 않을 중요한 사실들).",
            items: {
                type: Type.OBJECT, properties: {
                    npcName: { type: Type.STRING, description: "기억하는 NPC 이름." },
                    memory: { type: Type.STRING, description: "무엇을 기억하게 되었는지 (예: '나에게 소매치기를 시도했다', '나의 목숨을 구해주었다')." },
                }, required: ["npcName", "memory"]
            }
        },
        reputationChanges: {
            type: Type.ARRAY, nullable: true, description: "플레이어의 행동을 통해 변동이 생기는 특정 세력 또는 파벌에 대한 평판.",
            items: {
                type: Type.OBJECT, properties: {
                    faction: { type: Type.STRING, description: "파벌 또는 세력의 이름." },
                    change: { type: Type.INTEGER, description: "평판 변화량 (예: 5, -10)." },
                }, required: ["faction", "change"]
            }
        },
        isChapterComplete: { type: Type.BOOLEAN, nullable: true },
        isPlotPointComplete: { type: Type.BOOLEAN, nullable: true },
        imageGenerationSetting: { type: Type.STRING, nullable: true, enum: ['NONE', 'EDIT', 'GENERATE'] },
        enterCombat: {
            type: Type.ARRAY, nullable: true, description: "플레이어가 전투에 돌입할 때 적들의 목록.",
            items: {
                type: Type.OBJECT, properties: {
                    name: { type: Type.STRING },
                    hp: { type: Type.INTEGER },
                    attack: { type: Type.INTEGER },
                    defense: { type: Type.INTEGER },
                    imagePrompt: { type: Type.STRING },
                }, required: ["name", "hp", "attack", "defense", "imagePrompt"]
            }
        },
        skillLearned: {
            type: Type.OBJECT, nullable: true, description: "플레이어가 모험을 통해 새로운 스킬을 배웠을 때.",
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                mpCost: { type: Type.INTEGER },
                cooldown: { type: Type.INTEGER },
                effect: { type: Type.STRING },
            }, required: ["name", "description", "mpCost", "cooldown", "effect"]
        },
        shopInventory: {
            type: Type.OBJECT, nullable: true, description: "플레이어가 상점에 있을 때 판매 물품 목록.",
            properties: {
                shopName: { type: Type.STRING },
                items: { type: Type.ARRAY, items: itemSchema }
            },
            required: ["shopName", "items"]
        }
    },
    required: ["sceneTitle", "imagePrompt", "suggestedActions", "contentBlocks"],
};

const chapterPlanSchema = {
    type: Type.OBJECT,
    properties: {
        chapterTitle: { type: Type.STRING },
        overallGoal: { type: Type.STRING },
        plotPoints: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    objective: { type: Type.STRING },
                    details: { type: Type.STRING }
                },
                required: ["objective", "details"]
            }
        },
        locations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    exits: {
                        type: Type.ARRAY,
                        description: "다른 장소로의 출구 목록. 예: [{\"direction\": \"북쪽\", \"locationId\": \"hallway_1\"}]",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                direction: { type: Type.STRING, description: "방향 (예: '북쪽', '동쪽', '아래로')." },
                                locationId: { type: Type.STRING, description: "연결된 장소의 ID." }
                            },
                            required: ["direction", "locationId"]
                        }
                    }
                },
                required: ["id", "name", "description", "exits"]
            }
        }
    },
    required: ["chapterTitle", "overallGoal", "plotPoints", "locations"]
};

const combatResponseSchema = {
    type: Type.OBJECT,
    properties: {
        combatLogEntry: { type: Type.STRING, description: "플레이어의 행동과 그 결과를 한 문장으로 흥미진진하게 묘사합니다." },
        damageDealt: {
            type: Type.ARRAY,
            nullable: true,
            items: {
                type: Type.OBJECT,
                properties: {
                    targetId: { type: Type.STRING, description: "피해를 입은 적의 ID." },
                    amount: { type: Type.INTEGER, description: "입힌 피해량." }
                },
                required: ["targetId", "amount"]
            }
        },
        playerHpChange: { type: Type.INTEGER, nullable: true, description: "플레이어의 HP 변화량 (회복: 양수, 피해: 음수)." },
        playerMpChange: { type: Type.INTEGER, nullable: true, description: "플레이어의 MP 변화량 (소모: 음수)." },
        statusEffectApplied: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                target: { type: Type.STRING, description: "'player' 또는 적의 ID." },
                name: { type: Type.STRING, description: "적용된 상태 이상의 이름 (예: '기절', '중독')." },
                duration: { type: Type.INTEGER, description: "상태 이상의 지속 턴 수." }
            }
        },
        statusEffectRemoved: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
                target: { type: Type.STRING, description: "'player' 또는 적의 ID." },
                name: { type: Type.STRING, description: "해제된 상태 이상의 이름." }
            }
        },
        skillUsed: { type: Type.STRING, nullable: true, description: "사용된 스킬의 이름." }
    },
    required: ["combatLogEntry"]
};


const handleImageGenerationError = (error: unknown, context: string): Error => {
    console.error(`Error generating image (${context}):`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
        return new Error('API 키 권한이 없거나 유효하지 않습니다. 설정 메뉴에서 유료 프로젝트의 API 키를 다시 선택해 주세요.');
    }
    
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
        return new Error('API 이미지 생성 할당량을 초과했습니다. Google AI Studio에서 요금제를 확인하거나 잠시 후 다시 시도해 주세요.');
    }
    return new Error(`${context} 이미지를 생성하지 못했습니다.`);
};

export const generateChapterPlan = async (character: Character, previousChapterSummaries: string[]): Promise<Omit<ChapterPlan, 'mapImageUrl'>> => {
    console.log("generateChapterPlan started");

    try {
        const characterInfo = `플레이어 캐릭터: ${character.name}, ${character.race} ${character.class}.`;
        const summaryInfo = previousChapterSummaries.length > 0
            ? `\n\n**이전 모험 요약:**\n- ${previousChapterSummaries.join('\n- ')}`
            : "\n\n**참고:** 이것은 플레이어의 첫 번째 모험입니다. 반드시 안전한 마을, 주점, 또는 모험가 길드 같은 '거점(Town/Safe Zone)'에서 시작하여, 정보를 수집하고 준비할 수 있도록 챕터를 설계하세요. 첫 번째 장소(locations[0])는 반드시 이 거점이어야 합니다. 바로 던전이나 전투로 시작하지 마세요.";
        
        const prompt = `${characterInfo}${summaryInfo}\n\n위 정보를 바탕으로 이 캐릭터의 다음 모험 챕터 계획을 세워주세요.\n\n**매우 중요:**\n응답은 제공된 JSON 스키마를 **반드시** 준수해야 합니다. 'locations' 필드는 **필수 항목**이며, 절대 생략하거나 빈 배열로 두어서는 안 됩니다. 첫 번째 장소는 반드시 안전한 마을이나 거점이어야 합니다. 모든 텍스트는 한국어로 작성해주세요.`;
        
        // Use Harness for structured execution and validation
        const parsedResponse = await harness.execute<any>({
            model: 'gemini-3.1-pro-preview',
            systemInstruction: SYSTEM_INSTRUCTION_PLANNER,
            prompt,
            schema: chapterPlanSchema,
            thinkingLevel: ThinkingLevel.HIGH
        });

        let locationsArray: any[] | undefined;
        if (Array.isArray(parsedResponse.locations)) {
            locationsArray = parsedResponse.locations;
        } else if (typeof parsedResponse.locations === 'object' && parsedResponse.locations !== null) {
            locationsArray = Object.entries(parsedResponse.locations).map(([id, locData]) => ({
                id,
                ...(locData as object),
            }));
        }

        if (locationsArray && locationsArray.length > 0) {
            const worldMap: WorldMap = locationsArray.reduce((acc: WorldMap, loc: any) => {
                const exitsMap: Record<string, string> = (loc.exits || []).reduce((exitAcc: Record<string, string>, exit: { direction: string; locationId: string; }) => {
                    if (exit && exit.direction && exit.locationId) {
                        exitAcc[exit.direction] = exit.locationId;
                    }
                    return exitAcc;
                }, {});
                acc[loc.id] = { ...loc, exits: exitsMap };
                return acc;
            }, {});

            return {
                ...parsedResponse,
                plotPoints: (parsedResponse.plotPoints || []).map((p: any) => ({ ...p, completed: false })),
                currentPlotPointIndex: 0,
                locations: worldMap,
            };
        }
        throw new Error("Invalid locations data");
    } catch (error) {
        console.error("AI가 유효한 챕터 계획을 생성하지 못했습니다. 대체 계획을 생성합니다.", error);
        const fallbackLocations: WorldMap = {
            "fallback_start": {
                id: "fallback_start",
                name: "평화로운 국경 마을, '아스테리아'",
                description: "따스한 햇살이 내리쬐는 평화로운 마을입니다. 사람들은 활기차게 하루를 시작하고 있으며, 중앙 광장의 분수대 소리가 평화롭게 울려 퍼집니다. 이곳에서 모험을 준비할 수 있습니다.",
                exits: { "동쪽 숲길": "fallback_path" }
            },
            "fallback_path": {
                id: "fallback_path",
                name: "오래된 숲길",
                description: "마을 외곽으로 이어지는 이끼 낀 나무들 사이의 좁은 길입니다. 길 끝에서 무언가 불길한 기운이 느껴집니다.",
                exits: { "서쪽 마을": "fallback_start" }
            }
        };
        return {
            chapterTitle: "모험의 서막: 아스테리아의 부름",
            overallGoal: "마을 사람들과 대화하여 주변의 소문을 수집하고, 첫 번째 모험을 위한 준비를 마치세요.",
            plotPoints: [
                { objective: "마을 광장에서 정보를 수집하세요.", details: "마을 사람들과 대화하여 최근의 소문을 들어보세요.", completed: false },
                { objective: "숲길을 조사하세요.", details: "마을 외곽의 숲길에서 느껴지는 불길한 기운의 정체를 확인하세요.", completed: false }
            ],
            currentPlotPointIndex: 0,
            locations: fallbackLocations,
        };
    }
};

export const generateSceneState = async (
    character: Character,
    storyLog: StoryLogEntry[],
    playerAction: string,
    chapterPlan: ChapterPlan,
    npcs: Record<string, Npc>,
    currentLocationId: string | null,
    worldMap: WorldMap | null,
    currentTime: number,
    currentDay: number,
    currentWeather: string,
    chapterSummaries: string[] = [],
): Promise<GeminiResponse> => {
    console.log("generateSceneState started for action:", playerAction);
    try {
        await ensureRagInitialized();

        const history = convertStoryLogToHistory(storyLog, chapterSummaries);
        const currentPlotPoint = chapterPlan.plotPoints[chapterPlan.currentPlotPointIndex] || { objective: '알 수 없음' };
        const currentLocation = currentLocationId && worldMap ? worldMap[currentLocationId] : null;

        const getTimeOfDay = (hour: number) => {
            if (hour >= 5 && hour < 12) return '아침';
            if (hour >= 12 && hour < 18) return '낮';
            if (hour >= 18 && hour < 22) return '저녁';
            return '밤';
        };
        const timeOfDay = getTimeOfDay(currentTime);
        
        const npcDescriptions = Object.values(npcs).map(n => 
            `- ${n.name}: 호감도 ${n.affinity}/100, 파벌: ${n.faction || '없음'}, 기억: ${(n.memories || []).join(', ') || '없음'}`
        ).join('\n');
        
        const repDescriptions = Object.entries(character.reputations || {}).map(([faction, rep]) => 
            `- ${faction}: ${rep}`
        ).join('\n');

        const contextForModel = `
        **현재 시간/날씨:** ${currentDay}일차, ${currentTime}시 (${timeOfDay}), 날씨: ${currentWeather}
        **현재 챕터:** "${chapterPlan.chapterTitle}"
        **챕터 목표:** ${chapterPlan.overallGoal}
        **현재 단계 목표:** ${currentPlotPoint.objective}
        **현재 위치:** ${currentLocation ? `${currentLocation.name} (${currentLocation.description})` : '알 수 없음'}
        **사용 가능한 출구:** ${currentLocation ? Object.keys(currentLocation.exits).join(', ') : '없음'}
        **알고 있는 NPC 정보:**
        ${npcDescriptions || 'NPC 없음'}
        **세력 평판:**
        ${repDescriptions || '알려진 평판 없음'}
        **캐릭터 상태:** HP ${character.hp}/${character.maxHp}, MP ${character.mp}/${character.maxMp}, 소지품: ${character.inventory.map(i => i.name).join(', ') || '없음'}, 소지금: ${character.gold} G
        **보유 스킬:** ${character.skills.map(s => s.name).join(', ') || '없음'}
        
        ---
        ※ NPC의 호감도나 세력 평판에 따라, NPC의 대사가 달라질 수 있습니다. 호감도가 낮으면 적대적이거나 불친절하게 대하고 높으면 친절하게 대하세요.
        **이전 대화 기록:**
        ${JSON.stringify(history)}
        `;

        // Use Orchestrator for Multi-Agent & RAG
        const result = await orchestrator.processTurn({
            action: playerAction,
            gameState: { character, chapterPlan, currentLocationId, worldMap, npcs },
            isCombat: false,
            sceneSchema: sceneResponseSchema,
            combatSchema: combatResponseSchema,
            context: contextForModel
        }) as GeminiResponse;

        return result;
    } catch (error) {
        console.error("Error generating scene state:", error);
        throw new Error(`상태를 계산할 수 없습니다. AI가 응답하지 않습니다.`);
    }
};

export const generateCombatTurnResult = async (
    character: Character,
    combatState: CombatState,
    playerAction: string
): Promise<GeminiCombatResponse> => {
    try {
        await ensureRagInitialized();

        const contextForModel = `
        **캐릭터 상태:** HP ${character.hp}/${character.maxHp}, MP ${character.mp}/${character.maxMp}, 소지품: ${character.inventory.map(i => i.name).join(', ') || '없음'}, 소지금: ${character.gold} G
        **보유 스킬:** ${character.skills.map(s => s.name).join(', ') || '없음'}
        `;

        // Use Orchestrator for Multi-Agent combat resolution
        const result = await orchestrator.processTurn({
            action: playerAction,
            gameState: { combat: combatState, character },
            isCombat: true,
            sceneSchema: sceneResponseSchema,
            combatSchema: combatResponseSchema,
            context: contextForModel
        }) as GeminiCombatResponse;

        return result;
    } catch (error) {
        console.error("Error generating combat turn result:", error);
        throw new Error(`전투를 진행할 수 없습니다. AI가 응답하지 않습니다.`);
    }
};

export const summarizeStoryLog = async (storyLog: StoryLogEntry[]): Promise<string> => {
    try {
        const logText = storyLog.map(entry => {
            if (entry.type === StoryPartType.USER) return `플레이어: ${entry.text}`;
            if (entry.type === StoryPartType.AI_SCENE) return `DM: ${entry.text || ''}`;
            return '';
        }).join('\n');

        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: `다음은 RPG 게임의 진행 로그입니다. 지금까지의 핵심 사건, 획득한 아이템, NPC와의 관계 변화 등을 중심으로 아주 간결하게 요약해주세요. 이 요약은 다음 AI 모델의 컨텍스트로 사용됩니다.\n\n${logText}`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing story log:", error);
        return "이전 로그 요약 실패";
    }
};

const convertStoryLogToHistory = (storyLog: StoryLogEntry[], chapterSummaries: string[] = []): Content[] => {
    const history: Content[] = [];
    
    // 1. Add overall chapter summaries as context
    if (chapterSummaries.length > 0) {
        history.push({
            role: 'user',
            parts: [{ text: `[지금까지의 모험 요약]\n${chapterSummaries.join('\n')}` }]
        });
        history.push({
            role: 'model',
            parts: [{ text: "네, 지금까지의 모험 내용을 숙지했습니다. 현재 상황에 맞춰 다음 진행을 이어가겠습니다." }]
        });
    }

    // 2. Implement a sliding window for recent interactions
    // If the log is very long, we only take the most recent part and assume the rest is in summaries
    const MAX_RECENT_ENTRIES = 10;
    const recentLog = storyLog.slice(-MAX_RECENT_ENTRIES);

    // 3. If there's a significant gap between summaries and recent log, we could add a "Mid-term Summary" here
    // For now, we'll just use the sliding window
    for (const entry of recentLog) {
      if (entry.type === StoryPartType.USER) {
        history.push({ role: 'user', parts: [{ text: entry.text }] });
      } else if (entry.type === StoryPartType.AI_SCENE) {
        history.push({ role: 'model', parts: [{ text: entry.text || '' }] });
      }
    }
    return history;
};

export const summarizeText = async (text: string): Promise<string> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: `다음 게임 로그를 한 문장의 흥미로운 요약으로 만들어주세요:\n\n---\n${text}\n---`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing text:", error);
        return "요약을 생성하는 데 실패했습니다.";
    }
};

export const generateSummary = async (chapterSummaries: string[], storyLog: StoryLogEntry[]): Promise<string> => {
    const recentLogText = storyLog.slice(-10).map(entry => {
        if (entry.type === StoryPartType.USER) return `플레이어: ${entry.text}`;
        if (entry.type === StoryPartType.AI_SCENE) return `DM: ${entry.text || ''}`;
        if (entry.type === StoryPartType.SYSTEM_MESSAGE) return `시스템: ${entry.text}`;
        return '';
    }).join('\n');

    const summaryText = chapterSummaries.length > 0
        ? `**지금까지의 모험 요약:**\n- ${chapterSummaries.join('\n- ')}`
        : "모험이 이제 막 시작되었습니다.";

    const prompt = `당신은 플레이어의 모험을 요약해주는 현명한 음유시인입니다. 아래의 정보를 바탕으로, 현재까지의 전체적인 상황을 흥미진진하고 간결하게 요약해주세요. 플레이어에게 직접 말하는 말투를 사용해주세요.\n\n${summaryText}\n\n**최근 사건들:**\n${recentLogText}\n---`;

    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating summary:", error);
        return "상황을 요약하는 데 실패했습니다.";
    }
};

const buildImagePrompt = (basePrompt: string, type: 'scene' | 'character' | 'map' | 'item' = 'scene'): string => {
    const style = "Epic fantasy digital painting, highly detailed, cinematic lighting, masterpiece, 8k, concept art";
    const lighting = "dramatic shadows, atmospheric glow";
    
    switch (type) {
        case 'character':
            return `${style}, full body portrait, centered, ${lighting}. ${basePrompt}`;
        case 'map':
            return `Top-down fantasy world map, aged parchment texture, detailed cartography, hand-drawn style with intricate details. ${basePrompt}`;
        case 'item':
            return `${style}, close-up of a magical item, glowing effects, ${lighting}. ${basePrompt}`;
        case 'scene':
        default:
            return `${style}, wide angle landscape, immersive atmosphere, ${lighting}. ${basePrompt}`;
    }
};

export const generateVideoFromImage = async (prompt: string, imageUrl: string): Promise<string> => {
    try {
        console.log("generateVideoFromImage started");
        const ai = getAiInstance();
        
        // Extract base64 and mime type. Format: data:image/jpeg;base64,...
        const match = imageUrl.match(/^data:(image\/[a-zA-Z]*);base64,([^"]*)$/);
        if (!match) {
            throw new Error("올바른 이미지 형식이 아닙니다.");
        }
        const mimeType = match[1];
        const base64Data = match[2];

        const fullPrompt = prompt ? `${prompt}, cinematic movement, high quality, masterpiece` : 'Epic fantasy scene coming to life, slight camera pan, atmospheric effects, masterpiece, high quality';

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-lite-generate-preview',
            prompt: fullPrompt,
            image: {
                imageBytes: base64Data,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Polling logic
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 8000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("동영상 생성에 실패했습니다 (URL이 반환되지 않음).");

        const response = await fetch(downloadLink, {
            method: 'GET',
            headers: {
                'x-goog-api-key': getApiKey(),
            },
        });

        if (!response.ok) {
            throw new Error(`동영상 다운로드 실패: ${response.statusText}`);
        }

        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        return videoUrl;
    } catch (error) {
        console.error("Error generating video:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403') || errorMessage.includes('Requested entity was not found')) {
            throw new Error('API 키 권한이 없거나 유효하지 않습니다. 다시 선택해 주세요.');
        }
        throw new Error(`동영상을 생성하지 못했습니다: ${errorMessage}`);
    }
};

export const generateInitialImage = async (prompt: string, model: ImageModel = 'gemini-2.5-flash-image'): Promise<string> => {
    try {
        console.log("generateInitialImage started");
        const ai = getAiInstance();
        const fullPrompt = buildImagePrompt(prompt, 'scene');

        if (model === 'imagen-4.0-generate-001') {
            console.log("Calling ai.models.generateImages for initial image");
            const response = await ai.models.generateImages({
                model: model,
                prompt: fullPrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "16:9",
                }
            });
            console.log("Received response for initial image");
            const base64Data = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64Data}`;
        }

        console.log("Calling ai.models.generateContent for initial image");
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: fullPrompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                    imageSize: (model === 'gemini-3-pro-image-preview' || model === 'gemini-3.1-flash-image-preview') ? "1K" : undefined
                }
            }
        });
        console.log("Received response for initial image");

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("AI가 이미지를 반환하지 않았습니다.");
    } catch (error) {
        throw handleImageGenerationError(error, "초기 장면");
    }
};

export const generateMapImage = async (worldMap: WorldMap, model: ImageModel = 'gemini-2.5-flash-image'): Promise<string> => {
    try {
        console.log("generateMapImage started");
        const locationDescriptions = Object.values(worldMap).map(loc => {
            const exitInfo = Object.entries(loc.exits).map(([dir, destId]) => {
                const destName = worldMap[destId]?.name || '알 수 없는 곳';
                return `${dir} 방향으로 ${destName}(와)과 연결됨`;
            }).join(', ');
            return `"${loc.name}"(${loc.description}). ${exitInfo}.`;
        }).join('\n');

        const prompt = buildImagePrompt(`The map illustrates the following connected locations:\n${locationDescriptions}\nEnsure all named locations are clearly visible and connected according to the description.`, 'map');
        
        const ai = getAiInstance();
        if (model === 'imagen-4.0-generate-001') {
            console.log("Calling ai.models.generateImages for map image");
            const response = await ai.models.generateImages({
                model: model,
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "16:9",
                }
            });
            console.log("Received response for map image");
            const base64Data = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64Data}`;
        }

        console.log("Calling ai.models.generateContent for map image");
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                    imageSize: (model === 'gemini-3-pro-image-preview' || model === 'gemini-3.1-flash-image-preview') ? "1K" : undefined
                }
            }
        });
        console.log("Received response for map image");

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("AI가 지도 이미지를 반환하지 않았습니다.");
    } catch (error) {
        throw handleImageGenerationError(error, "월드맵");
    }
};


export const generateCharacterImage = async (
    characterPrompt: string,
    characterName: string,
    referenceImageBase64?: string | null,
    model: ImageModel = 'gemini-2.5-flash-image'
): Promise<string> => {
    try {
        const ai = getAiInstance();
        const fullPrompt = buildImagePrompt(characterPrompt, 'character');

        if (model === 'imagen-4.0-generate-001') {
             const response = await ai.models.generateImages({
                model: model,
                prompt: fullPrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "1:1",
                }
            });
            const base64Data = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64Data}`;
        }

        if (referenceImageBase64) {
            const base64Data = referenceImageBase64.split(',')[1];
            if (!base64Data) throw new Error("잘못된 참고 이미지 형식입니다.");
            const mimeType = referenceImageBase64.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
            const imagePart = { inlineData: { data: base64Data, mimeType: mimeType } };
            const textPart = { text: `이 이미지를 참고하여 캐릭터 초상화를 만들어주세요. ${fullPrompt}. 참고 이미지의 스타일을 유지하면서 이 설명에 맞게 캐릭터를 그려주세요.` };
            const response = await ai.models.generateContent({
                model: model,
                contents: { parts: [imagePart, textPart] },
                config: {
                    imageConfig: {
                        aspectRatio: "1:1",
                        imageSize: (model === 'gemini-3-pro-image-preview' || model === 'gemini-3.1-flash-image-preview') ? "1K" : undefined
                    }
                }
            });
            const parts = response?.candidates?.[0]?.content?.parts ?? [];
            for (const part of parts) {
                if (part.inlineData?.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            throw new Error("AI가 참고 이미지를 기반으로 이미지를 반환하지 않았습니다.");
        } else {
            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [
                        { text: fullPrompt }
                    ]
                },
                config: {
                    imageConfig: {
                        aspectRatio: "1:1",
                        imageSize: (model === 'gemini-3-pro-image-preview' || model === 'gemini-3.1-flash-image-preview') ? "1K" : undefined
                    }
                }
            });
            
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            throw new Error("AI가 이미지를 반환하지 않았습니다.");
        }
    } catch (error) {
        throw handleImageGenerationError(error, `${characterName}의`);
    }
};

export const editImage = async (prompt: string, base64ImageData: string, model: ImageModel = 'gemini-2.5-flash-image'): Promise<string | null> => {
    try {
        if (model === 'imagen-4.0-generate-001') {
            return null; 
        }

        const imagePart = { inlineData: { data: base64ImageData, mimeType: 'image/jpeg' } };
        const textPart = { text: `이 새로운 맥락에 맞게 이미지를 미묘하게 수정하세요: ${prompt}. 전체적인 스타일과 구성을 유지하면서 새로운 이야기의 흐름을 반영해주세요.` };
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
        });
        const parts = response?.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
            if (part.inlineData?.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
             throw handleImageGenerationError(error, "이미지 수정 중");
        }
        console.error("Error editing image:", error);
        return null;
    }
};

export const analyzeUi = async (currentLayout: string): Promise<string> => {
    try {
        const ai = getAiInstance();
        const prompt = `당신은 숙련된 UX/UI 디자이너이자 프론트엔드 개발자입니다. 현재 게임의 UI 구조는 다음과 같습니다:
        
        ${currentLayout}
        
        이 UI의 잠재적인 문제점을 지적하고, 사용자 경험(UX)을 향상시키기 위한 구체적인 개선 방안을 제안해주세요. 
        특히 다음 항목들에 집중해주세요:
        1. 시각적 계층 구조 (Hierarchy)
        2. 가독성 및 타이포그래피
        3. 상호작용 피드백 (Interaction Feedback)
        4. 모바일 응답성 및 접근성
        
        응답은 한국어로, 친절하고 전문적인 톤으로 작성해주세요.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing UI:", error);
        return "UI 분석 중 오류가 발생했습니다.";
    }
};
