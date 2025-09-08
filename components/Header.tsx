import React, { useState } from 'react';
import { FaMapMarkerAlt, FaSun, FaMoon, FaCloudSun, FaCloudMoon, FaBook } from 'react-icons/fa';

interface HeaderProps {
  locationName: string;
  currentDay: number;
  currentTime: number;
  onOpenQuestLog: () => void;
}

const getTimeInfo = (hour: number): { period: string; icon: JSX.Element } => {
    if (hour >= 5 && hour < 12) return { period: '아침', icon: <FaCloudSun className="text-yellow-300" /> };
    if (hour >= 12 && hour < 18) return { period: '낮', icon: <FaSun className="text-yellow-400" /> };
    if (hour >= 18 && hour < 22) return { period: '저녁', icon: <FaCloudMoon className="text-indigo-300" /> };
    return { period: '밤', icon: <FaMoon className="text-indigo-400" /> };
};

const Header: React.FC<HeaderProps> = ({ locationName, currentDay, currentTime, onOpenQuestLog }) => {
    const { period, icon } = getTimeInfo(currentTime);

    return (
        <header className="flex-shrink-0 w-full bg-gray-800/50 backdrop-blur-sm rounded-lg p-2 text-center border border-gray-700">
            <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-cyan-400"/>
                    <span>현재 위치:</span>
                    <span className="font-bold text-gray-200">{locationName}</span>
                </div>
                <div className="flex-1 flex justify-center items-center gap-2">
                    {icon}
                    <span>{currentDay}일차, {period}</span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={onOpenQuestLog}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    aria-label="임무 일지 열기"
                  >
                    <FaBook className="w-5 h-5"/>
                  </button>
                </div>
            </div>
        </header>
    );
};

export default Header;