import React from 'react';
import { WorldMap as WorldMapType } from '../types';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface WorldMapProps {
  worldMap: WorldMapType | null;
  currentLocationId: string | null;
  mapImageUrl: string;
  onClose: () => void;
}

interface NodePosition {
  x: number;
  y: number;
  id: string;
  name: string;
}

const WorldMap: React.FC<WorldMapProps> = ({ worldMap, currentLocationId, mapImageUrl, onClose }) => {
  const nodePositions = React.useMemo(() => {
    if (!worldMap) return [];
    
    const positions: NodePosition[] = [];
    const locationIds = Object.keys(worldMap);
    const count = locationIds.length;
    if (count === 0) return [];
    
    const width = 800;
    const height = 450; // 16:9 aspect ratio
    const paddingX = 80;
    const paddingY = 60;
    
    // Simple grid layout for robustness
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const colWidth = (width - paddingX * 2) / (cols > 1 ? cols - 1 : 1);
    const rowHeight = (height - paddingY * 2) / (rows > 1 ? rows - 1 : 1);

    locationIds.forEach((id, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions.push({
        id,
        name: worldMap[id].name,
        x: cols > 1 ? paddingX + col * colWidth : width / 2,
        y: rows > 1 ? paddingY + row * rowHeight : height / 2,
      });
    });
    
    return positions;
  }, [worldMap]);

  if (!worldMap) return null;

  const nodeMap = new Map(nodePositions.map(p => [p.id, p]));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-5xl bg-gray-800/90 border border-cyan-500/30 rounded-lg shadow-lg shadow-cyan-500/20 p-6 text-gray-200 relative aspect-video flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-20"
          aria-label="월드맵 닫기"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-cyan-300 font-adventure tracking-wider text-center mb-4 flex-shrink-0">
          지역 지도
        </h2>
        <div className="flex-grow relative">
          {mapImageUrl && (
            <img src={mapImageUrl} alt="Chapter map" className="absolute top-0 left-0 w-full h-full object-cover rounded-md"/>
          )}
          <svg viewBox="0 0 800 450" className="w-full h-full absolute top-0 left-0">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Connections */}
            {Object.entries(worldMap).map(([id, location]) => {
              const startNode = nodeMap.get(id);
              if (!startNode) return null;

              return Object.values(location.exits).map(exitId => {
                const endNode = nodeMap.get(exitId);
                if (!endNode) return null;
                if (id > exitId) return null;

                return (
                  <line
                    key={`${id}-${exitId}`}
                    x1={startNode.x}
                    y1={startNode.y}
                    x2={endNode.x}
                    y2={endNode.y}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                );
              });
            })}

            {/* Nodes */}
            {nodePositions.map(pos => {
              const isCurrent = pos.id === currentLocationId;
              return (
                <g key={pos.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill={isCurrent ? '#22D3EE' : 'rgba(17, 24, 39, 0.8)'}
                    stroke={isCurrent ? '#67E8F9' : '#4A5568'}
                    strokeWidth="3"
                    className={isCurrent ? 'animate-pulse' : ''}
                    style={isCurrent ? { filter: 'url(#glow)' } : {}}
                  />
                  <text
                    x="0"
                    y="28"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="14"
                    className="font-bold"
                    style={{ pointerEvents: 'none', textShadow: '0 0 5px black, 0 0 5px black' }}
                  >
                    {pos.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WorldMap;