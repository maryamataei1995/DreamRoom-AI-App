
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, DesignStyle, ChatMessage, AspectRatio } from './types';
import { redesignRoom, editRoomWithPrompt, getChatResponse } from './services/gemini';
import ComparisonSlider from './components/ComparisonSlider';
import StyleSelector from './components/StyleSelector';
import ChatInterface from './components/ChatInterface';
import ReferenceSlot from './components/ReferenceSlot';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    currentImage: null,
    wallpaperImage: null,
    floorImage: null,
    selectedStyle: null,
    isProcessing: false,
    messages: [],
    showComparison: true,
    aspectRatio: "1:1",
    hasApiKey: true, // Assuming pre-configured for Flash
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getNearestAspectRatio = (width: number, height: number): AspectRatio => {
    const ratio = width / height;
    if (ratio > 1.5) return "16:9";
    if (ratio > 1.2) return "4:3";
    if (ratio < 0.6) return "9:16";
    if (ratio < 0.8) return "3:4";
    return "1:1";
  };

  const fileToBase64 = (file: File): Promise<{base64: string, ratio: AspectRatio}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const ratio = getNearestAspectRatio(img.width, img.height);
          resolve({ base64: reader.result as string, ratio });
        };
        img.src = reader.result as string;
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { base64, ratio } = await fileToBase64(file);
        setState(prev => ({
          ...prev,
          originalImage: base64,
          aspectRatio: ratio,
          currentImage: null,
          showComparison: false,
          messages: [{
            id: Date.now().toString(),
            role: 'assistant',
            content: `Image analyzed! Detected ${ratio} proportions. Choose a style to begin your architectural redesign.`,
            timestamp: new Date()
          }]
        }));
      } catch (err) {
        console.error("Error uploading image:", err);
      }
    }
  };

  const processRedesign = async (style: DesignStyle, wp: string | null, fl: string | null) => {
    if (!state.originalImage) return;
    setState(prev => ({ ...prev, isProcessing: true }));
    try {
      const result = await redesignRoom(state.originalImage, style, state.aspectRatio, wp, fl);
      if (result) {
        setState(prev => ({
          ...prev,
          currentImage: result,
          showComparison: true,
          isProcessing: false,
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Design generated. I've preserved your room's layout and perspective.`,
              timestamp: new Date()
            }
          ]
        }));
      }
    } catch (err: any) {
      console.error("Redesign error:", err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        messages: [
          ...prev.messages,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date()
          }
        ]
      }));
    }
  };

  const handleStyleSelect = async (style: DesignStyle) => {
    setState(prev => ({ ...prev, selectedStyle: style }));
    await processRedesign(style, state.wallpaperImage, state.floorImage);
  };

  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setState(prev => ({ 
      ...prev, 
      messages: [...prev.messages, userMsg],
      isProcessing: true 
    }));

    try {
      const isEditInstruction = /change|add|make|replace|paint|set|remove|put|redesign/i.test(content);

      if (isEditInstruction && state.originalImage) {
        const baseImage = state.currentImage || state.originalImage;
        const result = await editRoomWithPrompt(baseImage, content, state.aspectRatio, state.wallpaperImage, state.floorImage);
        
        if (result) {
          setState(prev => ({
            ...prev,
            currentImage: result,
            showComparison: true,
            isProcessing: false,
            messages: [
              ...prev.messages,
              {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Updates applied while maintaining the original perspective.",
                timestamp: new Date()
              }
            ]
          }));
        } else {
          throw new Error("Failed to generate image edit.");
        }
      } else {
        const history = state.messages.map(m => ({ 
          role: m.role === 'assistant' ? 'model' : 'user', 
          parts: [{ text: m.content }] 
        }));
        const responseText = await getChatResponse(content, history);
        setState(prev => ({
          ...prev,
          isProcessing: false,
          messages: [
            ...prev.messages,
            {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: responseText,
              timestamp: new Date()
            }
          ]
        }));
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        messages: [
          ...prev.messages,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I'm having trouble processing that request right now.",
            timestamp: new Date()
          }
        ]
      }));
    }
  };

  const updateMaterial = async (type: 'wallpaper' | 'floor', base64: string | null) => {
    const newState = { ...state };
    if (type === 'wallpaper') newState.wallpaperImage = base64;
    if (type === 'floor') newState.floorImage = base64;
    
    setState(newState);

    if (newState.selectedStyle && newState.originalImage) {
      await processRedesign(newState.selectedStyle, newState.wallpaperImage, newState.floorImage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">DreamRoom <span className="text-indigo-600">AI</span></h1>
          </div>
          {state.originalImage && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload New Room
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!state.originalImage ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                 <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Redesign your space <br/><span className="text-indigo-600">architecturally.</span></h2>
            <p className="text-slate-600 max-w-lg mb-8 text-lg">Upload a photo to begin. Our AI preserves your room's layout while reimagining its style.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 text-lg"
            >
              Upload Room Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                {state.currentImage && state.showComparison ? (
                  <ComparisonSlider before={state.originalImage} after={state.currentImage} />
                ) : (
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm bg-slate-100">
                    <img src={state.currentImage || state.originalImage} alt="Current" className="w-full h-full object-cover" />
                    {state.isProcessing && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 z-10">
                        <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-xl">Reimagining Space...</p>
                        <p className="text-indigo-200 text-sm mt-2">Preserving structural boundaries</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-xl text-slate-800 mb-6">1. Choose a Design Style</h3>
                <StyleSelector 
                  onStyleSelect={handleStyleSelect} 
                  selectedStyle={state.selectedStyle} 
                />
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 lg:h-[calc(100vh-120px)] lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  2. Apply Textures
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <ReferenceSlot 
                    label="Wallpaper"
                    image={state.wallpaperImage}
                    onUpload={(b64) => updateMaterial('wallpaper', b64)}
                    onClear={() => updateMaterial('wallpaper', null)}
                    isLoading={state.isProcessing}
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /></svg>}
                  />
                  <ReferenceSlot 
                    label="Flooring"
                    image={state.floorImage}
                    onUpload={(b64) => updateMaterial('floor', b64)}
                    onClear={() => updateMaterial('floor', null)}
                    isLoading={state.isProcessing}
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>}
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <ChatInterface 
                  messages={state.messages} 
                  onSendMessage={handleSendMessage} 
                  isLoading={state.isProcessing} 
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />
    </div>
  );
};

export default App;
