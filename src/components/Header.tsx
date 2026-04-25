import React from 'react';
import { Sun, Moon, CloudSun, CloudMoon, HelpCircle, Map, Image as ImageIcon, ImageOff, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  title: string;
  currentTime: number;
  currentLocationName: string;
  useImageGeneration: boolean;
  isAudioMuted: boolean;
  onToggleImageGeneration: () => void;
  onToggleAudio: () => void;
  onOpenMap: () => void;
  onOpenCharacterSheet: () => void;
}

const getTimeInfo = (hour: number): { period: string; icon: React.ReactNode } => {
    if (hour >= 5 && hour < 12) return { period: '아침', icon: <CloudSun className="text-yellow-300 w-4 h-4" /> };
    if (hour >= 12 && hour < 18) return { period: '낮', icon: <Sun className="text-yellow-400 w-4 h-4" /> };
    if (hour >= 18 && hour < 22) return { period: '저녁', icon: <CloudMoon className="text-indigo-300 w-4 h-4" /> };
    return { period: '밤', icon: <Moon className="text-indigo-400 w-4 h-4" /> };
};

const Header: React.FC<HeaderProps> = ({ title, currentTime, currentLocationName, useImageGeneration, isAudioMuted, onToggleImageGeneration, onToggleAudio, onOpenMap, onOpenCharacterSheet }) => {
    const { icon, period } = getTimeInfo(currentTime);

    return (
        <header className="h-16 border-b border-white/5 bg-bg-card/20 backdrop-blur-3xl flex items-center justify-between px-6 z-20 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50" />
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary font-adventure font-bold text-lg shadow-[0_0_20px_rgba(212,175,55,0.1)] group hover:scale-105 transition-transform cursor-pointer">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] text-primary/60 tracking-[0.4em] uppercase font-adventure leading-none">{currentLocationName}</span>
                        <div className="w-1 h-1 rounded-full bg-primary/30" />
                        <div className="flex items-center gap-1.5 opacity-60">
                            {icon}
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{period}</span>
                        </div>
                    </div>
                    <h1 className="text-lg md:text-xl font-bold tracking-[0.15em] text-primary text-glow font-adventure uppercase leading-none">
                        {title}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
                <div className="hidden lg:flex items-center gap-1 mr-4">
                    <div className="h-1 w-12 bg-primary/10 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-primary" 
                            initial={{ width: 0 }}
                            animate={{ width: '60%' }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        />
                    </div>
                </div>

                <button 
                    onClick={onToggleAudio}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all ${!isAudioMuted ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
                    title={!isAudioMuted ? "배경음악 끄기" : "배경음악 켜기"}
                >
                    {!isAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button 
                    onClick={onToggleImageGeneration}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all ${useImageGeneration ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
                    title={useImageGeneration ? "이미지 생성 끄기" : "이미지 생성 켜기"}
                >
                    {useImageGeneration ? <ImageIcon className="w-4 h-4" /> : <ImageOff className="w-4 h-4" />}
                </button>

                <button 
                    onClick={onOpenMap}
                    className="h-9 w-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
                    title="지도 보기"
                >
                    <Map className="w-4 h-4" />
                </button>

                <button 
                    onClick={onOpenCharacterSheet}
                    className="h-9 px-4 bg-primary/10 border border-primary/30 rounded-xl text-[10px] font-bold text-primary hover:bg-primary/20 transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg"
                >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">도움말</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
