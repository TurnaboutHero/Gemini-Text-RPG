import { Chat } from "@google/genai";

// Fix: Add missing BgmTrack and SfxClip type definitions.
export type BgmTrack =
  | 'none'
  | 'main_menu'
  | 'character_creation'
  | 'adventure'
  | 'combat'
  | 'game_over';

export type SfxClip =
  | 'ui_click'
  | 'ui_confirm'
  | 'ui_cancel'
  | 'combat_attack'
  | 'combat_skill'
  | 'combat_hit_player'
  | 'combat_hit_enemy'
  | 'event_levelup'
  | 'event_buy'
  | 'event_sell'
  | 'event_equip';

export enum StoryPartType {
  AI_SCENE = 'ai_scene',
  USER = 'user',
  SYSTEM_MESSAGE = 'system_message',
}

export interface UserStoryPart {
  id: string;
  type: StoryPartType.USER;
  text: string;
}

export interface SystemMessagePart {
  id: string;
  type: StoryPartType.SYSTEM_MESSAGE;
  text: string;
}

export interface SkillCheck {
  ability: Ability;
  difficulty: number;
}

// New content block types for structured narrative
export type ContentBlock = NarrationBlock | DialogueBlock | ThoughtBlock | ActionBlock;

export interface NarrationBlock {
  type: 'narration';
  text: string;
}

export interface DialogueBlock {
  type: 'dialogue';
  characterName: string;
  dialogue: string;
}

export interface ThoughtBlock {
  type: 'thought';
  text: string;
}

export interface ActionBlock {
    type: 'action';
    text: string;
}

// NPC type
export interface Npc {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    affinity: number; // 0-100
}

export interface AiScenePart {
  id: string;
  type: StoryPartType.AI_SCENE;
  text: string;
  contentBlocks?: ContentBlock[];
  sceneTitle: string;
  imagePrompt: string;
  imageUrl: string;
  isGeneratingImage: boolean;
  videoUrl?: string;
  isGeneratingVideo?: boolean;
  suggestedActions: string[];
  skillCheck?: SkillCheck;
  isChapterComplete?: boolean;
}

export type StoryLogEntry = UserStoryPart | AiScenePart | SystemMessagePart;

export type Ability = '힘' | '민첩' | '건강' | '지능' | '지혜' | '매력';

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'quest' | 'misc';
export type ItemSlot = 'mainHand' | 'offHand' | 'armor' | 'none';
export type StatEffect = Ability | 'attack' | 'defense' | 'maxHp' | 'maxMp';

export interface Item {
  id: string;
  name: string;
  description: string;
  value: number;
  itemType: ItemType;
  slot: ItemSlot;
  effects?: Partial<Record<StatEffect, number>>;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  cooldown: number; // in turns
  effect: string; // A descriptive string for now, could be an object later
}

export interface Character {
  name: string;
  race: string;
  class: string;
  background: string;
  abilityScores: Record<Ability, number>;
  equipment: {
    mainHand: string | null;
    offHand: string | null;
    armor: string | null;
  };
  imageUrl?: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  statusEffects: string[];
  inventory: Item[];
  skills: Skill[];
  gold: number;
}

export type GamePhase = 'start_menu' | 'character_creation' | 'prologue' | 'in_game' | 'in_combat' | 'game_over';

export interface ChapterPlotPoint {
  objective: string;
  details: string;
  completed: boolean;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  exits: Record<string, string>; // e.g., { "북쪽": "location_id_2" }
}

export type WorldMap = Record<string, Location>;

export interface ChapterPlan {
  chapterTitle: string;
  overallGoal: string;
  plotPoints: ChapterPlotPoint[];
  currentPlotPointIndex: number;
  locations: WorldMap;
  mapImageUrl: string;
}

export enum SpecialActionType {
  SUMMARY = 'SUMMARY',
  TALK_TO_NPC = 'TALK_TO_NPC',
  USE_ITEM = 'USE_ITEM',
  DESCRIBE_CHARACTER = 'DESCRIBE_CHARACTER',
  DESCRIBE_ENVIRONMENT = 'DESCRIBE_ENVIRONMENT',
  INITIATE_CONVERSATION = 'INITIATE_CONVERSATION',
}

export interface SpecialAction {
  type: SpecialActionType;
  payload?: string; // For NPC name or Item name
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  imageUrl: string;
  statusEffects?: string[];
  isShaking?: boolean;
}

export interface UiEffect {
    id: string;
    text: string;
    color: string; // e.g., 'text-red-500', 'text-green-400'
    elementId: string;
}

export interface CombatState {
  enemies: Enemy[];
  turn: 'player' | 'enemy';
  combatLog: string[];
  playerTargetId: string | null;
  skillCooldowns: Record<string, number>; // skill.id -> turns remaining
}

export type ImageModel = 'gemini-2.5-flash-image' | 'imagen-4.0-generate-001' | 'gemini-3-pro-image-preview' | 'gemini-3.1-flash-image-preview';

export interface GameState {
  storyLog: StoryLogEntry[];
  isLoading: boolean;
  loadingMessage?: string;
  error: string | null;
  character: Character | null;
  gamePhase: GamePhase;
  suggestedActions: string[];
  currentSkillCheck: SkillCheck | null;
  currentChapterPlan: ChapterPlan | null;
  chapterSummaries: string[];
  npcs: Record<string, Npc>;
  isActionMenuOpen: boolean;
  worldMap: WorldMap | null;
  currentLocationId: string | null;
  currentTime: number; // 0-23 representing hours
  currentDay: number;
  combatState: CombatState | null;
  currentShop: { name: string; inventory: Item[] } | null;
  uiEffects: UiEffect[];
  useImageGeneration: boolean;
  imageModel: ImageModel;
  hasApiKey: boolean;
  currentSceneImageUrl: string | null;
  locationImages: Record<string, string>;
  entityImages: Record<string, string>;
  isShaking?: boolean;
}

type GeminiItem = {
    name: string;
    description: string;
    value: number;
    itemType: ItemType;
    slot: ItemSlot;
    effects?: Partial<Record<StatEffect, number>>;
};

export interface GeminiResponse {
  sceneTitle: string;
  imagePrompt: string;
  text?: string;
  contentBlocks?: ContentBlock[];
  suggestedActions: string[];
  skillCheck?: SkillCheck;
  xpGained?: number;
  hpChange?: number;
  itemsGained?: GeminiItem[];
  itemsLost?: string[];
  statusEffect?: { name: string, type: 'add' | 'remove' };
  isChapterComplete?: boolean;
  isPlotPointComplete?: boolean;
  imageGenerationSetting?: 'NONE' | 'EDIT' | 'GENERATE';
  newNpcs?: { name: string; description: string; imagePrompt: string }[];
  npcAffinityChanges?: { npcName: string; change: number }[];
  goldChange?: number;
  playerMovedTo?: string; // New location ID
  timeElapsed?: number; // in hours
  enterCombat?: { name: string; hp: number; attack: number; defense: number; imagePrompt: string; }[];
  skillLearned?: {
    name: string;
    description: string;
    mpCost: number;
    cooldown: number;
    effect: string;
  };
  shopInventory?: { shopName: string; items: GeminiItem[] };
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface GeminiCombatResponse {
  combatLogEntry: string;
  damageDealt?: {
    targetId: string;
    amount: number;
  }[];
  playerHpChange?: number;
  playerMpChange?: number;
  statusEffectApplied?: {
    target: 'player' | string; // 'player' or enemyId
    name: string;
    duration: number; // in turns
  };
  statusEffectRemoved?: {
    target: 'player' | string;
    name: string;
  };
  skillUsed?: string; // name of skill
}