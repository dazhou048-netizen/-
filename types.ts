
export interface HistoryItem {
  id: string;
  personImage: string;
  clothingImage: string;
  resultImage: string;
  timestamp: number;
}

export enum AppStep {
  UPLOAD_PERSON = 1,
  CHOOSE_CLOTHES = 2,
  GENERATE_RESULT = 3
}
