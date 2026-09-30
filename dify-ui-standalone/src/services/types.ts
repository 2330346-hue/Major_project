export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ParsedResume {
  rawText: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  contactInfo: ContactInfo;
  summary?: string;
  experience: string[];
  education: string[];
  skills: string[];
  projects: string[];
  certifications: string[];
  sectionsDetected: string[];
  detectedFormattingIssues: string[];
}

export interface CategoryScores {
  atsCompatibility: number;        // /20
  structure: number;               // /20
  keywordOptimization: number;     // /20
  experienceAchievements: number;  // /20
  readability: number;             // /20
}

export interface RecommendationItem {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  whyItMatters?: string;
  actionableStep?: string;
}

export interface SectionAnalysisItem {
  name: string;
  status: 'good' | 'warning' | 'missing';
  feedback: string;
}

export interface FormattingCheckItem {
  item: string;
  status: 'good' | 'warning' | 'critical';
  feedback: string;
}

export interface ATSAnalysisResult {
  overallScore: number;            // /100
  scoreRating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor';
  categoryScores: CategoryScores;
  summary: string;
  strengths: string[];
  issues: string[];
  recommendations: RecommendationItem[];
  keywords: {
    matched: string[];
    missing: string[];
    recommended: string[];
    matchPercentage?: number;
  };
  sections: SectionAnalysisItem[];
  formatting: FormattingCheckItem[];
  parsedResumeInfo: {
    fileName: string;
    wordCount: number;
    charCount: number;
  };
}
