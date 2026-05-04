import React, { useState, KeyboardEvent } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Star } from 'lucide-react';

interface ActionInputProps {
  onSubmit: (action: string) => void;
  onOpenActionMenu: () => void;
  disabled: boolean;
}

const ActionInput: React.FC<ActionInputProps> = ({ onSubmit, onOpenActionMenu, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      const newAction = inputValue.trim();
      onSubmit(newAction);
      setHistory(prev => [newAction, ...prev]);
      setHistoryIndex(-1);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (history.length === 0) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIndex);
      setInputValue(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputValue(history[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  const handleMenuOpen = () => {
    onOpenActionMenu();
  };

  return (
    <div className="w-full flex items-center gap-2 sm:gap-3 relative z-10">
      <button
        type="button"
        onClick={handleMenuOpen}
        disabled={disabled}
        className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-bg-card border-2 border-primary/20 text-primary rounded-xl flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        aria-label="특별 행동 메뉴 열기"
      >
        <Star className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
      </button>
      <form onSubmit={handleSubmit} className="w-full flex-grow">
        <div className={`relative group/input flex items-center bg-bg-card/80 backdrop-blur-md border-2 rounded-xl transition-all duration-300 ${disabled ? 'opacity-70 bg-bg-card' : 'focus-within:border-primary focus-within:bg-bg-deep focus-within:ring-4 focus-within:ring-primary/20 hover:border-primary/50 border-primary/20'}`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? "작업 처리 중..." : "다음에 무엇을 할까요? (↑/↓ 키로 최근 행동 불러오기)"}
            className="flex-grow bg-transparent border-none py-2 md:py-3 pl-3 md:pl-5 pr-2 text-white text-[14px] md:text-[15px] placeholder-gray-500 focus:outline-none focus:ring-0 shadow-inner h-12 md:h-14 font-sans placeholder:font-sans placeholder:italic"
          />
          <div className="pr-1 md:pr-1.5 flex-shrink-0">
            <button
              type="submit"
              disabled={disabled || !inputValue.trim()}
              className="flex items-center justify-center bg-primary text-bg-deep font-bold font-sans tracking-wide rounded-lg px-3 md:px-6 h-10 md:h-11 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-primary disabled:cursor-not-allowed text-[12px] md:text-sm shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            >
              {disabled ? <LoadingSpinner /> : '실행'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ActionInput;