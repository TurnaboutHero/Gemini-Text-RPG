import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Shield, 
  Scroll, 
  BarChart3, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Upload, 
  RefreshCw, 
  Trash2,
  Info
} from 'lucide-react';
import { Character, Ability, Item, ImageModel } from '../types';
import { RACES, CLASSES, BACKGROUNDS, ABILITIES, STANDARD_ARRAY } from '../dndData';
import { generateCharacterImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface CharacterCreatorProps {
  onCharacterCreate: (character: Character, useImageGeneration: boolean, imageModel: ImageModel) => Promise<void>;
  initialUseImageGeneration: boolean;
  initialImageModel: ImageModel;
  error?: string | null;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCharacterCreate, initialUseImageGeneration, initialImageModel, error }) => {
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
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403') || errorMessage.includes('429') || errorMessage.includes('할당량') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            setImageError("API 키 권한이 없거나 할당량을 초과했습니다. 유류 계정의 API 키를 다시 선택해 주세요.");
            await window.aistudio.openSelectKey();
        } else {
            setImageError(errorMessage);
        }
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
      reputations: {},
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary font-adventure tracking-[0.2em] uppercase text-glow mb-2">{title} 선택</h2>
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">당신의 운명을 결정할 첫 걸음을 내딛으십시오.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map(opt => (
          <motion.div
            key={opt.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt.name)}
            className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 group relative overflow-hidden ${
              selectedValue === opt.name 
                ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                : 'border-white/5 bg-bg-card/40 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${
              selectedValue === opt.name ? 'bg-primary' : 'bg-transparent group-hover:bg-white/10'
            }`} />
            
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-bold text-lg font-adventure tracking-wide transition-colors ${
                selectedValue === opt.name ? 'text-primary' : 'text-gray-200'
              }`}>
                {opt.name}
              </h3>
              {selectedValue === opt.name && (
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              )}
            </div>
            
            <p className="text-[11px] text-gray-500 leading-relaxed font-serif italic line-clamp-2 group-hover:line-clamp-none transition-all">
              {opt.description}
            </p>

            {selectedValue === opt.name && (
              <motion.div 
                layoutId="active-glow"
                className="absolute inset-0 bg-primary/5 pointer-events-none"
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderAbilityScoreStep = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary font-adventure tracking-[0.2em] uppercase text-glow mb-2">능력치 할당</h2>
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">당신의 타고난 재능을 분배하십시오. [15, 14, 13, 12, 10, 8]</p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button 
          type="button" 
          onClick={handleRecommendedAllocation} 
          className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary font-adventure tracking-widest rounded-full py-2 px-6 text-[10px] hover:bg-primary/20 transition-all uppercase group"
        >
          <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
          추천 할당
        </button>
        <button 
          type="button" 
          onClick={handleRandomAllocation} 
          className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 font-adventure tracking-widest rounded-full py-2 px-6 text-[10px] hover:bg-white/10 transition-all uppercase group"
        >
          <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
          무작위
        </button>
        <button 
          type="button" 
          onClick={handleResetScores} 
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 font-adventure tracking-widest rounded-full py-2 px-6 text-[10px] hover:bg-red-500/20 transition-all uppercase group"
        >
          <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
          초기화
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {ABILITIES.map(ability => {
          const base = baseScores[ability];
          const bonus = (racialBonuses as Record<string, number>)[ability] || 0;
          const total = finalScores[ability];
          const modifier = Math.floor((total - 10) / 2);
          
          return (
            <motion.div 
              key={ability}
              whileHover={{ y: -2 }}
              className="p-4 bg-bg-card/40 border border-white/5 rounded-2xl flex flex-col group hover:border-primary/30 transition-all relative"
            >
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">{ability}</label>
                <div className={`text-xs font-bold font-mono ${modifier >= 0 ? 'text-primary' : 'text-red-400'}`}>
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-auto">
                <select
                  value={base}
                  onChange={(e) => handleAbilityChange(ability, e.target.value)}
                  className="flex-1 bg-bg-deep border border-white/10 rounded-xl py-2 px-3 text-gray-200 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 appearance-none cursor-pointer"
                >
                  <option value={0}>-</option>
                  {base > 0 && <option value={base}>{base}</option>}
                  {availableScores.map(score => <option key={score} value={score}>{score}</option>)}
                </select>
                <div className="relative">
                  <span className="text-primary font-adventure text-3xl text-glow leading-none">{total}</span>
                  {bonus > 0 && (
                    <span className="absolute -top-2 -right-4 text-[8px] text-green-500 font-bold">+{bonus}</span>
                  )}
                </div>
              </div>
              
              <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(total / 20) * 100}%` }}
                  className="h-full bg-primary/40"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderReviewStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-primary font-adventure tracking-[0.2em] uppercase text-glow mb-2">모험의 서막</h2>
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">당신의 전설이 이곳에서 시작됩니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Portrait & Image Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative group">
            <div className="aspect-[3/4] bg-bg-deep rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
              {isGeneratingImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/80 backdrop-blur-sm z-20">
                  <LoadingSpinner />
                  <p className="mt-4 text-[10px] text-primary font-adventure tracking-widest animate-pulse">초상화 그리는 중...</p>
                </div>
              ) : characterImageUrl ? (
                <motion.img 
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={characterImageUrl} 
                  alt="Character Portrait" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
                  <User className="w-16 h-16 mb-2 opacity-20" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold">No Portrait</span>
                </div>
              )}
              
              {/* Decorative Frame */}
              <div className="absolute inset-0 border-[12px] border-bg-deep/40 pointer-events-none" />
              <div className="absolute inset-0 border border-primary/20 pointer-events-none" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">AI Portrait</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={useImageGeneration} onChange={() => setUseImageGeneration(!useImageGeneration)} />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <AnimatePresence>
              {useImageGeneration && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" /> 모델 선택
                    </label>
                    <select 
                      value={imageModel} 
                      onChange={(e) => setImageModel(e.target.value as ImageModel)}
                      className="w-full bg-bg-deep border border-white/10 rounded-xl py-2 px-3 text-gray-200 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <optgroup label="Standard (Free)">
                        <option value="gemini-2.5-flash-image">Gemini 2.5 Flash</option>
                        <option value="imagen-4.0-generate-001">Imagen 4.0</option>
                      </optgroup>
                      <optgroup label="Premium (API Key)">
                        <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro</option>
                        <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input id="image-upload" type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                          setReferenceImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                              setReferenceImageUrl(reader.result as string);
                              setCharacterImageUrl(reader.result as string); // Add direct set
                          };
                          reader.readAsDataURL(file);
                      }
                    }} className="hidden" />
                    <label htmlFor="image-upload" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-400 font-adventure tracking-widest rounded-xl py-2 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-[9px] uppercase">
                      <Upload className="w-3 h-3" /> 직접 업로드
                    </label>
                    <button 
                      type="button" 
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage || character.name.trim() === ''}
                      className="flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary font-adventure tracking-widest rounded-xl py-2 hover:bg-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase text-[9px]"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                      AI로 생성
                    </button>
                  </div>
                  {imageError && <p className="text-red-400 text-[8px] text-center font-mono">{imageError}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Character Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 ml-1">영웅의 이름</label>
            <input
              type="text"
              value={character.name}
              onChange={(e) => setCharacter(p => ({ ...p, name: e.target.value }))}
              placeholder="이름을 입력하십시오..."
              className="w-full bg-bg-card/60 border border-white/10 rounded-2xl py-4 px-6 text-2xl text-white placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-adventure tracking-widest text-glow"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '종족', value: character.race, icon: User },
              { label: '클래스', value: character.class, icon: Shield },
              { label: '배경', value: character.background, icon: Scroll },
            ].map((item, i) => (
              <div key={i} className="glass-panel p-4 rounded-2xl group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="w-3 h-3 text-gray-600 group-hover:text-primary transition-colors" />
                  <span className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">{item.label}</span>
                </div>
                <span className="text-lg font-adventure text-primary tracking-wide block">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 ml-1">최종 능력치</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {ABILITIES.map(ability => (
                <div key={ability} className="bg-bg-deep/50 border border-white/5 p-3 rounded-2xl text-center group hover:border-primary/20 transition-all">
                  <div className="text-[8px] text-gray-600 uppercase font-mono mb-1">{ability}</div>
                  <div className="text-xl font-adventure text-gray-200 group-hover:text-primary transition-colors">{finalScores[ability]}</div>
                  <div className="text-[9px] font-mono text-gray-600 mt-0.5">
                    {Math.floor((finalScores[ability] - 10) / 2) >= 0 ? '+' : ''}{Math.floor((finalScores[ability] - 10) / 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 ml-1">시작 장비</h3>
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <ul className="grid grid-cols-2 gap-y-2 gap-x-4 relative z-10">
                {startingInventory.map((item, index) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={index} 
                    className="text-xs text-gray-400 flex items-center gap-2 group/item"
                  >
                    <div className="w-1 h-1 bg-primary/40 rounded-full group-hover/item:scale-150 group-hover/item:bg-primary transition-all" />
                    <span className="group-hover/item:text-gray-200 transition-colors">{item.name}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderProgressBar = () => {
    const steps = [
      { id: 1, label: 'Race', icon: User },
      { id: 2, label: 'Class', icon: Shield },
      { id: 3, label: 'Origin', icon: Scroll },
      { id: 4, label: 'Stats', icon: BarChart3 },
      { id: 5, label: 'Final', icon: CheckCircle2 },
    ];

    return (
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-12 px-4">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isCompleted = step > s.id;

          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center relative z-10">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    borderColor: isActive || isCompleted ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                    backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0)',
                  }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${
                    isActive ? 'shadow-[0_0_15px_rgba(212,175,55,0.3)]' : ''
                  }`}
                >
                  <Icon 
                    className={`w-5 h-5 ${
                      isActive || isCompleted ? 'text-primary' : 'text-gray-600'
                    }`} 
                  />
                </motion.div>
                <span 
                  className={`mt-2 text-[9px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ${
                    isActive ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-[1px] bg-white/5 mx-2 -mt-6">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    className="h-full bg-primary/40 shadow-[0_0_8px_rgba(212,175,55,0.2)]"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
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
    <div className="min-h-screen bg-bg-deep flex flex-col items-center py-12 px-4 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.05)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl glass-panel p-6 md:p-10 rounded-[2rem] relative z-10"
      >
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/20 rounded-tl-[2rem] pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary/20 rounded-tr-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary/20 rounded-bl-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/20 rounded-br-[2rem] pointer-events-none" />

        <div className="text-center mb-12">
          <motion.h1 
            initial={{ letterSpacing: '0.5em', opacity: 0 }}
            animate={{ letterSpacing: '0.3em', opacity: 1 }}
            className="text-3xl md:text-5xl font-bold text-white font-adventure uppercase text-glow"
          >
            영웅의 탄생
          </motion.h1>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/40" />
            <Sparkles className="w-4 h-4 text-primary/60" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
        </div>

        {renderProgressBar()}
        
        <form onSubmit={handleSubmit} className="relative">
          <div className="min-h-[450px] flex flex-col">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>
          
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/5">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 font-adventure tracking-widest rounded-xl py-3 px-8 text-xs hover:bg-white/10 hover:text-white transition-all disabled:opacity-10 disabled:cursor-not-allowed uppercase group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              이전
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] px-4 py-1 rounded-full font-mono uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepComplete}
                className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary font-adventure tracking-widest rounded-xl py-3 px-8 text-xs hover:bg-primary/20 hover:border-primary/50 transition-all disabled:opacity-10 disabled:cursor-not-allowed uppercase group shadow-[0_0_20px_rgba(212,175,55,0.1)]"
              >
                다음
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isStepComplete}
                className="flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent font-adventure tracking-widest rounded-xl py-3 px-10 text-xs hover:bg-accent/20 hover:border-accent/50 transition-all disabled:opacity-10 disabled:cursor-not-allowed uppercase group shadow-[0_0_20px_rgba(14,165,233,0.15)]"
              >
                여정 시작
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CharacterCreator;