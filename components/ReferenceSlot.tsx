
import React, { useRef } from 'react';

interface ReferenceSlotProps {
  label: string;
  icon: React.ReactNode;
  image: string | null;
  onUpload: (base64: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const ReferenceSlot: React.FC<ReferenceSlotProps> = ({ label, icon, image, onUpload, onClear, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-indigo-600">{icon}</div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        </div>
        {image && !isLoading && (
          <button 
            onClick={onClear}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div 
        onClick={() => !image && !isLoading && inputRef.current?.click()}
        className={`relative aspect-square w-full rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
          image 
          ? 'border-indigo-100 bg-slate-50 overflow-hidden' 
          : 'border-slate-200 hover:border-indigo-400 cursor-pointer hover:bg-indigo-50/50'
        }`}
      >
        {image ? (
          <img src={image} className="w-full h-full object-cover" alt={label} />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] font-medium">Add Ref</span>
          </div>
        )}
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFile} 
        />
      </div>
    </div>
  );
};

export default ReferenceSlot;
