

import { GoogleGenAI, Chat, Type, Modality, Content } from "@google/genai";
import { GeminiResponse, Character, StoryLogEntry, StoryPartType, AiScenePart, ChapterPlan, ContentBlock, Npc, WorldMap, ItemSlot, ItemType, Ability, CombatState, GeminiCombatResponse } from '../types';
import { SYSTEM_INSTRUCTION_INTERACTOR, SYSTEM_INSTRUCTION_PLANNER, SYSTEM_INSTRUCTION_COMBAT } from "../scenarioData";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const contentBlockSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['narration', 'dialogue', 'thought', 'action'] },
        text: { type: Type.STRING, nullable: true, description: "서술, 생각, 또는 행동 텍스트." },
        characterName: { type: Type.STRING, nullable: true, description: "대화하는 캐릭터의 이름." },
        dialogue: { type: Type.STRING, nullable: true, description: "캐릭터의 대사." },
    },
    required: ["type"]
};

const itemEffectsSchema = {
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
};

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        value: { type: Type.INTEGER },
        itemType: { type: Type.STRING, enum: ['weapon', 'armor', 'consumable', 'quest', 'misc'] as ItemType[] },
        slot: { type: Type.STRING, enum: ['mainHand', 'offHand', 'armor', 'none'] as ItemSlot[] },
        effects: itemEffectsSchema,
    },
    required: ["name", "description", "value", "itemType", "slot"]
};


const sceneResponseSchema = {
    type: Type.OBJECT,
    properties: {
        sceneTitle: { type: Type.STRING, description: "현재 장면에 대한 짧고 연상적인 제목." },
        imagePrompt: { type: Type.STRING, description: "이미지 생성을 위한 간결하고 묘사적인 문구." },
        content: { type: Type.ARRAY, description: "장면을 구성하는 콘텐츠 블록의 배열.", items: contentBlockSchema },
        suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "플레이어에게 제공할 3-4개의 추천 행동." },
        skillCheck: {
            type: Type.OBJECT, nullable: true,
            properties: {
                ability: { type: Type.STRING },
                difficulty: { type: Type.INTEGER }
            },
        },
        xpGained: { type: Type.INTEGER, nullable: true },
        hpChange: { type: Type.INTEGER, nullable: true },
        goldChange: { type: Type.INTEGER, nullable: true },
        playerMovedTo: { type: Type.STRING, nullable: true },
        timeElapsed: { type: Type.INTEGER, nullable: true, description: "이 행동으로 인해 경과된 시간 (시간 단위)." },
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
                }, required: ["name", "description", "imagePrompt"]
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
    required: ["sceneTitle", "imagePrompt", "content", "suggestedActions"],
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
        skillUsed: { type: Type.STRING, nullable: true, description: "사용된 스킬의 이름." }
    },
    required: ["combatLogEntry"]
};


const handleImageGenerationError = (error: unknown, context: string): Error => {
    console.error(`Error generating image (${context}):`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
        return new Error('API 이미지 생성 할당량을 초과했습니다. Google AI Studio에서 요금제를 확인하거나 잠시 후 다시 시도해 주세요.');
    }
    return new Error(`${context} 이미지를 생성하지 못했습니다.`);
};

export const generateChapterPlan = async (character: Character, previousChapterSummaries: string[]): Promise<Omit<ChapterPlan, 'mapImageUrl'>> => {
    const MAX_RETRIES = 3;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const characterInfo = `플레이어 캐릭터: ${character.name}, ${character.race} ${character.class}.`;
            const summaryInfo = previousChapterSummaries.length > 0
                ? `\n\n**이전 모험 요약:**\n- ${previousChapterSummaries.join('\n- ')}`
                : "";
            
            let prompt = `${characterInfo}${summaryInfo}\n\n위 정보를 바탕으로 이 캐릭터의 다음 모험 챕터 계획을 세워주세요.\n\n**매우 중요:**\n응답은 제공된 JSON 스키마를 **반드시** 준수해야 합니다. 'locations' 필드는 **필수 항목**이며, 절대 생략하거나 빈 배열로 두어서는 안 됩니다. 이 규칙을 위반하면 결과가 실패 처리됩니다. 모든 텍스트는 한국어로 작성해주세요.`;
            
            if (attempt > 1) {
                const example = `
"locations": [
  {
    "id": "village_square",
    "name": "마을 광장",
    "description": "활기찬 시장과 우물이 있는 마을의 중심부입니다.",
    "exits": [
      { "direction": "북쪽", "locationId": "tavern" },
      { "direction": "동쪽", "locationId": "blacksmith" }
    ]
  },
  {
    "id": "tavern",
    "name": "주점",
    "description": "모험가들이 모여 정보를 교환하는 시끄러운 곳입니다.",
    "exits": [
      { "direction": "남쪽", "locationId": "village_square" }
    ]
  }
]`;
                const failureReason = lastError || "'locations' 필드가 누락되었거나 형식이 잘못되었습니다.";
                prompt += `\n\n**수정 지시:** 이전 시도가 실패했습니다 (실패 사유: ${failureReason}). 응답을 다시 생성하세요. **'locations' 필드를 반드시 포함하고, 제공된 JSON 스키마의 모든 요구사항을 완벽하게 준수해야 합니다.** 아래는 'locations' 필드의 올바른 예시입니다:\n${example}`;
            }
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION_PLANNER,
                    responseMimeType: "application/json",
                    responseSchema: chapterPlanSchema,
                },
            });
            const parsedResponse = JSON.parse(response.text.trim());

            let locationsArray: any[] | undefined;
            let validationError: string | null = null;

            if (!parsedResponse.locations) {
                validationError = "'locations' 필드가 누락되었습니다.";
            } else if (Array.isArray(parsedResponse.locations)) {
                locationsArray = parsedResponse.locations;
            } else if (typeof parsedResponse.locations === 'object' && parsedResponse.locations !== null) {
                console.warn("AI가 'locations'를 객체로 반환하여 배열로 변환합니다.");
                locationsArray = Object.entries(parsedResponse.locations).map(([id, locData]) => ({
                    id,
                    ...(locData as object),
                }));
            } else {
                validationError = `'locations' 필드가 배열이나 객체가 아닙니다 (타입: ${typeof parsedResponse.locations}).`;
            }

            if (locationsArray) {
                 const validLocations = locationsArray.filter((loc: any) =>
                    loc && typeof loc.id === 'string' && loc.id.trim() !== '' &&
                    typeof loc.name === 'string' && loc.name.trim() !== ''
                );
                
                if (validLocations.length > 0) {
                    const worldMap: WorldMap = validLocations.reduce((acc: WorldMap, loc: any) => {
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
                } else {
                    validationError = "'locations' 배열이 비어 있거나 유효한 장소(id, name 필요)가 없습니다.";
                }
            } else if (!validationError) {
                validationError = "'locations' 필드의 형식이 잘못되었습니다.";
            }
            
            console.error(`Attempt ${attempt}: Chapter plan generation validation failed: ${validationError}. Raw response:`, response.text.trim());
            lastError = validationError;

        } catch (error) {
            console.error(`챕터 계획 생성 시도 ${attempt} 중 오류 발생:`, error);
            if (error instanceof Error) {
                lastError = error.message;
            } else {
                lastError = String(error);
            }
        }
    }
    
    // If loop finishes, all retries have failed. Create a fallback plan.
    console.error("AI가 모든 재시도 후에도 유효한 챕터 계획을 생성하지 못했습니다. 대체 계획을 생성합니다.");
    const fallbackLocations: WorldMap = {
        "fallback_start": {
            id: "fallback_start",
            name: "신비로운 숲 속 공터",
            description: "안개가 자욱한 숲의 한가운데, 고요한 공터에 서 있습니다. 모험이 당신을 기다립니다.",
            exits: { "동쪽 숲길": "fallback_path" }
        },
        "fallback_path": {
            id: "fallback_path",
            name: "오래된 숲길",
            description: "이끼 낀 나무들 사이로 좁은 길이 나 있습니다. 길 끝에서 무언가 빛나고 있습니다.",
            exits: { "서쪽 공터": "fallback_start" }
        }
    };
    const fallbackPlan = {
        chapterTitle: "미지의 시작",
        overallGoal: "이 신비로운 숲을 탐험하고 무슨 일이 일어나고 있는지 알아내세요.",
        plotPoints: [
            { objective: "주변을 조사하고 단서를 찾으세요.", details: "공터에서 단서를 찾아보세요.", completed: false },
            { objective: "숲길을 따라가세요.", details: "길 끝에 무엇이 있는지 확인하세요.", completed: false }
        ],
        currentPlotPointIndex: 0,
        locations: fallbackLocations,
    };
    return fallbackPlan;
};

const serializeContentForHistory = (content: ContentBlock[]): string => {
    return content.map(block => {
        switch (block.type) {
            case 'narration':
            case 'action':
            case 'thought':
                return block.text;
            case 'dialogue':
                return `${block.characterName}: "${block.dialogue}"`;
            default:
                return '';
        }
    }).join('\n');
};

export const generateScene = async (
    character: Character,
    storyLog: StoryLogEntry[],
    playerAction: string,
    chapterPlan: ChapterPlan,
    npcs: Record<string, Npc>,
    currentLocationId: string | null,
    worldMap: WorldMap | null,
    currentTime: number,
    currentDay: number,
): Promise<GeminiResponse> => {
    try {
        const history = convertStoryLogToHistory(storyLog);
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            history: history,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_INTERACTOR,
                responseMimeType: "application/json",
                responseSchema: sceneResponseSchema,
            },
        });

        const currentPlotPoint = chapterPlan.plotPoints[chapterPlan.currentPlotPointIndex];
        const currentLocation = currentLocationId && worldMap ? worldMap[currentLocationId] : null;

        const getTimeOfDay = (hour: number) => {
            if (hour >= 5 && hour < 12) return '아침';
            if (hour >= 12 && hour < 18) return '낮';
            if (hour >= 18 && hour < 22) return '저녁';
            return '밤';
        };
        const timeOfDay = getTimeOfDay(currentTime);
        
        const contextForModel = `
        **현재 시간:** ${currentDay}일차, ${currentTime}시 (${timeOfDay})
        **현재 챕터:** "${chapterPlan.chapterTitle}"
        **챕터 목표:** ${chapterPlan.overallGoal}
        **현재 단계 목표:** ${currentPlotPoint.objective}
        **현재 위치:** ${currentLocation ? `${currentLocation.name} (${currentLocation.description})` : '알 수 없음'}
        **사용 가능한 출구:** ${currentLocation ? Object.keys(currentLocation.exits).join(', ') : '없음'}
        **현재 등장인물:** ${[character.name, ...Object.keys(npcs)].join(', ')}
        **캐릭터 상태:** HP ${character.hp}/${character.maxHp}, MP ${character.mp}/${character.maxMp}, 소지품: ${character.inventory.map(i => i.name).join(', ') || '없음'}, 소지금: ${character.gold} G
        **보유 스킬:** ${character.skills.map(s => s.name).join(', ') || '없음'}
        
        ---
        **플레이어 행동:** "${playerAction}"
        ---
        
        위 맥락에 따라 플레이어의 행동에 대한 결과를 서술하고 이야기를 계속 진행하세요.
        `;
        const result = await chat.sendMessage({ message: contextForModel });
        const text = result.text.trim();
        return JSON.parse(text);
    } catch (error)
 {
        console.error("Error generating scene:", error);
        throw new Error("이야기를 진행할 수 없습니다. AI가 응답하지 않습니다.");
    }
};

export const generateCombatTurnResult = async (
    character: Character,
    combatState: CombatState,
    playerAction: string
): Promise<GeminiCombatResponse> => {
    try {
        const enemiesInfo = combatState.enemies.map(e => `- ${e.name} (ID: ${e.id}, HP: ${e.hp}/${e.maxHp})`).join('\n');
        const target = combatState.playerTargetId ? combatState.enemies.find(e => e.id === combatState.playerTargetId) : null;
        
        const prompt = `
        **전투 상황:**
        - 플레이어: ${character.name} (HP: ${character.hp}/${character.maxHp}, MP: ${character.mp}/${character.maxMp})
        - 보유 스킬: ${character.skills.map(s => `${s.name} (MP 소모: ${s.mpCost})`).join(', ') || '없음'}
        - 적들:
        ${enemiesInfo}
        - 현재 목표: ${target ? `${target.name} (ID: ${target.id})` : '없음'}

        ---
        **플레이어 행동:** "${playerAction}"
        ---

        위 상황을 바탕으로 플레이어 행동의 결과를 판정하고 JSON으로 응답하세요.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_COMBAT,
                responseMimeType: "application/json",
                responseSchema: combatResponseSchema,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating combat turn result:", error);
        throw new Error("전투를 진행할 수 없습니다. AI가 응답하지 않습니다.");
    }
};

const convertStoryLogToHistory = (storyLog: StoryLogEntry[]): Content[] => {
    const history: Content[] = [];
    for (const entry of storyLog) {
      if (entry.type === StoryPartType.USER) {
        history.push({ role: 'user', parts: [{ text: entry.text }] });
      } else if (entry.type === StoryPartType.AI_SCENE) {
        // Serialize the content blocks into a single string for history
        const modelResponseText = serializeContentForHistory(entry.content);
        history.push({ role: 'model', parts: [{ text: modelResponseText }] });
      }
    }
    return history;
};

export const summarizeText = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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
        if (entry.type === StoryPartType.AI_SCENE) return `DM: ${serializeContentForHistory(entry.content)}`;
        if (entry.type === StoryPartType.SYSTEM_MESSAGE) return `시스템: ${entry.text}`;
        return '';
    }).join('\n');

    const summaryText = chapterSummaries.length > 0
        ? `**지금까지의 모험 요약:**\n- ${chapterSummaries.join('\n- ')}`
        : "모험이 이제 막 시작되었습니다.";

    const prompt = `당신은 플레이어의 모험을 요약해주는 현명한 음유시인입니다. 아래의 정보를 바탕으로, 현재까지의 전체적인 상황을 흥미진진하고 간결하게 요약해주세요. 플레이어에게 직접 말하는 말투를 사용해주세요.\n\n${summaryText}\n\n**최근 사건들:**\n${recentLogText}\n---`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating summary:", error);
        return "상황을 요약하는 데 실패했습니다.";
    }
};

export const generateInitialImage = async (prompt: string, model: ImageModel = 'gemini-2.5-flash-image'): Promise<string> => {
    try {
        if (model === 'imagen-4.0-generate-001') {
            const response = await ai.models.generateImages({
                model: model,
                prompt: `Epic fantasy adventure game screen, digital painting, atmospheric lighting, wide angle. ${prompt}`,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "16:9",
                }
            });
            const base64Data = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64Data}`;
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: `Epic fantasy adventure game screen, digital painting, atmospheric lighting, wide angle. ${prompt}` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
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
    } catch (error) {
        throw handleImageGenerationError(error, "초기 장면");
    }
};

export const generateMapImage = async (worldMap: WorldMap, model: ImageModel = 'gemini-2.5-flash-image'): Promise<string> => {
    try {
        const locationDescriptions = Object.values(worldMap).map(loc => {
            const exitInfo = Object.entries(loc.exits).map(([dir, destId]) => {
                const destName = worldMap[destId]?.name || '알 수 없는 곳';
                return `${dir} 방향으로 ${destName}(와)과 연결됨`;
            }).join(', ');
            return `"${loc.name}"(${loc.description}). ${exitInfo}.`;
        }).join('\n');

        const prompt = `Top-down fantasy world map, old parchment paper texture, hand-drawn style with intricate details, geographic elements like forests, mountains, rivers should be visible. The map illustrates the following connected locations:\n${locationDescriptions}\nEnsure all named locations are clearly visible and connected according to the description.`;
        
        if (model === 'imagen-4.0-generate-001') {
            const response = await ai.models.generateImages({
                model: model,
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: "16:9",
                }
            });
            const base64Data = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64Data}`;
        }

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
        if (model === 'imagen-4.0-generate-001') {
             const prompt = `Epic fantasy RPG character portrait, digital painting, detailed face. ${characterPrompt}. Centered, atmospheric lighting, high quality.`;
             const response = await ai.models.generateImages({
                model: model,
                prompt: prompt,
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
            const textPart = { text: `이 이미지를 참고하여 서사적인 판타지 RPG 캐릭터 초상화를 만들어주세요. 캐릭터 설명: "${characterPrompt}". 참고 이미지의 스타일을 유지하면서 이 설명에 맞게 캐릭터를 그려주세요. 디지털 페인팅 스타일과 분위기 있는 조명을 사용해주세요.` };
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
            const prompt = `Epic fantasy RPG character portrait, digital painting, detailed face. ${characterPrompt}. Centered, atmospheric lighting, high quality.`;
            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [
                        { text: prompt }
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
            // Imagen 4.0 doesn't support direct editing in the same way as Gemini Flash Image yet in this SDK
            // We fallback to generation or just return null if not supported
            return null; 
        }

        const imagePart = { inlineData: { data: base64ImageData, mimeType: 'image/jpeg' } };
        const textPart = { text: `이 새로운 맥락에 맞게 이미지를 미묘하게 수정하세요: ${prompt}. 전체적인 스타일과 구성을 유지하면서 새로운 이야기의 흐름을 반영해주세요.` };
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