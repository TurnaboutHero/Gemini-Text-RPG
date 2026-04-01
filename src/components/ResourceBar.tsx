import React from 'react';

interface ResourceBarProps {
  current: number;
  max: number;
  color: string;
  icon?: React.ReactNode;
}

const ResourceBar: React.FC<ResourceBarProps> = ({ current, max, color, icon }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    const isLow = percentage <= 20 && percentage > 0;
    
    return (
        <div className={`w-full bg-bg-deep/50 rounded-full h-4 border border-white/10 relative flex items-center overflow-hidden ${isLow ? 'animate-pulse' : ''}`}>
            {icon && <div className="absolute left-2 text-white z-10 scale-75">{icon}</div>}
            <div 
                className={`${color} h-full transition-all duration-500 relative`} 
                style={{ width: `${percentage}%` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />
            </div>
            <span className="absolute w-full text-center text-[9px] font-mono font-bold text-white/80 tracking-tighter drop-shadow-md top-0 inset-0 flex items-center justify-center">
                {current} / {max}
            </span>
        </div>
    );
};

export default ResourceBar;
