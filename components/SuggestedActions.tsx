import React from 'react';

interface SuggestedActionsProps {
  actions: string[];
  onActionSelect: (action: string) => void;
  disabled: boolean;
}

const SuggestedActions: React.FC<SuggestedActionsProps> = ({ actions, onActionSelect, disabled }) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  const handleClick = (action: string) => {
    onActionSelect(action);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleClick(action)}
            disabled={disabled}
            className="bg-gray-700/80 text-cyan-200 text-sm text-left font-adventure tracking-wider rounded-lg px-4 py-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
        {action}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedActions;