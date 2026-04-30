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
        <div className={`w-full bg-black/40 rounded h-3.5 border border-white/5 relative flex items-center overflow-hidden shadow-inner ${isLow ? 'animate-pulse' : ''}`}>
            {icon && <div className="absolute left-1.5 text-white/50 z-10 scale-75 opacity-70">{icon}</div>}
            <div 
                className={`${color} h-full transition-all duration-700 ease-out relative`} 
                style={{ width: `${percentage}%` }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white/20" />
            </div>
            <span className="absolute w-full text-center text-[9px] font-mono font-bold text-white tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,1)] top-0 left-0 h-full flex items-center justify-center">
                {current} / {max}
            </span>
        </div>
    );
};

export default ResourceBar;
