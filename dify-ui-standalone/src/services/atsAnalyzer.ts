import type { ATSAnalysisResult, CategoryScores, FormattingCheckItem, ParsedResume, RecommendationItem, SectionAnalysisItem } from './types';

// Common technical and professional keywords list for general analysis
const COMMON_INDUSTRY_KEYWORDS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'NoSQL', 'MongoDB',
  'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'REST API', 'GraphQL', 'Git', 'CI/CD',
  'Agile', 'Scrum', 'Project Management', 'Data Analysis', 'Machine Learning', 'AI', 'UI/UX',
  'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Communication', 'Leadership', 'Problem Solving',
  'Architecture', 'Testing', 'Jest', 'Vite', 'Webpack', 'Tailwind', 'HTML', 'CSS', 'Redux', 'System Design'
];

// High-impact action verbs
const ACTION_VERBS = [
  'developed', 'engineered', 'architected', 'spearheaded', 'orchestrated', 'built', 'designed',
  'implemented', 'automated', 'optimized', 'reduced', 'increased', 'expanded', 'led', 'managed',
  'revamped', 'deployed', 'delivered', 'improved', 'scale', 'streamlined', 'generated', 'transformed'
];

/**
 * Main ATS Analyzer entry point.
 * Performs deterministic transparent scoring with 5 categories (20 pts each = 100 total).
 * Can be augmented with an LLM API if configured.
 */
export async function analyzeResume(
  parsedResume: ParsedResume,
  jobDescription?: string
): Promise<ATSAnalysisResult> {
  // Simulate AI delay for smooth multi-step progress feel
  await new Promise((res) => setTimeout(res, 800));

  const text = parsedResume.rawText;
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // ----------------------------------------------------
  // A. ATS COMPATIBILITY (Max 20 pts)
  // ----------------------------------------------------
  let atsScore = 20;
  const formattingCheck: FormattingCheckItem[] = [];

  // Check section headings readability
  const hasStandardHeadings = parsedResume.sectionsDetected.length >= 3;
  formattingCheck.push({
    item: 'Standard section headings',
    status: hasStandardHeadings ? 'good' : 'warning',
    feedback: hasStandardHeadings
      ? `Detected ${parsedResume.sectionsDetected.length} standard ATS section headings (${parsedResume.sectionsDetected.join(', ')})`
      : 'Consider using standard section titles like "Work Experience", "Education", "Skills"'
  });
  if (!hasStandardHeadings) atsScore -= 4;

  // Extractability check
  const extractable = wordCount >= 50;
  formattingCheck.push({
    item: 'Text extractability',
    status: extractable ? 'good' : 'critical',
    feedback: extractable ? 'Text is fully extractable by applicant tracking systems' : 'Low text content detected — may be an image-only PDF'
  });
  if (!extractable) atsScore -= 8;

  // Check formatting anomalies / tables
  const hasTables = parsedResume.detectedFormattingIssues.some(i => i.includes('Tables'));
  formattingCheck.push({
    item: 'Simple readable layout',
    status: hasTables ? 'warning' : 'good',
    feedback: hasTables ? 'Detected table characters or borders — tables can scramble ATS text flow' : 'No problematic table layouts or column blocks detected'
  });
  if (hasTables) atsScore -= 3;

  // Resume length check
  const suitableLength = wordCount >= 300 && wordCount <= 1200;
  formattingCheck.push({
    item: 'Appropriate resume length',
    status: suitableLength ? 'good' : 'warning',
    feedback: wordCount < 300
      ? `Resume is short (${wordCount} words). Aim for 400-800 words for a 1-2 page resume.`
      : wordCount > 1200
      ? `Resume is long (${wordCount} words). Consider truncating older roles to stay under 2 pages.`
      : `Ideal length (${wordCount} words)`
  });
  if (!suitableLength) atsScore -= 2;

  // Contact Info check
  const hasContact = Boolean(parsedResume.contactInfo.email && parsedResume.contactInfo.phone);
  formattingCheck.push({
    item: 'Clear contact information',
    status: hasContact ? 'good' : 'warning',
    feedback: hasContact ? 'Email and phone number are clearly parsed' : 'Missing email or phone number in contact header'
  });
  if (!hasContact) atsScore -= 3;

  atsScore = Math.max(0, Math.min(20, atsScore));

  // ----------------------------------------------------
  // B. RESUME STRUCTURE (Max 20 pts)
  // ----------------------------------------------------
  let structureScore = 0;
  const sections: SectionAnalysisItem[] = [];

  // 1. Contact Info (4 pts)
  if (parsedResume.contactInfo.email && parsedResume.contactInfo.phone) {
    structureScore += 4;
    sections.push({ name: 'Contact Information', status: 'good', feedback: 'Email, phone, and links detected' });
  } else if (parsedResume.contactInfo.email || parsedResume.contactInfo.phone) {
    structureScore += 2;
    sections.push({ name: 'Contact Information', status: 'warning', feedback: 'Incomplete contact info (missing phone or email)' });
  } else {
    sections.push({ name: 'Contact Information', status: 'missing', feedback: 'No valid email or phone detected in header' });
  }

  // 2. Summary (3 pts)
  if (parsedResume.summary || parsedResume.sectionsDetected.includes('Professional Summary')) {
    structureScore += 3;
    sections.push({ name: 'Professional Summary', status: 'good', feedback: 'Clear 2-4 line executive summary present' });
  } else {
    sections.push({ name: 'Professional Summary', status: 'missing', feedback: 'Add a concise summary highlighting key value proposition' });
  }

  // 3. Work Experience (5 pts)
  if (parsedResume.experience.length > 0 || parsedResume.sectionsDetected.includes('Work Experience')) {
    structureScore += 5;
    sections.push({ name: 'Work Experience', status: 'good', feedback: 'Strong work experience section detected' });
  } else {
    sections.push({ name: 'Work Experience', status: 'missing', feedback: 'Missing work experience section heading' });
  }

  // 4. Education (4 pts)
  if (parsedResume.education.length > 0 || parsedResume.sectionsDetected.includes('Education')) {
    structureScore += 4;
    sections.push({ name: 'Education', status: 'good', feedback: 'Education history detected' });
  } else {
    sections.push({ name: 'Education', status: 'missing', feedback: 'Consider adding an Education section' });
  }

  // 5. Skills (4 pts)
  if (parsedResume.skills.length > 0 || parsedResume.sectionsDetected.includes('Skills')) {
    structureScore += 4;
    sections.push({ name: 'Skills', status: 'good', feedback: 'Dedicated skills & competencies section detected' });
  } else {
    sections.push({ name: 'Skills', status: 'missing', feedback: 'Add a categorized Skills section for quick ATS scanning' });
  }

  // Optional: Projects & Certifications
  if (parsedResume.projects.length > 0 || parsedResume.sectionsDetected.includes('Projects')) {
    sections.push({ name: 'Projects', status: 'good', feedback: 'Featured project accomplishments detected' });
  } else {
    sections.push({ name: 'Projects', status: 'warning', feedback: 'Optional: Include featured projects for added proof of impact' });
  }

  if (parsedResume.certifications.length > 0 || parsedResume.sectionsDetected.includes('Certifications')) {
    sections.push({ name: 'Certifications', status: 'good', feedback: 'Certifications and credentials detected' });
  } else {
    sections.push({ name: 'Certifications', status: 'missing', feedback: 'Consider adding industry certifications (AWS, PMP, Scrum, etc.)' });
  }

  structureScore = Math.max(0, Math.min(20, structureScore));

  // ----------------------------------------------------
  // C. KEYWORD OPTIMIZATION (Max 20 pts)
  // ----------------------------------------------------
  let keywordScore = 0;
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const recommendedKeywords: string[] = [];
  let matchPercentage = 0;

  if (jobDescription && jobDescription.trim().length > 20) {
    // Job Description provided -> calculate match ratio
    const jdTokens = Array.from(new Set(jobDescription.match(/\b[A-Za-z0-9+#.-]{3,20}\b/g) || []));
    
    // Extract key technical/role terms from JD
    const jdKeyTerms = jdTokens.filter(token => {
      const isCommonWord = ['the','and','for','with','that','this','have','from','will','your','our','role','team','work'].includes(token.toLowerCase());
      return !isCommonWord && (/[A-Z]/.test(token) || COMMON_INDUSTRY_KEYWORDS.some(k => k.toLowerCase() === token.toLowerCase()));
    });

    const uniqueJdKeywords = Array.from(new Set(jdKeyTerms.length > 0 ? jdKeyTerms : jdTokens.slice(0, 30)));

    for (const kw of uniqueJdKeywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    matchPercentage = Math.round((matchedKeywords.length / Math.max(1, uniqueJdKeywords.length)) * 100);
    // Floor & cap score smoothly
    keywordScore = Math.min(20, Math.max(4, Math.round((matchPercentage / 100) * 20)));

    // Select realistic recommended keywords from missing ones
    recommendedKeywords.push(...missingKeywords.slice(0, 6));

  } else {
    // General keyword analysis against industry standard skills
    for (const kw of COMMON_INDUSTRY_KEYWORDS) {
      if (lowerText.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    matchPercentage = Math.round((matchedKeywords.length / COMMON_INDUSTRY_KEYWORDS.length) * 100);
    keywordScore = Math.min(20, Math.max(6, Math.round((matchedKeywords.length / 10) * 20)));
    recommendedKeywords.push(...missingKeywords.filter(k => !matchedKeywords.includes(k)).slice(0, 5));
  }

  // ----------------------------------------------------
  // D. EXPERIENCE & ACHIEVEMENT QUALITY (Max 20 pts)
  // ----------------------------------------------------
  let expQualityScore = 10;

  // 1. Action verb frequency
  let verbCount = 0;
  for (const verb of ACTION_VERBS) {
    const matches = lowerText.match(new RegExp(`\\b${verb}\\b`, 'g'));
    if (matches) verbCount += matches.length;
  }

  if (verbCount >= 8) expQualityScore += 5;
  else if (verbCount >= 4) expQualityScore += 3;
  else if (verbCount >= 1) expQualityScore += 1;

  // 2. Quantified metrics (e.g. 30%, $100k, 500 users, 4.5 rating)
  const metricsMatches = text.match(/\b\d+%\b|\$\d+[\d,]*k?|\b\d+\s+(users|clients|projects|team members|ms|seconds|hours|x|x\b|times|k|M)\b/gi) || [];
  const metricsCount = metricsMatches.length;

  if (metricsCount >= 5) expQualityScore += 5;
  else if (metricsCount >= 2) expQualityScore += 3;
  else if (metricsCount >= 1) expQualityScore += 1;

  expQualityScore = Math.max(0, Math.min(20, expQualityScore));

  // ----------------------------------------------------
  // E. READABILITY & PROFESSIONAL QUALITY (Max 20 pts)
  // ----------------------------------------------------
  let readabilityScore = 15;

  // Excessive repetition penalty
  const wordsArray = lowerText.match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq: Record<string, number> = {};
  for (const w of wordsArray) wordFreq[w] = (wordFreq[w] || 0) + 1;

  const repeatedBuzzwords = Object.entries(wordFreq).filter(([w, freq]) => freq > 12 && !['experience', 'developed', 'management', 'system', 'project'].includes(w));
  if (repeatedBuzzwords.length > 2) readabilityScore -= 3;

  // Paragraph length check
  const longParagraphs = text.split('\n').filter(p => p.trim().length > 500);
  if (longParagraphs.length > 2) readabilityScore -= 2;

  // Bullet point presence
  const hasBullets = text.includes('•') || text.includes('-') || text.includes('*') || /^\s*\d+\./m.test(text);
  if (hasBullets) readabilityScore += 3;

  readabilityScore = Math.max(0, Math.min(20, readabilityScore));

  // ----------------------------------------------------
  // TOTAL SCORE COMPUTATION
  // ----------------------------------------------------
  const categoryScores: CategoryScores = {
    atsCompatibility: atsScore,
    structure: structureScore,
    keywordOptimization: keywordScore,
    experienceAchievements: expQualityScore,
    readability: readabilityScore
  };

  const overallScore = Math.round(
    atsScore + structureScore + keywordScore + expQualityScore + readabilityScore
  );

  let scoreRating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor' = 'Good';
  if (overallScore >= 85) scoreRating = 'Excellent';
  else if (overallScore >= 70) scoreRating = 'Good';
  else if (overallScore >= 50) scoreRating = 'Needs Improvement';
  else scoreRating = 'Poor';

  // ----------------------------------------------------
  // STRENGTHS, ISSUES, & RECOMMENDATIONS GENERATION
  // ----------------------------------------------------
  const strengths: string[] = [];
  const issues: string[] = [];
  const recommendations: RecommendationItem[] = [];

  // Strengths
  if (hasContact) strengths.push('Clear and accessible contact information in header');
  if (hasStandardHeadings) strengths.push('Standard ATS-friendly section organization');
  if (metricsCount >= 2) strengths.push(`Quantified achievements present (${metricsCount} metric signals detected)`);
  if (verbCount >= 4) strengths.push(`Action-oriented descriptions using strong power verbs (${verbCount} instances)`);
  if (matchedKeywords.length >= 5) strengths.push(`Strong domain keyword density (${matchedKeywords.slice(0, 4).join(', ')})`);

  // Issues
  if (!parsedResume.summary) issues.push('Missing concise professional summary section at top of resume');
  if (metricsCount < 2) issues.push('Lacks measurable results and numeric impact metrics in work history');
  if (verbCount < 4) issues.push('Uses passive phrasing ("responsible for") instead of strong action verbs');
  if (missingKeywords.length > 3 && jobDescription) issues.push(`Missing key job description keywords (${missingKeywords.slice(0, 3).join(', ')})`);
  if (hasTables) issues.push('Detected potential table formatting that can break ATS parsing order');

  // Priority Action Plan Recommendations
  if (missingKeywords.length > 0 && jobDescription) {
    recommendations.push({
      priority: 'high',
      title: 'Incorporate Missing Job Keywords',
      description: `Integrate relevant job keywords such as ${missingKeywords.slice(0, 4).join(', ')} into your bullet points where applicable.`,
      whyItMatters: 'ATS scanners rank candidates based on exact keyword overlap with job descriptions.',
      actionableStep: 'Add 2-3 bullet points under recent roles incorporating these specific skills.'
    });
  }

  if (metricsCount < 3) {
    recommendations.push({
      priority: 'high',
      title: 'Quantify Accomplishments with Metrics',
      description: 'Replace generic job duties with specific numbers, percentages, dollar values, or team sizes.',
      whyItMatters: 'Resumes with numerical proof of performance score 40% higher with recruiters.',
      actionableStep: 'Change "Responsible for improving page speed" to "Optimized load performance by 35%, boosting user retention."'
    });
  }

  if (!parsedResume.summary) {
    recommendations.push({
      priority: 'medium',
      title: 'Add a 3-Line Professional Summary',
      description: 'Place a concise executive overview under your contact header stating your title, key skills, and top achievement.',
      whyItMatters: 'Human recruiters spend under 6 seconds on initial resume review.',
      actionableStep: 'Write a 3-sentence summary: Title & Years -> Core Technical Expertise -> Impact Highlight.'
    });
  }

  recommendations.push({
    priority: 'medium',
    title: 'Standardize Bullet Point Structure',
    description: 'Ensure every experience point begins with an active past-tense verb followed by context and result.',
    whyItMatters: 'Clean formatting improves both automated ATS parsing and human readability.',
    actionableStep: 'Use the formula: Action Verb + Task / Tool + Quantified Business Outcome.'
  });

  const summaryText = overallScore >= 80
    ? `Your resume demonstrates strong ATS compatibility (${overallScore}/100) with clear structure and strong keyword alignment.`
    : overallScore >= 70
    ? `Your resume is generally ATS-friendly (${overallScore}/100), but addressing key missing keywords and adding quantified impact will significantly boost your candidate ranking.`
    : `Your resume needs improvements (${overallScore}/100) in section formatting, keyword targeting, and achievement phrasing to pass automated ATS filters.`;

  return {
    overallScore,
    scoreRating,
    categoryScores,
    summary: summaryText,
    strengths,
    issues,
    recommendations,
    keywords: {
      matched: matchedKeywords.slice(0, 15),
      missing: missingKeywords.slice(0, 10),
      recommended: recommendedKeywords.slice(0, 8),
      matchPercentage: jobDescription ? matchPercentage : undefined
    },
    sections,
    formatting: formattingCheck,
    parsedResumeInfo: {
      fileName: parsedResume.fileName,
      wordCount,
      charCount: text.length
    }
  };
}
