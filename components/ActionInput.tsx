import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { FaStar } from 'react-icons/fa';

interface ActionInputProps {
  onSubmit: (action: string) => void;
  onOpenActionMenu: () => void;
  disabled: boolean;
}

const ActionInput: React.FC<ActionInputProps> = ({ onSubmit, onOpenActionMenu, disabled }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleMenuOpen = () => {
    onOpenActionMenu();
  };

  return (
    <div className="w-full flex items-center gap-2">
       <button
        type="button"
        onClick={handleMenuOpen}
        disabled={disabled}
        className="flex-shrink-0 w-12 h-12 bg-gray-700 text-yellow-400 rounded-lg flex items-center justify-center hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="특별 행동 메뉴 열기"
      >
        <FaStar className="w-6 h-6" />
      </button>
      <form onSubmit={handleSubmit} className="w-full flex-grow">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "이야기가 펼쳐집니다..." : "다음에 무엇을 할까요?"}
            className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg py-3 pl-4 pr-24 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-60 h-12"
          />
          <button
            type="submit"
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center justify-center bg-cyan-600 text-white font-bold rounded-r-lg px-4 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {disabled ? <LoadingSpinner /> : '전송'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActionInput;