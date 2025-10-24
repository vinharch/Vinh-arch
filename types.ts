
export interface SourceImage {
  base64: string;
  mimeType: string;
}

export interface HistoryItem {
  id: string;
  sourceImage: SourceImage | null;
  referenceImage: SourceImage | null;
  prompt: string;
  imageCount: number;
  generatedImages: string[];
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
}
