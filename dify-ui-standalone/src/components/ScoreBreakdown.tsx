import type { CategoryScores } from '../services/types';
import { FileCheck, LayoutGrid, KeyRound, TrendingUp, BookOpen } from 'lucide-react';

interface ScoreBreakdownProps {
  categoryScores: CategoryScores;
}

export default function ScoreBreakdown({ categoryScores }: ScoreBreakdownProps) {
  const categories = [
    {
      key: 'atsCompatibility',
      name: 'ATS Compatibility',
      score: categoryScores.atsCompatibility,
      max: 20,
      icon: <FileCheck size={20} color="#155eef" />,
      description: 'Standard section headings, simple readable structure, and clean text extraction.'
    },
    {
      key: 'structure',
      name: 'Resume Structure',
      score: categoryScores.structure,
      max: 20,
      icon: <LayoutGrid size={20} color="#7a5af8" />,
      description: 'Presence of essential sections: Contact, Summary, Experience, Education, Skills.'
    },
    {
      key: 'keywordOptimization',
      name: 'Keyword Optimization',
      score: categoryScores.keywordOptimization,
      max: 20,
      icon: <KeyRound size={20} color="#c11574" />,
      description: 'Matching role-specific skills, technical terms, and industry keywords.'
    },
    {
      key: 'experienceAchievements',
      name: 'Experience & Achievements',
      score: categoryScores.experienceAchievements,
      max: 20,
      icon: <TrendingUp size={20} color="#12b76a" />,
      description: 'Use of high-impact action verbs and quantified numeric business metrics.'
    },
    {
      key: 'readability',
      name: 'Readability & Professional Quality',
      score: categoryScores.readability,
      max: 20,
      icon: <BookOpen size={20} color="#f79009" />,
      description: 'Formatting consistency, optimal word length, and professional language.'
    }
  ];

  return (
    <div className="score-breakdown-section">
      <h3 className="section-title">Score Breakdown</h3>
      <div className="breakdown-grid">
        {categories.map((cat) => {
          const pct = Math.round((cat.score / cat.max) * 100);
          return (
            <div key={cat.key} className="breakdown-card">
              <div className="breakdown-card-top">
                <div className="breakdown-icon-wrapper">
                  {cat.icon}
                </div>
                <div className="breakdown-title-wrap">
                  <h4>{cat.name}</h4>
                  <span className="breakdown-score">
                    <strong>{cat.score}</strong> / {cat.max}
                  </span>
                </div>
              </div>

              <div className="breakdown-progress-track">
                <div
                  className="breakdown-progress-bar"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="breakdown-desc">{cat.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
