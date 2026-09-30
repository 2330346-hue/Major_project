import type { ATSAnalysisResult } from '../services/types';
import { Award, Info } from 'lucide-react';

interface ATSScoreCardProps {
  result: ATSAnalysisResult;
}

export default function ATSScoreCard({ result }: ATSScoreCardProps) {
  const { overallScore, scoreRating, summary } = result;

  // SVG Gauge calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  let strokeColor = '#155eef'; // Good default blue
  let ratingClass = 'badge-good';

  if (overallScore >= 85) {
    strokeColor = '#12b76a';
    ratingClass = 'badge-excellent';
  } else if (overallScore >= 70) {
    strokeColor = '#155eef';
    ratingClass = 'badge-good';
  } else if (overallScore >= 50) {
    strokeColor = '#f79009';
    ratingClass = 'badge-improvement';
  } else {
    strokeColor = '#f04438';
    ratingClass = 'badge-poor';
  }

  return (
    <div className="ats-score-card">
      <div className="score-card-header">
        <Award size={20} color="#155eef" />
        <h3>Your ATS Score</h3>
      </div>

      <div className="gauge-container">
        <svg className="score-gauge-svg" width="160" height="160" viewBox="0 0 160 160">
          <circle
            className="gauge-bg"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
          />
          <circle
            className="gauge-fill"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        <div className="gauge-inner-text">
          <span className="gauge-score-number">{overallScore}</span>
          <span className="gauge-score-max">/ 100</span>
        </div>
      </div>

      <div className="rating-badge-wrapper">
        <span className={`score-rating-badge ${ratingClass}`}>
          {scoreRating}
        </span>
      </div>

      <p className="score-summary-text">{summary}</p>

      <div className="ats-disclaimer">
        <Info size={14} color="#667085" />
        <span>
          ATS scores are estimates based on common resume-screening and formatting practices. Actual results vary by employer and ATS.
        </span>
      </div>
    </div>
  );
}
