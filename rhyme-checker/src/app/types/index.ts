// types/index.ts
export interface RhymePattern {
    type: string;
    words: string[];
    description: string;
  }
  
  export interface AnalysisResult {
    rhymeScore: number;
    flowScore: number;
    rhymePatterns: RhymePattern[];
    improvement?: string;
  }