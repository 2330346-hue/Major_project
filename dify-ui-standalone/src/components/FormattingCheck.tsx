import type { FormattingCheckItem } from '../services/types';
import { CheckCircle2, AlertTriangle, AlertOctagon, Sliders } from 'lucide-react';

interface FormattingCheckProps {
  formatting: FormattingCheckItem[];
}

export default function FormattingCheck({ formatting }: FormattingCheckProps) {
  return (
    <div className="formatting-check-card">
      <div className="formatting-header">
        <Sliders size={20} color="#155eef" />
        <h3>ATS Formatting & Readability Check</h3>
      </div>

      <div className="formatting-list">
        {formatting.map((item, idx) => (
          <div key={idx} className={`formatting-item item-${item.status}`}>
            <div className="formatting-item-left">
              {item.status === 'good' && <CheckCircle2 size={18} color="#12b76a" />}
              {item.status === 'warning' && <AlertTriangle size={18} color="#f79009" />}
              {item.status === 'critical' && <AlertOctagon size={18} color="#f04438" />}
              <span className="formatting-item-name">{item.item}</span>
            </div>
            <div className="formatting-item-feedback">{item.feedback}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
