import type { RecommendationItem } from '../services/types';
import { ArrowUpRight, ShieldAlert, CheckSquare } from 'lucide-react';

interface ImprovementPlanProps {
  recommendations: RecommendationItem[];
}

export default function ImprovementPlan({ recommendations }: ImprovementPlanProps) {
  return (
    <div className="improvement-plan-card">
      <div className="plan-header">
        <CheckSquare size={20} color="#155eef" />
        <div>
          <h3>Improve Your Resume — Action Plan</h3>
          <p className="plan-subtitle">Follow these prioritized steps to maximize your ATS pass rate and recruiter engagement.</p>
        </div>
      </div>

      <div className="plan-steps-wrapper">
        {recommendations.map((item, idx) => (
          <div key={idx} className="plan-step-item">
            <div className="step-number-badge">
              {idx + 1}
            </div>

            <div className="step-content">
              <div className="step-top-line">
                <span className={`step-priority-badge priority-${item.priority}`}>
                  Priority {idx + 1} — {item.priority.toUpperCase()}
                </span>
                <h4>{item.title}</h4>
              </div>

              <p className="step-desc">{item.description}</p>

              {item.whyItMatters && (
                <div className="step-why-box">
                  <ShieldAlert size={14} color="#667085" />
                  <span><strong>Why it matters:</strong> {item.whyItMatters}</span>
                </div>
              )}

              {item.actionableStep && (
                <div className="step-action-box">
                  <ArrowUpRight size={14} color="#155eef" />
                  <span><strong>Suggested Action:</strong> {item.actionableStep}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
