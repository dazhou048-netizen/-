
import React from 'react';

interface ImageCardProps {
  title: string;
  image?: string;
  step: number;
  rotation: string;
  isActive: boolean;
  onClick: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ title, image, step, rotation, isActive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative w-48 h-64 md:w-64 md:h-80 rounded-2xl shadow-xl transition-all duration-500 cursor-pointer overflow-hidden
        ${rotation} ${isActive ? 'scale-105 z-10 ring-4 ring-blue-400' : 'hover:scale-105 opacity-80 hover:opacity-100'}
        bg-white border border-gray-100 flex flex-col`}
    >
      <div className="absolute top-2 left-2 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md z-20">
        {step}
      </div>
      
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover" />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-4 text-center">
          <i className="fas fa-image text-4xl mb-2"></i>
          <span className="text-sm font-medium">{title}待上传</span>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
        <p className="text-white font-medium text-sm text-center">{title}</p>
      </div>
    </div>
  );
};

export default ImageCard;
