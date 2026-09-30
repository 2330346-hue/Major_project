import type { SectionAnalysisItem } from '../services/types';
import { CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';

interface SectionAnalysisProps {
  sections: SectionAnalysisItem[];
}

export default function SectionAnalysis({ sections }: SectionAnalysisProps) {
  return (
    <div className="section-analysis-card">
      <div className="section-card-header">
        <FileSpreadsheet size={20} color="#155eef" />
        <h3>Resume Section Checklist</h3>
      </div>

      <div className="table-responsive">
        <table className="section-table">
          <thead>
            <tr>
              <th>Section Name</th>
              <th>Status</th>
              <th>Detailed Feedback</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((item, idx) => (
              <tr key={idx}>
                <td className="section-name-cell">
                  <strong>{item.name}</strong>
                </td>
                <td className="status-cell">
                  {item.status === 'good' && (
                    <span className="status-badge status-good">
                      <CheckCircle2 size={14} /> Good
                    </span>
                  )}
                  {item.status === 'warning' && (
                    <span className="status-badge status-warning">
                      <AlertTriangle size={14} /> Warning
                    </span>
                  )}
                  {item.status === 'missing' && (
                    <span className="status-badge status-missing">
                      <XCircle size={14} /> Missing
                    </span>
                  )}
                </td>
                <td className="feedback-cell">{item.feedback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
