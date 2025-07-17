export interface DetectionResult {
  isAI: boolean;
  metrics: {
    accuracy: number;
    f1Score: number;
    rocAuc: number;
    precision: number;
  };
  details?: string;
}

export interface ApiResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }[];
  created: number;
  id: string;
  model: string;
  object: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface TextCharacteristics {
  hasHistoricalLanguage: boolean;
  hasComplexMetaphors: boolean;
  hasEmotionalDepth: boolean;
  hasIrregularStructure: boolean;
  hasUniqueImagery: boolean;
  isModernLanguage: boolean;
}