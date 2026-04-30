import React, { useState } from 'react';
import { Item, ItemType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, FlaskConical, Scroll, Package } from 'lucide-react';

interface ItemTooltipProps {
  item: Item;
  children: React.ReactNode;
  className?: string;
}

const itemTypeIcons: Record<ItemType, React.ReactNode> = {
    weapon: <Sword size={14} className="text-red-400" />,
    armor: <Shield size={14} className="text-blue-400" />,
    consumable: <FlaskConical size={14} className="text-green-400" />,
    quest: <Scroll size={14} className="text-yellow-400" />,
    misc: <Package size={14} className="text-gray-400" />,
};

const renderEffect = (key: string, value: number) => {
    const sign = value > 0 ? '+' : '';
    const color = value > 0 ? 'text-green-400' : 'text-red-400';
    return (
        <span key={key} className={`text-[10px] font-mono px-2 py-0.5 rounded bg-gray-950/50 border border-gray-700/50 ${color}`}>
            {key} {sign}{value}
        </span>
    );
};

const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, children, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const xOffset = 15;
    const yOffset = 15;
    let newX = e.clientX + xOffset;
    let newY = e.clientY + yOffset;

    if (newX + 280 > window.innerWidth) {
      newX = e.clientX - 280 - xOffset;
    }
    if (newY + 150 > window.innerHeight) {
      newY = e.clientY - 150 - yOffset;
    }

    setPosition({ x: newX, y: newY });
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={className || "relative"}
    >
      {children}
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[9999] w-64 md:w-72 bg-bg-deep/95 backdrop-blur-md border border-primary/30 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-none p-4 overflow-hidden flex flex-col gap-3"
            style={{ 
              left: `${position.x}px`, 
              top: `${position.y}px`
            }}
          >
             <div className="flex items-start gap-3 border-b border-white/10 pb-3">
                 <div className="w-10 h-10 rounded-lg bg-gray-900 flex flex-shrink-0 items-center justify-center border border-white/5 shadow-inner">
                     {itemTypeIcons[item.itemType] || <Package size={16} className="text-gray-400" />}
                 </div>
                 <div className="min-w-0 flex-1">
                     <p className="font-bold text-sm text-gray-100 leading-tight">{item.name}</p>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                         {item.itemType === 'weapon' ? '무기' : item.itemType === 'armor' ? '방어구' : item.itemType === 'consumable' ? '소모품' : item.itemType === 'quest' ? '퀘스트' : '기타'}
                     </p>
                 </div>
                 {item.value > 0 && <span className="text-[10px] text-yellow-500 font-mono font-bold whitespace-nowrap bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">{item.value} G</span>}
             </div>
             
             <p className="text-xs text-gray-300 leading-relaxed break-words">
                 {item.description}
             </p>

             {item.effects && Object.keys(item.effects).length > 0 && (
                <div className="mt-1 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                    {Object.entries(item.effects).map(([key, value]) => renderEffect(key, value))}
                </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ItemTooltip;
