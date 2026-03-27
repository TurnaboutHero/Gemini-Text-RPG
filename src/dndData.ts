import { Ability, Skill, Item, ItemSlot, ItemType, StatEffect } from './types';

export const RACES = [
  { name: '드워프', description: '강인한 체력과 전투 능력을 지닌 종족.', abilityScoreBonuses: { '건강': 2 } },
  { name: '엘프', description: '민첩하고 마법에 친숙한 종족.', abilityScoreBonuses: { '민첩': 2 } },
  { name: '하플링', description: '작지만 민첩하고 행운이 따르는 종족.', abilityScoreBonuses: { '민첩': 2 } },
  { name: '인간', description: '다재다능하고 적응력이 뛰어난 종족.', abilityScoreBonuses: { '힘': 1, '민첩': 1, '건강': 1, '지능': 1, '지혜': 1, '매력': 1 } },
];

type StartingItem = {
    name: string;
    value: number;
    itemType: ItemType;
    slot: ItemSlot;
    effects?: Partial<Record<StatEffect, number>>;
};

export const CLASSES: {
  name: string;
  description: string;
  baseHp: number;
  baseMp: number;
  equipment: StartingItem[];
  recommendedAbilities: Ability[];
  startingSkills: Skill[];
}[] = [
  { 
    name: '전사', 
    description: '모든 무기와 갑옷에 능숙한 근접 전투 전문가.', 
    baseHp: 10,
    baseMp: 10,
    equipment: [
        { name: '사슬 갑옷', value: 75, itemType: 'armor', slot: 'armor', effects: { defense: 4 } }, 
        { name: '전투 도끼', value: 10, itemType: 'weapon', slot: 'mainHand', effects: { attack: 3 } }, 
        { name: '방패', value: 10, itemType: 'weapon', slot: 'offHand', effects: { defense: 2 } }, 
        { name: '손도끼', value: 5, itemType: 'weapon', slot: 'mainHand', effects: { attack: 2 } }
    ],
    recommendedAbilities: ['힘', '건강', '민첩', '지혜', '매력', '지능'],
    startingSkills: [
        { id: 'skill_warrior_power_strike', name: '강타', description: '무기를 힘껏 휘둘러 추가 피해를 입힙니다.', mpCost: 5, cooldown: 2, effect: 'STR + 1d6 damage' }
    ]
  },
  { 
    name: '도적', 
    description: '은신과 속임수로 적을 교란하는 민첩한 모험가.', 
    baseHp: 8,
    baseMp: 15,
    equipment: [
        { name: '가죽 갑옷', value: 10, itemType: 'armor', slot: 'armor', effects: { defense: 2 } },
        { name: '단검', value: 2, itemType: 'weapon', slot: 'mainHand', effects: { attack: 2 } },
        { name: '짧은 활', value: 25, itemType: 'weapon', slot: 'mainHand', effects: { attack: 3 } }
    ],
    recommendedAbilities: ['민첩', '매력', '지혜', '지능', '건강', '힘'],
    startingSkills: [
        { id: 'skill_rogue_quick_strike', name: '급소 공격', description: '적의 약점을 노려 치명적인 피해를 입힙니다.', mpCost: 7, cooldown: 3, effect: 'DEX + 1d8 damage' }
    ]
  },
  { 
    name: '성직자', 
    description: '신성한 힘으로 아군을 치유하고 보호하는 사제.', 
    baseHp: 8,
    baseMp: 20,
    equipment: [
        { name: '비늘 갑옷', value: 50, itemType: 'armor', slot: 'armor', effects: { defense: 3 } },
        { name: '메이스', value: 5, itemType: 'weapon', slot: 'mainHand', effects: { attack: 3 } },
        { name: '성스러운 상징', value: 5, itemType: 'misc', slot: 'none' },
    ],
    recommendedAbilities: ['지혜', '힘', '건강', '매력', '민첩', '지능'],
    startingSkills: [
        { id: 'skill_cleric_heal', name: '치유의 빛', description: '신성한 빛으로 자신의 상처를 회복합니다.', mpCost: 8, cooldown: 2, effect: 'Heals 1d8 + WIS HP' }
    ]
  },
  { 
    name: '마법사', 
    description: '강력한 비전 마법으로 현실을 조작하는 학자.', 
    baseHp: 6,
    baseMp: 25,
    equipment: [
        { name: '쿼터스태프', value: 1, itemType: 'weapon', slot: 'mainHand', effects: { attack: 2 } },
        { name: '마법서', value: 50, itemType: 'misc', slot: 'none' },
        { name: '주문 재료 주머니', value: 25, itemType: 'misc', slot: 'none' }
    ],
    recommendedAbilities: ['지능', '건강', '민첩', '지혜', '매력', '힘'],
    startingSkills: [
        { id: 'skill_mage_magic_missile', name: '마법 화살', description: '절대 빗나가지 않는 마법 화살을 발사합니다.', mpCost: 6, cooldown: 0, effect: 'Deals 1d4 + INT damage' }
    ]
  },
];

export const BACKGROUNDS: {
    name: string;
    description: string;
    equipment: StartingItem[];
    startingGold: number;
}[] = [
  { name: '귀족', description: '높은 신분으로 태어나 권위와 특권을 가집니다.', equipment: [{ name: '고급 옷', value: 15, itemType: 'misc', slot: 'none' }, { name: '인장 반지', value: 5, itemType: 'misc', slot: 'none' }, { name: '혈통서', value: 0, itemType: 'quest', slot: 'none' }], startingGold: 25 },
  { name: '병사', description: '전쟁 경험을 통해 강한 규율과 전투 기술을 익혔습니다.', equipment: [{ name: '계급 휘장', value: 1, itemType: 'misc', slot: 'none' }, { name: '전리품', value: 5, itemType: 'misc', slot: 'none' }, { name: '뼈 주사위 세트', value: 1, itemType: 'misc', slot: 'none' }, { name: '평상복', value: 2, itemType: 'misc', slot: 'none' }], startingGold: 10 },
  { name: '학자', description: '고대의 지식과 비밀을 탐구하는 데 평생을 바쳤습니다.', equipment: [{ name: '학자용 로브', value: 3, itemType: 'misc', slot: 'none' }, { name: '양피지', value: 1, itemType: 'misc', slot: 'none' }, { name: '잉크병', value: 10, itemType: 'misc', slot: 'none' }], startingGold: 5 },
  { name: '범죄자', description: '뒷골목의 법칙에 익숙하며, 은밀한 정보망을 가지고 있습니다.', equipment: [{ name: '어두운 색의 평상복', value: 2, itemType: 'misc', slot: 'none' }, { name: '쇠지렛대', value: 2, itemType: 'misc', slot: 'none' }], startingGold: 15 },
];

export const ABILITIES: Ability[] = ['힘', '민첩', '건강', '지능', '지혜', '매력'];
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];