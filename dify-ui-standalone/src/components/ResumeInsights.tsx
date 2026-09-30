import type { RecommendationItem } from '../services/types';
import { CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

interface ResumeInsightsProps {
  strengths: string[];
  issues: string[];
  recommendations: RecommendationItem[];
}

export default function ResumeInsights({ strengths, issues, recommendations }: ResumeInsightsProps) {
  return (
    <div className="insights-container">
      <h3 className="section-title">Resume Insights</h3>

      <div className="insights-grid">
        {/* Strengths Card */}
        <div className="insight-column strength-col">
          <div className="insight-col-header">
            <CheckCircle2 size={18} color="#12b76a" />
            <h4>Strengths ({strengths.length})</h4>
          </div>
          <ul className="insight-list">
            {strengths.map((item, idx) => (
              <li key={idx} className="insight-item strength-item">
                <span className="bullet-dot green-dot"></span>
                <span>{item}</span>
              </li>
            ))}
            {strengths.length === 0 && (
              <li className="empty-insight">No specific strengths recorded.</li>
            )}
          </ul>
        </div>

        {/* Issues Found Card */}
        <div className="insight-column issue-col">
          <div className="insight-col-header">
            <AlertTriangle size={18} color="#f79009" />
            <h4>Issues Found ({issues.length})</h4>
          </div>
          <ul className="insight-list">
            {issues.map((item, idx) => (
              <li key={idx} className="insight-item issue-item">
                <span className="bullet-dot amber-dot"></span>
                <span>{item}</span>
              </li>
            ))}
            {issues.length === 0 && (
              <li className="empty-insight">No major formatting or content issues detected!</li>
            )}
          </ul>
        </div>

        {/* Actionable Recommendations */}
        <div className="insight-column recommendation-col">
          <div className="insight-col-header">
            <Lightbulb size={18} color="#155eef" />
            <h4>Recommendations</h4>
          </div>
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="rec-card">
                <div className="rec-card-top">
                  <span className={`priority-badge priority-${rec.priority}`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                  <h5>{rec.title}</h5>
                </div>
                <p className="rec-desc">{rec.description}</p>
                {rec.actionableStep && (
                  <div className="rec-action-box">
                    <strong>Action Step:</strong> {rec.actionableStep}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
