
export enum DesignStyle {
  MINIMAL = 'Minimal',
  MODERN = 'Modern',
  CLASSIC = 'Classic',
  SCANDINAVIAN = 'Scandinavian',
  INDUSTRIAL = 'Industrial',
  BOHEMIAN = 'Bohemian',
  MID_CENTURY = 'Mid-Century Modern',
  JAPANDI = 'Japandi'
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface AppState {
  originalImage: string | null;
  currentImage: string | null;
  wallpaperImage: string | null;
  floorImage: string | null;
  selectedStyle: DesignStyle | null;
  isProcessing: boolean;
  messages: ChatMessage[];
  showComparison: boolean;
  aspectRatio: AspectRatio;
  hasApiKey: boolean;
}
