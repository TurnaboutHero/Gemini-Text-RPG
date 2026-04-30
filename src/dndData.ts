import { Ability, Skill, Item, ItemSlot, ItemType, StatEffect } from './types';

export const RACES = [
  { name: '드워프', description: '강인한 체력과 전투 능력을 지닌 종족.', abilityScoreBonuses: { '건강': 2 } },
  { name: '엘프', description: '민첩하고 마법에 친숙한 종족.', abilityScoreBonuses: { '민첩': 2 } },
  { name: '하플링', description: '작지만 민첩하고 행운이 따르는 종족.', abilityScoreBonuses: { '민첩': 2 } },
  { name: '인간', description: '다재다능하고 적응력이 뛰어난 종족.', abilityScoreBonuses: { '힘': 1, '민첩': 1, '건강': 1, '지능': 1, '지혜': 1, '매력': 1 } },
];

type StartingItem = {
    name: string;
    description: string;
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
        { name: '사슬 갑옷', description: '무겁지만 단단한 강철로 엮어 만든 갑옷입니다. (방어력 +4)', value: 75, itemType: 'armor', slot: 'armor', effects: { defense: 4 } }, 
        { name: '전투 도끼', description: '양손으로도 휘두를 수 있는 묵직하고 날카로운 도끼입니다. (공격력 +3)', value: 10, itemType: 'weapon', slot: 'mainHand', effects: { attack: 3 } }, 
        { name: '방패', description: '한 손에 착용하여 적의 공격을 튕겨내는 튼튼한 나무 방패입니다. (방어력 +2)', value: 10, itemType: 'weapon', slot: 'offHand', effects: { defense: 2 } }, 
        { name: '손도끼', description: '가볍게 쥐고 휘두르거나 투척할 수 있는 작은 도끼입니다. (공격력 +2)', value: 5, itemType: 'weapon', slot: 'mainHand', effects: { attack: 2 } }
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
        { name: '가죽 갑옷', description: '움직임이 편하도록 부드러운 가죽으로 만든 흉갑입니다. (방어력 +2)', value: 10, itemType: 'armor', slot: 'armor', effects: { defense: 2 } },
        { name: '단검', description: '숨기기 좋고 빠르게 공격할 수 있는 짧고 날카로운 검입니다. (공격력 +2)', value: 2, itemType: 'weapon', slot: 'mainHand', effects: { attack: 2 } },
        { name: '짧은 활', description: '작은 체구에도 다루기 쉬우며 은밀한 사격에 적합한 활입니다. (공격력 +3)', value: 25, itemType: 'weapon', slot: 'mainHand', effects: { attack: 3 } }
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
        { name: '비늘 갑옷', description: '겹겹이 이은 금속 비늘이 공격을 흘려보내는 갑옷입니다. (방어력 +3)', value: 50, itemType: 'armor', slot: 'armor', effects: { defense: 3 } },
        { name: '메이스', description: '타격용으로 설계되어 갑옷을 입은 적에게도 유효한 둔기입니다. (공격력 +3)', value: 5, itemType: 'weapon', slot: 'mainHand', effects: { attack: 3 } },
        { name: '성스러운 상징', description: '신앙의 힘을 끌어내는 데 사용하는 작은 목걸이 형태의 성물입니다.', value: 5, itemType: 'misc', slot: 'none' },
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
        { name: '쿼터스태프', description: '마법 집중의 매개체로도 쓰이는 길고 단단한 나무 지팡이입니다. (공격력 +2)', value: 1, itemType: 'weapon', slot: 'mainHand', effects: { attack: 2 } },
        { name: '마법서', description: '복잡한 비전 주문과 룬이 빼곡히 적혀 있는 두꺼운 가죽 양장본입니다.', value: 50, itemType: 'misc', slot: 'none' },
        { name: '주문 재료 주머니', description: '마법 시전에 필요한 온갖 촉매와 재료가 담긴 작은 주머니입니다.', value: 25, itemType: 'misc', slot: 'none' }
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
  { name: '귀족', description: '높은 신분으로 태어나 권위와 특권을 가집니다.', equipment: [{ name: '고급 옷', description: '품위와 재물을 과시하기 위해 솜씨 좋게 지어낸 겉옷입니다.', value: 15, itemType: 'misc', slot: 'none' }, { name: '인장 반지', description: '가문의 문장이 새겨져 있어 신분을 증명할 때 쓰입니다.', value: 5, itemType: 'misc', slot: 'none' }, { name: '혈통서', description: '자신의 역사를 증명하는 가문의 공식 양피지 문서입니다.', value: 0, itemType: 'quest', slot: 'none' }], startingGold: 25 },
  { name: '병사', description: '전쟁 경험을 통해 강한 규율과 전투 기술을 익혔습니다.', equipment: [{ name: '계급 휘장', description: '전장에서 소속과 지위를 나타내던 작은 징표입니다.', value: 1, itemType: 'misc', slot: 'none' }, { name: '전리품', description: '쓰러트린 적에게서 얻어낸 상징적인 장신구입니다.', value: 5, itemType: 'misc', slot: 'none' }, { name: '뼈 주사위 세트', description: '막사에서 동료들과 시간을 보낼 때 쓰던 동물 뼈 주사위입니다.', value: 1, itemType: 'misc', slot: 'none' }, { name: '평상복', description: '질긴 천으로 만들어져 실용적이고 눈에 잘 띄지 않는 옷입니다.', value: 2, itemType: 'misc', slot: 'none' }], startingGold: 10 },
  { name: '학자', description: '고대의 지식과 비밀을 탐구하는 데 평생을 바쳤습니다.', equipment: [{ name: '학자용 로브', description: '오랜 시간 연구하기 좋게 통이 넓고 편안한 로브입니다.', value: 3, itemType: 'misc', slot: 'none' }, { name: '양피지', description: '새로운 지식을 기록할 때 쓰는 빈 낱장입니다.', value: 1, itemType: 'misc', slot: 'none' }, { name: '잉크병', description: '깃펜과 함께 사용하는 변색되지 않는 질 좋은 흑색 잉크입니다.', value: 10, itemType: 'misc', slot: 'none' }], startingGold: 5 },
  { name: '범죄자', description: '뒷골목의 법칙에 익숙하며, 은밀한 정보망을 가지고 있습니다.', equipment: [{ name: '어두운 색의 평상복', description: '어둠 속에 숨어들기 좋도록 짙은 색으로 물들인 옷입니다.', value: 2, itemType: 'misc', slot: 'none' }, { name: '쇠지렛대', description: '잠긴 상자를 뜯어내거나 문을 강제로 열 때 사용하는 도구입니다.', value: 2, itemType: 'misc', slot: 'none' }], startingGold: 15 },
];

export const ABILITIES: Ability[] = ['힘', '민첩', '건강', '지능', '지혜', '매력'];
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];