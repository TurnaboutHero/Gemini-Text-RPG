import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            onClick={() => handleClick(action)}
            disabled={disabled}
            title={action}
            className="flex relative items-center justify-between bg-bg-card/60 backdrop-blur-md border border-primary/20 text-gray-200 text-sm md:text-[15px] text-left rounded-xl px-4 py-3 hover:bg-primary/10 hover:border-primary/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            <span className="truncate block font-sans pr-2 font-medium">{action}</span>
            <ArrowRight className="w-5 h-5 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0" />
            
            {/* Custom Tooltip */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-xs bg-gray-900 border border-primary/30 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-xl hidden sm:block">
              {action}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-b border-r border-primary/30 rotate-45" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedActions;