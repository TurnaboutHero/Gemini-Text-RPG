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
            className="bg-bg-card/40 border border-white/10 text-primary/80 text-xs md:text-sm text-left font-adventure tracking-widest rounded-lg px-4 py-3 hover:bg-primary/10 hover:border-primary/30 hover:text-primary focus:outline-none transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden shadow-lg"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary/40 transition-colors" />
            <span className="truncate block font-bold">{action}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedActions;