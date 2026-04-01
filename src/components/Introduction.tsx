import React, { useState, useRef } from 'react';
import { LOCAL_STORAGE_KEY } from '../constants';
import { Download, Upload, Database, Volume2 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface IntroductionProps {
  onStartCreation: () => void;
  onContinueGame: () => void;
  hasSavedGame: boolean;
  onExportSave: () => void;
  onImportSave: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Introduction: React.FC<IntroductionProps> = ({ 
  onStartCreation, 
  onContinueGame, 
  hasSavedGame,
  onExportSave,
  onImportSave
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
    
  const handleNewGameClick = () => {
    if (hasSavedGame) {
      setShowConfirmModal(true);
    } else {
      onStartCreation();
    }
  };

  const confirmNewGame = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setShowConfirmModal(false);
    onStartCreation();
  };

  const cancelNewGame = () => {
    setShowConfirmModal(false);
  };
  
  const handleContinueClick = () => {
    onContinueGame();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4 text-center overflow-hidden">
      {/* Grid Background is already in body, but we can add a subtle overlay here if needed */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-4xl animate-fade-in">
        <div className="mb-6 relative inline-block">
            <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full animate-pulse-glow" />
            <h1 
                className="text-4xl md:text-6xl font-bold text-white font-adventure tracking-[0.2em] mb-2 relative text-glow animate-flicker"
                style={{ textShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }}
            >
              제미나이 연대기
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-2" />
            <p className="text-lg md:text-xl font-bold text-primary font-adventure tracking-[0.5em] mt-2 uppercase opacity-80">
                Chronicles of Gemini
            </p>
        </div>

        <p className="text-base md:text-lg text-gray-400 leading-relaxed mb-8 max-w-2xl mx-auto font-sans tracking-wide">
          AI 던전 마스터 '제미나이'가 실시간으로 엮어내는 당신만의 서사시.<br/>
          <span className="text-accent/80">끝없는 가능성의 세계에서 당신의 선택이 전설이 됩니다.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={handleContinueClick}
            disabled={!hasSavedGame}
            className="w-full sm:w-auto bg-primary/10 border border-primary/30 text-primary font-adventure tracking-widest rounded-xl py-3 px-8 text-lg hover:bg-primary/20 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none shadow-[0_0_20px_rgba(212,175,55,0.1)] group"
          >
            <span className="group-hover:text-glow transition-all">모험 이어하기</span>
          </button>
          <button
            onClick={handleNewGameClick}
            className="w-full sm:w-auto bg-transparent border border-white/10 text-gray-400 font-adventure tracking-widest rounded-xl py-3 px-8 text-lg hover:bg-white/5 hover:text-white hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 transform hover:scale-105"
          >
            새로운 모험 시작
          </button>
        </div>

        {/* Data Management Section (Borrowed from reference) */}
        <div className="max-w-md mx-auto p-4 border border-white/5 bg-white/5 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-500">
            <Database className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">데이터 관리</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onExportSave}
              disabled={!hasSavedGame}
              className="flex items-center gap-2 px-4 py-2 bg-bg-deep/50 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
              title="저장 파일 내보내기"
            >
              <Download className="w-3 h-3 group-hover:scale-110 transition-transform" />
              내보내기
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 px-4 py-2 bg-bg-deep/50 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400 hover:text-accent hover:border-accent/30 transition-all group"
              title="저장 파일 가져오기"
            >
              <Upload className="w-3 h-3 group-hover:scale-110 transition-transform" />
              가져오기
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onImportSave} 
              accept=".json" 
              className="hidden" 
            />
          </div>
          <p className="mt-3 text-[9px] text-gray-600 leading-relaxed">
            진행 상황은 브라우저에 자동 저장되지만,<br/>
            파일로 백업해두면 다른 기기에서도 모험을 이어갈 수 있습니다.
          </p>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-bg-card border border-primary/30 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />
            <h3 className="text-2xl font-adventure text-primary tracking-widest mb-4 uppercase">New Adventure</h3>
            <p className="text-gray-300 mb-8 leading-relaxed">
              새로운 게임을 시작하면 현재 진행 상황이 모두 사라집니다.<br/>
              <span className="text-red-400/80 font-bold">정말 초기화하시겠습니까?</span>
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelNewGame}
                className="px-6 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-all font-adventure tracking-widest uppercase text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewGame}
                className="px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all font-adventure tracking-widest uppercase text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Introduction;