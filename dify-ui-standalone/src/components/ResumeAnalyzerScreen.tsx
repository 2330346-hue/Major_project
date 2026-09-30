import { useState } from 'react';
import './ResumeAnalyzerScreen.css';
import { ArrowLeft, LogOut, Download, RefreshCw, FileText, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import ResumeUpload from './ResumeUpload';
import ATSScoreCard from './ATSScoreCard';
import ScoreBreakdown from './ScoreBreakdown';
import ResumeInsights from './ResumeInsights';
import KeywordAnalysis from './KeywordAnalysis';
import SectionAnalysis from './SectionAnalysis';
import FormattingCheck from './FormattingCheck';
import ImprovementPlan from './ImprovementPlan';
import { extractTextFromFile, parseResumeContent } from '../services/resumeParser';
import { analyzeResume } from '../services/atsAnalyzer';
import type { ATSAnalysisResult } from '../services/types';

interface ResumeAnalyzerScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

const ANALYSIS_STEPS = [
  'Uploading resume',
  'Extracting resume content',
  'Analyzing structure',
  'Checking ATS compatibility',
  'Analyzing keywords',
  'Generating recommendations'
];

export default function ResumeAnalyzerScreen({ onBack, onLogout }: ResumeAnalyzerScreenProps) {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);

  const handleStartAnalysis = async (file: File, jobDescription: string) => {
    setIsAnalyzing(true);
    setErrorState(null);
    setCurrentStepIndex(0);
    setProgressPct(10);

    try {
      // Step 1: Uploading resume
      await new Promise((res) => setTimeout(res, 400));
      setCurrentStepIndex(1);
      setProgressPct(25);

      // Step 2: Extracting content
      const rawText = await extractTextFromFile(file);
      if (!rawText || rawText.trim().length === 0) {
        throw new Error("We couldn't extract readable text from this resume. Please ensure it is not password-protected or image-only.");
      }

      setCurrentStepIndex(2);
      setProgressPct(45);

      const parsedResume = parseResumeContent(rawText, file.name, file.size, file.type);

      // Step 3: Analyzing structure
      await new Promise((res) => setTimeout(res, 400));
      setCurrentStepIndex(3);
      setProgressPct(65);

      // Step 4 & 5: ATS check & Keywords
      await new Promise((res) => setTimeout(res, 400));
      setCurrentStepIndex(4);
      setProgressPct(85);

      // Step 6: Generating recommendations & scoring
      const result = await analyzeResume(parsedResume, jobDescription);
      setCurrentStepIndex(5);
      setProgressPct(100);

      await new Promise((res) => setTimeout(res, 300));
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Analysis Error:', err);
      setErrorState(err?.message || "We couldn't analyze your resume right now. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setErrorState(null);
    setProgressPct(0);
    setCurrentStepIndex(0);
  };

  const handleDownloadReport = () => {
    if (!analysisResult) return;

    const reportContent = `
==================================================
        AI RESUME ATS ANALYSIS REPORT
==================================================
File Analyzed : ${analysisResult.parsedResumeInfo.fileName}
Overall Score : ${analysisResult.overallScore}/100 (${analysisResult.overallScore >= 85 ? 'EXCELLENT' : analysisResult.overallScore >= 70 ? 'GOOD' : 'NEEDS IMPROVEMENT'})
Word Count    : ${analysisResult.parsedResumeInfo.wordCount} words

--------------------------------------------------
SCORE BREAKDOWN
--------------------------------------------------
- ATS Compatibility             : ${analysisResult.categoryScores.atsCompatibility}/20
- Resume Structure              : ${analysisResult.categoryScores.structure}/20
- Keyword Optimization          : ${analysisResult.categoryScores.keywordOptimization}/20
- Experience & Achievements     : ${analysisResult.categoryScores.experienceAchievements}/20
- Readability & Professional    : ${analysisResult.categoryScores.readability}/20

--------------------------------------------------
STRENGTHS
--------------------------------------------------
${analysisResult.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

--------------------------------------------------
ISSUES FOUND
--------------------------------------------------
${analysisResult.issues.map((s, i) => `${i + 1}. ${s}`).join('\n')}

--------------------------------------------------
KEYWORD ANALYSIS
--------------------------------------------------
Matched Keywords  : ${analysisResult.keywords.matched.join(', ') || 'None'}
Missing Keywords  : ${analysisResult.keywords.missing.join(', ') || 'None'}

--------------------------------------------------
PRIORITY ACTION PLAN
--------------------------------------------------
${analysisResult.recommendations.map((r, i) => `
[Priority ${i + 1}: ${r.priority.toUpperCase()}] ${r.title}
Issue: ${r.description}
Suggested Action: ${r.actionableStep || 'N/A'}
`).join('\n')}

==================================================
Disclaimer: ATS scores are estimates based on common resume-screening metrics.
==================================================
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATS_Report_${analysisResult.parsedResumeInfo.fileName.replace(/\.[^/.]+$/, "")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="resume-analyzer-container">
      {/* Top Header Navigation */}
      <header className="analyzer-header">
        <div className="analyzer-header-left">
          <div className="nav-logo" onClick={onBack} style={{ cursor: 'pointer' }}>
            <div className="avatar" style={{ backgroundColor: '#155eef', color: 'white' }}>D</div>
            <span>Dify Console</span>
          </div>
          <span className="nav-divider">/</span>
          <span className="header-feature-title">Resume ATS Analyzer</span>
        </div>

        <div className="analyzer-header-right">
          <div className="privacy-badge">
            <Lock size={12} />
            <span>Privacy Protected — In-Memory Processing</span>
          </div>
          <button className="btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <button className="icon-btn" onClick={onLogout} title="Log Out">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="analyzer-main-content">
        {/* State 1: Multi-Step Loading / Progress */}
        {isAnalyzing && (
          <div className="loading-overlay-card">
            <div className="loading-spinner-wrapper">
              <Sparkles className="sparkles-anim" size={36} color="#155eef" />
            </div>

            <h3 className="loading-title">Analyzing Your Resume</h3>
            <p className="loading-subtitle">Our ATS engine is scanning formatting, structure, and keywords...</p>

            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="progress-pct-label">{progressPct}% Complete</span>

            <div className="steps-list">
              {ANALYSIS_STEPS.map((stepName, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={idx}
                    className={`step-item ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}`}
                  >
                    <div className="step-indicator">
                      {isDone ? <CheckCircle2 size={14} color="#12b76a" /> : <span>{idx + 1}</span>}
                    </div>
                    <span className="step-name">{stepName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error State */}
        {errorState && !isAnalyzing && (
          <div className="analyzer-error-card">
            <div className="error-icon-wrapper">⚠️</div>
            <h3>Analysis Failed</h3>
            <p>{errorState}</p>
            <button className="btn-primary" onClick={handleReset}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* State 2: Upload Interface (Default) */}
        {!isAnalyzing && !analysisResult && !errorState && (
          <ResumeUpload onAnalyze={handleStartAnalysis} isAnalyzing={isAnalyzing} />
        )}

        {/* State 3: Polished Results Dashboard */}
        {!isAnalyzing && analysisResult && (
          <div className="results-dashboard">
            {/* Results Header Bar */}
            <div className="results-top-bar">
              <div>
                <span className="results-kpi-subtitle">Analysis Complete for</span>
                <h1 className="results-file-title">
                  <FileText size={22} color="#155eef" />
                  {analysisResult.parsedResumeInfo.fileName}
                </h1>
              </div>

              <div className="results-actions">
                <button className="btn-secondary" onClick={handleReset}>
                  <RefreshCw size={16} />
                  Analyze Another Resume
                </button>
                <button className="btn-primary" onClick={handleDownloadReport}>
                  <Download size={16} />
                  Download Report
                </button>
              </div>
            </div>

            {/* Top Grid: ATS Score Gauge Card & Score Breakdown */}
            <div className="results-top-grid">
              <ATSScoreCard result={analysisResult} />
              <ScoreBreakdown categoryScores={analysisResult.categoryScores} />
            </div>

            {/* Resume Insights (Strengths, Issues, Recommendations) */}
            <ResumeInsights
              strengths={analysisResult.strengths}
              issues={analysisResult.issues}
              recommendations={analysisResult.recommendations}
            />

            {/* Keyword Match Section */}
            <KeywordAnalysis keywords={analysisResult.keywords} />

            {/* Section Analysis & Formatting Checklist */}
            <div className="results-bottom-grid">
              <SectionAnalysis sections={analysisResult.sections} />
              <FormattingCheck formatting={analysisResult.formatting} />
            </div>

            {/* Step-by-Step Improvement Plan */}
            <ImprovementPlan recommendations={analysisResult.recommendations} />

            {/* Bottom Footer Actions */}
            <div className="results-footer-actions">
              <button className="btn-secondary" onClick={handleReset}>
                <RefreshCw size={16} />
                Analyze Another Resume
              </button>
              <button className="btn-secondary" onClick={onBack}>
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
              <button className="btn-primary" onClick={handleDownloadReport}>
                <Download size={16} />
                Download Report
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
