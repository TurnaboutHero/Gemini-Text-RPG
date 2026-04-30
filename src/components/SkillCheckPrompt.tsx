import React, { useState, useEffect } from 'react';
import { SkillCheck, Character } from '../types';
import { Dices, AlertTriangle, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SkillCheckPromptProps {
  skillCheck: SkillCheck;
  character: Character | null;
  onComplete: (outcomeMessage: string, d20Roll: number, modifier: number, total: number, outcome: string) => void;
}

const SkillCheckPrompt: React.FC<SkillCheckPromptProps> = ({ skillCheck, character, onComplete }) => {
  const [rollState, setRollState] = useState<'idle' | 'rolling' | 'result'>('idle');
  const [result, setResult] = useState<{ d20Roll: number, modifier: number, total: number, outcome: string } | null>(null);

  // Determine difficulty label
  let desc = '보통';
  let diffColor = 'text-yellow-400';
  if (skillCheck.difficulty <= 5) { desc = '매우 쉬움'; diffColor = 'text-green-400'; }
  else if (skillCheck.difficulty <= 10) { desc = '쉬움'; diffColor = 'text-green-300'; }
  else if (skillCheck.difficulty <= 15) { desc = '보통'; diffColor = 'text-yellow-400'; }
  else if (skillCheck.difficulty <= 18) { desc = '어려움'; diffColor = 'text-orange-400'; }
  else { desc = '매우 어려움'; diffColor = 'text-red-500'; }

  const handleRollClick = () => {
    setRollState('rolling');
    
    // Calculate outcome
    const score = character?.abilityScores[skillCheck.ability] || 10;
    const modifier = Math.floor((score - 10) / 2);
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const total = d20Roll + modifier;
    const outcome = d20Roll === 1 ? '대실패' : d20Roll === 20 ? '대성공' : total >= skillCheck.difficulty ? '성공' : '실패';
    
    setResult({ d20Roll, modifier, total, outcome });

    // Show result after animation
    setTimeout(() => {
      setRollState('result');
    }, 1500);
  };

  const handleContinueClick = () => {
    if (!result) return;
    const resultText = `주사위 굴림: ${result.d20Roll} + ${result.modifier} (${skillCheck.ability}) = 총 ${result.total} (난이도: ${skillCheck.difficulty})`;
    const outcomeMessage = `판정 결과: '${result.outcome}'. 내 캐릭터가 ${skillCheck.ability} 판정을 시도했고, 결과는 이러했습니다. 이 결과에 따른 이야기를 계속해주세요. (중요: 판정 결과만으로 갑자기 다른 장소로 이동하지 말고, 현재 위치에서의 상황 변화만을 묘사해주세요.)`;
    onComplete(outcomeMessage, result.d20Roll, result.modifier, result.total, result.outcome);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded-xl p-5 md:p-6 text-center space-y-4"
    >
      <div className="flex justify-center mb-2">
        <motion.div 
          animate={rollState === 'rolling' ? { rotate: 360, y: [0, -20, 0] } : { rotate: [0, -10, 10, -10, 10, 0] }}
          transition={rollState === 'rolling' ? { duration: 0.5, repeat: Infinity } : { duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="bg-cyan-500/20 p-3 rounded-full"
        >
          <Dices className={`w-8 h-8 ${rollState === 'rolling' ? 'text-white' : 'text-cyan-400'}`} />
        </motion.div>
      </div>
      
      <div>
        <h3 className="text-xl font-bold text-cyan-300 font-adventure tracking-wider uppercase mb-1">
          능력치 판정
        </h3>
        <p className="text-gray-300 text-sm">
          당신의 <span className="font-bold text-cyan-400 inline-block px-1.5 py-0.5 bg-cyan-950 rounded mx-1">{skillCheck.ability}</span> 능력이 시험받습니다.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {rollState === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-gray-950/50 rounded-lg p-4 border border-gray-700/50 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">목표 난이도 (DC)</span>
                <span className={`text-2xl font-black ${diffColor}`}>
                  {skillCheck.difficulty}
                </span>
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-800 ${diffColor}`}>
                {desc}
              </div>
            </div>

            {(skillCheck.successOutcome || skillCheck.failureOutcome) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                {skillCheck.successOutcome && (
                  <div className="bg-green-950/30 border border-green-900/50 rounded-lg p-3 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-wide mb-1">성공 시</p>
                      <p className="text-xs text-green-100/80">{skillCheck.successOutcome}</p>
                    </div>
                  </div>
                )}
                {skillCheck.failureOutcome && (
                  <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 flex gap-3">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1">실패 시</p>
                      <p className="text-xs text-red-100/80">{skillCheck.failureOutcome}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <motion.button
              onClick={handleRollClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 w-full md:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl py-3 px-8 text-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all flex items-center justify-center gap-3 mx-auto group border border-cyan-400/30"
            >
              <Dices className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              주사위 굴리기
            </motion.button>
          </motion.div>
        )}

        {rollState === 'rolling' && (
          <motion.div key="rolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10">
            <p className="text-xl font-bold text-cyan-400 animate-pulse font-adventure tracking-widest">운명을 숫자로 변환하는 중...</p>
          </motion.div>
        )}

        {rollState === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className={`p-6 rounded-2xl border-2 shadow-2xl ${result.total >= skillCheck.difficulty || result.outcome === '대성공' ? 'bg-green-950/40 border-green-500/50 shadow-green-500/20' : 'bg-red-950/40 border-red-500/50 shadow-red-500/20'}`}>
               <div className="flex justify-center items-center gap-4 text-4xl font-black mb-2">
                 <span className="text-gray-300">{result.d20Roll}</span>
                 <span className="text-gray-500 text-2xl">+</span>
                 <span className="text-gray-300">{result.modifier}</span>
                 <span className="text-gray-500 text-2xl">=</span>
                 <span className={result.total >= skillCheck.difficulty || result.outcome === '대성공' ? 'text-green-400' : 'text-red-500'}>
                   {result.total}
                 </span>
               </div>
               <div className="text-sm font-bold text-gray-400 mb-4 tracking-widest uppercase">
                 목표 난이도: {skillCheck.difficulty}
               </div>
               
               <div className={`text-2xl font-black tracking-widest ${result.total >= skillCheck.difficulty || result.outcome === '대성공' ? 'text-green-400' : 'text-red-500'}`}>
                 {result.outcome}
               </div>
            </div>

            <motion.button
              onClick={handleContinueClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full md:w-auto font-bold rounded-xl py-3 px-8 text-lg focus:outline-none transition-all flex items-center justify-center gap-3 mx-auto group ${result.total >= skillCheck.difficulty || result.outcome === '대성공' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}
            >
              계속하기
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SkillCheckPrompt;
