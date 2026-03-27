import React from 'react';

interface ResourceBarProps {
  current: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}

const ResourceBar: React.FC<ResourceBarProps> = ({ current, max, color, icon }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-gray-600 rounded-full h-5 border-2 border-gray-800 relative flex items-center pl-2">
            <div className="absolute left-1.5 text-white z-10">{icon}</div>
            <div 
                className={`${color} h-full rounded-full transition-all duration-300`} 
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute w-full text-center text-xs font-bold text-white drop-shadow-md top-0 inset-0 flex items-center justify-center">{current}/{max}</span>
        </div>
    );
};

export default ResourceBar;
