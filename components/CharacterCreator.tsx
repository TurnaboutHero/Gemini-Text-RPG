import React, { useState, useMemo, useEffect } from 'react';
import { Character, Ability, Item, ItemSlot, ImageModel } from '../types';
import { RACES, CLASSES, BACKGROUNDS, ABILITIES, STANDARD_ARRAY } from '../dndData';
import { generateCharacterImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface CharacterCreatorProps {
  onCharacterCreate: (character: Character, useImageGeneration: boolean, imageModel: ImageModel) => Promise<void>;
  initialUseImageGeneration: boolean;
  initialImageModel: ImageModel;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCharacterCreate, initialUseImageGeneration, initialImageModel }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [character, setCharacter] = useState({
    name: '',
    race: '',
    class: '',
    background: '',
  });

  const [baseScores, setBaseScores] = useState<Record<Ability, number>>({
    '힘': 0, '민첩': 0, '건강': 0, '지능': 0, '지혜': 0, '매력': 0,
  });

  const [startingInventory, setStartingInventory] = useState<Item[]>([]);
  const [characterImageUrl, setCharacterImageUrl] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [useImageGeneration, setUseImageGeneration] = useState(initialUseImageGeneration);
  const [imageModel, setImageModel] = useState<ImageModel>(initialImageModel);

  const racialBonuses = useMemo(() => {
    const raceData = RACES.find(r => r.name === character.race);
    return raceData?.abilityScoreBonuses || {};
  }, [character.race]);

  const finalScores = useMemo(() => {
    const scores: Record<Ability, number> = { ...baseScores };
    for (const ability of ABILITIES) {
      const base = baseScores[ability] || 0;
      const bonus = (racialBonuses as Record<string, number>)[ability] || 0;
      scores[ability] = base + bonus;
    }
    return scores;
  }, [baseScores, racialBonuses]);

  useEffect(() => {
    const classData = CLASSES.find(c => c.name === character.class);
    const backgroundData = BACKGROUNDS.find(b => b.name === character.background);
    const equipmentData = [
      ...(classData?.equipment || []),
      ...(backgroundData?.equipment || []),
    ];
    
    const newInventory: Item[] = equipmentData.map(itemData => ({
      ...itemData,
      id: crypto.randomUUID(),
      description: '시작 장비입니다.',
    }));
    setStartingInventory(newInventory);
  }, [character.class, character.background]);

  const assignedBaseScores = useMemo(() => {
    return Object.values(baseScores).filter(score => score > 0);
  }, [baseScores]);
  
  const availableScores = useMemo(() => {
    const assignedSet = new Set(assignedBaseScores);
    return STANDARD_ARRAY.filter(s => !assignedSet.has(s));
  }, [assignedBaseScores]);

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, totalSteps));
  };
  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };
  
  const isStepComplete = useMemo(() => {
    switch(step) {
      case 1: return character.race !== '';
      case 2: return character.class !== '';
      case 3: return character.background !== '';
      case 4: return assignedBaseScores.length === 6;
      case 5: return character.name.trim() !== '' && (!useImageGeneration || characterImageUrl !== '');
      default: return false;
    }
  }, [step, character, assignedBaseScores, characterImageUrl, useImageGeneration]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setReferenceImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setReferenceImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setReferenceImageFile(null);
        setReferenceImageUrl(null);
    }
  };

  const handleGenerateImage = async () => {
    if (!character.name || !character.race || !character.class || !character.background) {
        setImageError("이미지를 생성하려면 이름, 종족, 클래스, 배경을 모두 선택해야 합니다.");
        return;
    }

    // Check for API key if premium model is selected
    if (imageModel === 'gemini-3-pro-image-preview' || imageModel === 'gemini-3.1-flash-image-preview') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Proceeding after dialog open as per instructions
      }
    }

    setIsGeneratingImage(true);
    setImageError('');
    try {
        const prompt = `A ${character.race} ${character.class} who is a ${character.background}.`;
        const imageUrl = await generateCharacterImage(prompt, character.name, referenceImageUrl, imageModel);
        setCharacterImageUrl(imageUrl);
    } catch (err) {
        setImageError(err instanceof Error ? err.message : "알 수 없는 오류로 이미지 생성에 실패했습니다.");
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepComplete) return;

    const selectedClass = CLASSES.find(c => c.name === character.class);
    const selectedBackground = BACKGROUNDS.find(b => b.name === character.background);
    const healthModifier = Math.floor((finalScores['건강'] - 10) / 2);
    const maxHp = (selectedClass?.baseHp || 8) + healthModifier;
    
    const intelligenceModifier = Math.floor((finalScores['지능'] - 10) / 2);
    const maxMp = (selectedClass?.baseMp || 10) + intelligenceModifier;

    const finalCharacter: Character = {
      ...character,
      abilityScores: finalScores,
      equipment: {
        mainHand: null,
        offHand: null,
        armor: null,
      },
      imageUrl: characterImageUrl,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      maxHp: maxHp,
      hp: maxHp,
      maxMp: maxMp,
      mp: maxMp,
      skills: selectedClass?.startingSkills || [],
      statusEffects: [],
      inventory: startingInventory,
      gold: selectedBackground?.startingGold || 0,
    };
    onCharacterCreate(finalCharacter, useImageGeneration, imageModel);
  };
  
  const handleAbilityChange = (ability: Ability, value: string) => {
    const newScore = parseInt(value, 10) || 0;
    const oldScore = baseScores[ability];

    if (newScore > 0 && assignedBaseScores.includes(newScore)) {
      return; 
    }

    setBaseScores(prev => ({
      ...prev,
      [ability]: newScore,
    }));
  };

  const handleRecommendedAllocation = () => {
    const classData = CLASSES.find(c => c.name === character.class);
    if (!classData) return;

    const recommendedOrder = classData.recommendedAbilities;
    const sortedScores = [...STANDARD_ARRAY].sort((a, b) => b - a);

    const newScores: Record<Ability, number> = { ...baseScores };
    recommendedOrder.forEach((ability, index) => {
      newScores[ability] = sortedScores[index];
    });

    setBaseScores(newScores);
  };

  const handleRandomAllocation = () => {
    const shuffledScores = [...STANDARD_ARRAY].sort(() => Math.random() - 0.5);
    const newScores: Record<Ability, number> = { ...baseScores };
    ABILITIES.forEach((ability, index) => {
      newScores[ability] = shuffledScores[index];
    });
    setBaseScores(newScores);
  };

  const handleResetScores = () => {
    setBaseScores({ '힘': 0, '민첩': 0, '건강': 0, '지능': 0, '지혜': 0, '매력': 0 });
  };
  
  const renderSelectionStep = (title: string, options: { name: string, description: string }[], selectedValue: string, onSelect: (value: string) => void) => (
    <div>
      <h2 className="text-2xl font-bold text-cyan-300 font-adventure tracking-wider text-center mb-6">{title} 선택</h2>
      <div className="space-y-3">
        {options.map(opt => (
          <div
            key={opt.name}
            onClick={() => onSelect(opt.name)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedValue === opt.name ? 'border-cyan-500 bg-cyan-900/50' : 'border-gray-700 hover:border-gray-600 bg-gray-800'}`}
          >
            <h3 className="font-bold text-lg text-gray-100">{opt.name}</h3>
            <p className="text-sm text-gray-400">{opt.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAbilityScoreStep = () => (
    <div>
      <h2 className="text-2xl font-bold text-cyan-300 font-adventure tracking-wider text-center mb-2">능력치 분배</h2>
      <p className="text-center text-gray-400 mb-4">사용 가능한 점수 배열: [15, 14, 13, 12, 10, 8] 를 6가지 능력치에 할당하세요.</p>
      
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <button type="button" onClick={handleRecommendedAllocation} className="bg-cyan-700 text-white font-bold rounded-lg py-2 px-4 text-sm hover:bg-cyan-600 transition-colors">직업 추천 배분</button>
        <button type="button" onClick={handleRandomAllocation} className="bg-gray-600 text-white font-bold rounded-lg py-2 px-4 text-sm hover:bg-gray-500 transition-colors">무작위 배분</button>
        <button type="button" onClick={handleResetScores} className="bg-red-800 text-white font-bold rounded-lg py-2 px-4 text-sm hover:bg-red-700 transition-colors">초기화</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {ABILITIES.map(ability => {
          const base = baseScores[ability];
          const bonus = (racialBonuses as Record<string, number>)[ability] || 0;
          const total = finalScores[ability];
          return (
            <div key={ability} className="p-3 bg-gray-700/50 rounded-lg flex flex-col">
              <label className="text-md font-bold text-gray-300">{ability}</label>
              <div className="flex items-center gap-2 mt-2 flex-grow">
                <select
                  value={base}
                  onChange={(e) => handleAbilityChange(ability, e.target.value)}
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg py-1 px-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value={0}>-</option>
                  {base > 0 && <option value={base}>{base}</option>}
                  {availableScores.map(score => <option key={score} value={score}>{score}</option>)}
                </select>
                <span className="text-cyan-400 font-bold text-2xl">= {total}</span>
              </div>
              {bonus > 0 && <p className="text-xs text-green-400 mt-1 text-right">기본 {base} + 종족 {bonus}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div>
        <h2 className="text-2xl font-bold text-cyan-300 font-adventure tracking-wider text-center mb-6">캐릭터 완성</h2>
        <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">AI 일러스트 생성</h3>
                    <p className="text-xs text-gray-500 mt-1">API 호출량 절약을 위해 끌 수 있습니다.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={useImageGeneration} onChange={() => setUseImageGeneration(!useImageGeneration)} />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                {useImageGeneration && (
                  <div className="w-full mb-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">이미지 모델 선택</h3>
                    <select 
                      value={imageModel} 
                      onChange={(e) => setImageModel(e.target.value as ImageModel)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <optgroup label="기본 모델 (무료)">
                        <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
                        <option value="imagen-4.0-generate-001">Imagen 4.0</option>
                      </optgroup>
                      <optgroup label="프리미엄 모델 (API 키 필요)">
                        <option value="gemini-3-pro-image-preview">Nanabanana Pro (Gemini 3.0 Pro)</option>
                        <option value="gemini-3.1-flash-image-preview">Nanabanana 2 (Gemini 3.1 Flash)</option>
                      </optgroup>
                    </select>
                    {(imageModel === 'gemini-3-pro-image-preview' || imageModel === 'gemini-3.1-flash-image-preview') && (
                      <p className="text-[10px] text-yellow-400 mt-1">※ 프리미엄 모델은 개인 API 키 설정이 필요합니다.</p>
                    )}
                  </div>
                )}

                {useImageGeneration && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">생성된 초상화</h3>
                    <div className="w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                        {isGeneratingImage ? (
                            <LoadingSpinner />
                        ) : characterImageUrl ? (
                            <img src={characterImageUrl} alt="Character Portrait" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-400 text-sm text-center">초상화를 생성하세요</span>
                        )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-300 mb-2">참고 이미지 (선택)</h3>
                    <div className="w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center mb-2 overflow-hidden border-2 border-dashed border-gray-500">
                        {referenceImageUrl ? (
                            <img src={referenceImageUrl} alt="Reference Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-400 text-sm text-center p-2">캐릭터, 의상, 무기 등 참고 이미지를 첨부하세요.</span>
                        )}
                    </div>
                     <input
                        id="image-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <label htmlFor="image-upload" className="bg-gray-600 text-white font-bold rounded-lg py-2 px-4 w-full hover:bg-gray-500 transition-colors cursor-pointer text-center text-sm mb-4">
                        이미지 업로드
                    </label>
                    
                    <button 
                        type="button" 
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || character.name.trim() === ''}
                        className="bg-purple-600 text-white font-bold rounded-lg py-2 px-4 w-full hover:bg-purple-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isGeneratingImage ? "생성 중..." : "캐릭터 초상화 생성"}
                    </button>
                    {imageError && <p className="text-red-400 text-xs mt-2">{imageError}</p>}
                     <p className="text-xs text-gray-500 mt-2">이름을 입력해야 생성이 가능합니다.</p>
                  </>
                )}
                {!useImageGeneration && (
                  <div className="w-48 h-48 bg-gray-800 rounded-lg flex flex-col items-center justify-center border border-gray-700 mt-4">
                    <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-gray-500 text-sm text-center">이미지 생성 건너뜀</span>
                  </div>
                )}
            </div>
            <div className="md:w-2/3 space-y-4">
                <div>
                    <label htmlFor="name" className="font-bold text-cyan-300 font-adventure tracking-wider">이름</label>
                    <input
                    id="name"
                    type="text"
                    value={character.name}
                    onChange={(e) => setCharacter(p => ({ ...p, name: e.target.value }))}
                    placeholder="당신의 캐릭터 이름은?"
                    className="mt-1 w-full bg-gray-800 border-2 border-gray-700 rounded-lg py-2 px-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center md:text-left">
                    <div><span className="font-bold text-gray-400">종족:</span> <span className="text-white">{character.race}</span></div>
                    <div><span className="font-bold text-gray-400">클래스:</span> <span className="text-white">{character.class}</span></div>
                    <div><span className="font-bold text-gray-400">배경:</span> <span className="text-white">{character.background}</span></div>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-400 mb-1">최종 능력치</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {ABILITIES.map(ability => (
                      <div key={ability} className="bg-gray-800/50 p-1 rounded">
                        <div className="text-xs text-gray-400">{ability}</div>
                        <div className="text-lg font-bold text-white">{finalScores[ability]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-400 mb-1">시작 장비</h3>
                  <div className="bg-gray-800/50 p-2 rounded-lg text-xs">
                      <ul className="list-disc list-inside text-gray-300 grid grid-cols-2 gap-x-2">
                          {startingInventory.map((item, index) => <li key={index}>{item.name}</li>)}
                      </ul>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );

  const renderProgressBar = () => {
    const steps = ['종족', '클래스', '배경', '능력치', '완성'];
    return (
        <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-8">
            {steps.map((label, index) => (
                <React.Fragment key={label}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${index + 1 <= step ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                           {index + 1}
                        </div>
                        <span className={`mt-2 text-xs md:text-sm font-semibold ${index + 1 <= step ? 'text-cyan-300' : 'text-gray-500'}`}>{label}</span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 rounded-full ${index + 1 < step ? 'bg-cyan-600' : 'bg-gray-700'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: return renderSelectionStep('종족', RACES, character.race, (val) => setCharacter(p => ({...p, race: val})));
      case 2: return renderSelectionStep('클래스', CLASSES, character.class, (val) => setCharacter(p => ({...p, class: val})));
      case 3: return renderSelectionStep('배경', BACKGROUNDS, character.background, (val) => setCharacter(p => ({...p, background: val})));
      case 4: return renderAbilityScoreStep();
      case 5: return renderReviewStep();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-gray-800/50 p-6 md:p-8 rounded-lg shadow-lg shadow-cyan-500/20">
        <h1 className="text-3xl md:text-4xl font-bold text-white font-adventure tracking-wider text-center mb-4">캐릭터 생성</h1>
        {renderProgressBar()}
        
        <form onSubmit={handleSubmit}>
            <div className="min-h-[420px] flex flex-col justify-center">
                {renderStepContent()}
            </div>
            
            <div className="flex justify-between items-center mt-8">
                <button
                    type="button"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="bg-gray-600 text-white font-bold rounded-lg py-2 px-6 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    이전
                </button>

                {step < totalSteps ? (
                    <button
                        type="button"
                        onClick={nextStep}
                        disabled={!isStepComplete}
                        className="bg-cyan-600 text-white font-bold rounded-lg py-2 px-6 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        다음
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!isStepComplete}
                        className="bg-green-600 text-white font-bold rounded-lg py-2 px-6 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        모험 시작하기
                    </button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreator;