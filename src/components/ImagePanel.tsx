
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ImagePanelProps {
  imageUrl: string;
  altText: string;
  isLoading: boolean;
}

const ImagePanel: React.FC<ImagePanelProps> = ({ imageUrl, altText, isLoading }) => {
  return (
    <div className="w-full h-full bg-black relative">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={altText}
          className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${isLoading ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-8 text-center">
            <p className="text-gray-500 font-adventure text-2xl">모험의 장면이 여기에 표시됩니다.</p>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
          <div className="h-12 w-12 text-white">
            <LoadingSpinner />
          </div>
          <p className="mt-4 text-sm text-gray-200 animate-pulse">새로운 장면 생성 중...</p>
        </div>
      )}
    </div>
  );
};

export default ImagePanel;
