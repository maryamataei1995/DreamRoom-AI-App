
import React from 'react';
import { DesignStyle } from '../types';

interface StyleSelectorProps {
  onStyleSelect: (style: DesignStyle) => void;
  selectedStyle: DesignStyle | null;
}

const styles = [
  { id: DesignStyle.MINIMAL, label: 'Minimalist', color: 'bg-white border-gray-200' },
  { id: DesignStyle.MODERN, label: 'Modern', color: 'bg-indigo-50 border-indigo-200' },
  { id: DesignStyle.SCANDINAVIAN, label: 'Scandinavian', color: 'bg-amber-50 border-amber-200' },
  { id: DesignStyle.INDUSTRIAL, label: 'Industrial', color: 'bg-stone-100 border-stone-300' },
  { id: DesignStyle.CLASSIC, label: 'Classic', color: 'bg-emerald-50 border-emerald-200' },
  { id: DesignStyle.BOHEMIAN, label: 'Bohemian', color: 'bg-orange-50 border-orange-200' },
  { id: DesignStyle.MID_CENTURY, label: 'Mid-Century', color: 'bg-blue-50 border-blue-200' },
  { id: DesignStyle.JAPANDI, label: 'Japandi', color: 'bg-stone-50 border-stone-200' },
];

const StyleSelector: React.FC<StyleSelectorProps> = ({ onStyleSelect, selectedStyle }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
      {styles.map((style) => (
        <button
          key={style.id}
          onClick={() => onStyleSelect(style.id)}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
            selectedStyle === style.id 
            ? 'border-indigo-600 ring-2 ring-indigo-200 bg-indigo-50 shadow-md' 
            : 'border-transparent bg-white shadow-sm hover:shadow-md'
          }`}
        >
          <span className="text-sm font-medium text-gray-800 text-center">{style.label}</span>
        </button>
      ))}
    </div>
  );
};

export default StyleSelector;
