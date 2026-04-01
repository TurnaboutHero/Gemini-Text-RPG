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
    <div className="w-full flex items-center gap-1 relative z-10">
      <button
        type="button"
        onClick={handleMenuOpen}
        disabled={disabled}
        className="flex-shrink-0 w-12 h-12 bg-bg-card border border-primary/30 text-primary rounded-lg flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 focus:outline-none transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg"
        aria-label="특별 행동 메뉴 열기"
      >
        <Star className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
      <form onSubmit={handleSubmit} className="w-full flex-grow">
        <div className="relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? "Processing..." : "Enter command... (Up/Down for history)"}
            className="w-full bg-bg-card/50 border border-white/20 rounded-lg py-3 pl-4 pr-24 text-gray-100 text-sm md:text-base placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-all duration-200 disabled:opacity-40 h-12 font-sans shadow-lg"
          />
          <button
            type="submit"
            disabled={disabled}
            className="absolute inset-y-1 right-1 flex items-center justify-center bg-accent/20 text-accent border border-accent/40 font-adventure tracking-widest rounded-md px-4 hover:bg-accent/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-[10px] md:text-xs font-bold"
          >
            {disabled ? <LoadingSpinner /> : 'EXECUTE'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActionInput;