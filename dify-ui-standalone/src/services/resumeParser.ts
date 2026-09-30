import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { ContactInfo, ParsedResume } from './types';

// Set up PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch {
    // Fallback if worker CDN fails
  }
}

/**
 * Extracts raw text from a File object (PDF, DOCX, DOC, TXT).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'txt') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read TXT file'));
      reader.readAsText(file);
    });
  }

  if (extension === 'docx' || extension === 'doc') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value;
      }
    } catch (err) {
      console.warn('Mammoth extraction failed, falling back to text stream reader', err);
    }
  }

  if (extension === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      let text = '';

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        text += pageText + '\n';
      }

      if (text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      console.warn('PDF.js text extraction failed, trying binary fallback', err);
    }
  }

  // Fallback text extraction for raw text/stream files
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      // Clean printable ASCII & UTF-8 characters from stream
      const printable = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
      resolve(printable);
    };
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

/**
 * Extracts structured details from raw resume text.
 */
export function parseResumeContent(rawText: string, fileName: string, fileSize: number, fileType: string): ParsedResume {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Extract contact info
  const contactInfo: ContactInfo = {};

  // Email extraction
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (emailMatch) {
    contactInfo.email = emailMatch[0];
  }

  // Phone extraction
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[0];
  }

  // Links extraction
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) contactInfo.linkedin = `https://${linkedinMatch[0]}`;

  const githubMatch = rawText.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  if (githubMatch) contactInfo.github = `https://${githubMatch[0]}`;

  const websiteMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:com|io|dev|me|org|net)\b/i);
  if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')) {
    contactInfo.website = websiteMatch[0];
  }

  // Candidate Name (heuristic: first non-empty line without email/phone/url)
  if (lines.length > 0) {
    const candidateLine = lines[0];
    if (candidateLine.length < 40 && !candidateLine.includes('@') && !candidateLine.includes('http')) {
      contactInfo.name = candidateLine;
    }
  }

  // Identify sections
  const sectionsDetected: string[] = [];
  const experience: string[] = [];
  const education: string[] = [];
  const skills: string[] = [];
  const projects: string[] = [];
  const certifications: string[] = [];
  let summary = '';

  let currentSection = 'header';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Section detection heuristics
    if (/^(work\s+experience|experience|employment\s+history|professional\s+experience|career)/i.test(lower)) {
      currentSection = 'experience';
      if (!sectionsDetected.includes('Work Experience')) sectionsDetected.push('Work Experience');
      continue;
    } else if (/^(education|academic\s+background|academic\s+history|qualifications)/i.test(lower)) {
      currentSection = 'education';
      if (!sectionsDetected.includes('Education')) sectionsDetected.push('Education');
      continue;
    } else if (/^(skills|technical\s+skills|core\s+competencies|technologies|tools)/i.test(lower)) {
      currentSection = 'skills';
      if (!sectionsDetected.includes('Skills')) sectionsDetected.push('Skills');
      continue;
    } else if (/^(projects|personal\s+projects|key\s+projects|featured\s+projects)/i.test(lower)) {
      currentSection = 'projects';
      if (!sectionsDetected.includes('Projects')) sectionsDetected.push('Projects');
      continue;
    } else if (/^(certifications|licenses|courses|accreditations|certifications\s+&\s+licenses)/i.test(lower)) {
      currentSection = 'certifications';
      if (!sectionsDetected.includes('Certifications')) sectionsDetected.push('Certifications');
      continue;
    } else if (/^(summary|professional\s+summary|profile|about\s+me|objective|executive\s+summary)/i.test(lower)) {
      currentSection = 'summary';
      if (!sectionsDetected.includes('Professional Summary')) sectionsDetected.push('Professional Summary');
      continue;
    }

    // Populate current section content
    switch (currentSection) {
      case 'summary':
        summary += line + ' ';
        break;
      case 'experience':
        experience.push(line);
        break;
      case 'education':
        education.push(line);
        break;
      case 'skills':
        skills.push(line);
        break;
      case 'projects':
        projects.push(line);
        break;
      case 'certifications':
        certifications.push(line);
        break;
    }
  }

  // Formatting issue detection signals
  const detectedFormattingIssues: string[] = [];

  if (rawText.includes('|') || rawText.includes('+---+') || rawText.includes('│')) {
    detectedFormattingIssues.push('Tables or ASCII table borders detected (may confuse ATS parsers)');
  }
  if ((rawText.match(/[•●▪◆★]/g) || []).length > 25) {
    detectedFormattingIssues.push('Excessive bullet point symbols detected');
  }
  if (!contactInfo.email) {
    detectedFormattingIssues.push('Missing clear email address');
  }
  if (!contactInfo.phone) {
    detectedFormattingIssues.push('Missing contact phone number');
  }
  if (rawText.length < 300) {
    detectedFormattingIssues.push('Resume content is extremely short (< 300 characters)');
  }
  if (rawText.length > 12000) {
    detectedFormattingIssues.push('Resume length is excessively long (> 3 pages)');
  }

  return {
    rawText,
    fileName,
    fileSize,
    fileType,
    contactInfo,
    summary: summary.trim() || undefined,
    experience,
    education,
    skills,
    projects,
    certifications,
    sectionsDetected,
    detectedFormattingIssues
  };
}
