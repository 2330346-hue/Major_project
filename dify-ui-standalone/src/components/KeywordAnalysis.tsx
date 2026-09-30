import { Check, Plus, AlertCircle, Target } from 'lucide-react';

interface KeywordAnalysisProps {
  keywords: {
    matched: string[];
    missing: string[];
    recommended: string[];
    matchPercentage?: number;
  };
}

export default function KeywordAnalysis({ keywords }: KeywordAnalysisProps) {
  const { matched, missing, recommended, matchPercentage } = keywords;

  return (
    <div className="keyword-analysis-card">
      <div className="keyword-header">
        <div className="keyword-header-title">
          <Target size={20} color="#155eef" />
          <h3>Keyword Match Analysis</h3>
        </div>

        {matchPercentage !== undefined && (
          <div className="match-percentage-badge">
            Overall Match: <strong>{matchPercentage}%</strong>
          </div>
        )}
      </div>

      <div className="keyword-grid">
        {/* Matched Keywords */}
        <div className="keyword-group">
          <h4>Matched Keywords ({matched.length})</h4>
          <div className="chips-wrapper">
            {matched.map((kw, idx) => (
              <span key={idx} className="chip chip-matched">
                <Check size={12} />
                {kw}
              </span>
            ))}
            {matched.length === 0 && (
              <span className="empty-keyword-text">No direct matching keywords detected.</span>
            )}
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="keyword-group">
          <h4>Missing Job Keywords ({missing.length})</h4>
          <div className="chips-wrapper">
            {missing.map((kw, idx) => (
              <span key={idx} className="chip chip-missing">
                <Plus size={12} />
                {kw}
              </span>
            ))}
            {missing.length === 0 && (
              <span className="empty-keyword-text">Great job! All target job keywords were matched.</span>
            )}
          </div>
        </div>

        {/* Recommended Keywords */}
        <div className="keyword-group">
          <h4>Recommended Skills to Highlight</h4>
          <div className="chips-wrapper">
            {recommended.map((kw, idx) => (
              <span key={idx} className="chip chip-recommended">
                {kw}
              </span>
            ))}
          </div>
         </div>
      </div>

      <div className="keyword-ethical-note">
        <AlertCircle size={14} color="#667085" />
        <span>
          <strong>Ethical ATS Tip:</strong> Never add skills or keywords for technologies you do not actually possess. Only highlight skills you genuinely have experience with.
        </span>
      </div>
    </div>
  );
}
