import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'knowledge_base.json');

// Stop words for clean token matching
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in',
  'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
]);

// Tokenize text into keywords
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

// Compute Term Frequency vector for a list of tokens
function computeTF(tokens) {
  const tf = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  const total = tokens.length || 1;
  for (const token in tf) {
    tf[token] = tf[token] / total;
  }
  return tf;
}

// Split a document into overlapping chunks
export function chunkText(text, chunkSize = 400, chunkOverlap = 60) {
  if (!text) return [];
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (clean.length <= chunkSize) {
    return [clean];
  }

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = start + chunkSize;
    if (end < clean.length) {
      // Find clean word boundary
      const lastSpace = clean.lastIndexOf(' ', end);
      if (lastSpace > start + 100) {
        end = lastSpace;
      }
    }
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start = end - chunkOverlap;
  }
  return chunks;
}

export class RAGEngine {
  constructor() {
    this.documents = [];
    this.chunks = [];
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const data = JSON.parse(raw);
        this.documents = data.documents || [];
        this.rebuildIndex();
        return;
      } catch (e) {
        console.error('Failed to load knowledge base from disk, seeding defaults:', e);
      }
    }

    this.seedDefaults();
  }

  seedDefaults() {
    this.documents = [
      {
        id: 'doc-handbook',
        title: 'Enterprise Employee Handbook & IT Policies',
        category: 'Human Resources',
        createdAt: new Date().toISOString(),
        content: `
Company Remote Work Policy:
Employees are eligible for up to 3 remote working days per week with manager approval. Core working hours are between 10:00 AM and 4:00 PM in the employee's local time zone.

Leave & Vacation Policy:
Full-time team members receive 25 days of paid annual leave plus 10 national holidays. Sick leave provides up to 12 days annually without requiring a doctor's note for absences under 3 consecutive days.

IT & Security Protocols:
All company hardware must have full-disk BitLocker encryption enabled. Passwords must be at least 14 characters long and renewed every 90 days. Two-Factor Authentication (2FA) is mandatory across all internal tools, VPNs, and GitHub accounts.
`
      },
      {
        id: 'doc-ai-specs',
        title: 'Project Architecture & Local AI Specifications',
        category: 'Engineering',
        createdAt: new Date().toISOString(),
        content: `
Local LLM Architecture:
The system uses Ollama running locally on port 11434 with Google Gemma 2B (gemma:2b). The model has 2 billion parameters and is optimized for low-latency inference on local hardware without cloud data transmission.

Whisper Speech Recognition:
Audio transcription utilizes OpenAI Whisper Tiny running as a local Flask API on port 5000. It decodes MP3, WAV, and WebM streams using FFmpeg and runs entirely on the CPU with FP32 precision.

Retrieval-Augmented Generation (RAG):
The RAG pipeline extracts text from uploaded documents, segments them into 400-character chunks with a 60-character sliding window, and indexes them using BM25 and term frequency vectors. When a user asks a question, the top relevant chunks are retrieved with cosine similarity scores and formatted into the prompt context for Gemma 2B.
`
      },
      {
        id: 'doc-customer-faq',
        title: 'Customer Support & Product Returns FAQ',
        category: 'Customer Service',
        createdAt: new Date().toISOString(),
        content: `
Order Cancellation & Returns:
Customers can cancel orders within 2 hours of placement for a 100% instant refund. Return windows are open for 30 calendar days following delivery. Products must be in original packaging with all tags attached.

Shipping & Delivery Timelines:
Standard shipping takes 3-5 business days across North America and Europe. Express overnight shipping is available for orders placed before 1:00 PM EST. Free international shipping applies to orders over $150.

Support Hours & Escalations:
Our local support team is active 24/7 via live chat. Tier-2 technical inquiries are addressed within 4 business hours, and critical account security escalations receive priority callback within 15 minutes.
`
      }
    ];

    this.saveToDisk();
    this.rebuildIndex();
  }

  saveToDisk() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify({ documents: this.documents }, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving knowledge base to disk:', e);
    }
  }

  rebuildIndex() {
    this.chunks = [];
    for (const doc of this.documents) {
      const docChunks = chunkText(doc.content);
      docChunks.forEach((text, idx) => {
        const tokens = tokenize(text);
        this.chunks.push({
          id: `${doc.id}-chunk-${idx}`,
          docId: doc.id,
          docTitle: doc.title,
          category: doc.category || 'General',
          chunkIndex: idx,
          totalChunks: docChunks.length,
          text,
          tokens,
          tf: computeTF(tokens)
        });
      });
    }
  }

  // Add document to knowledge base
  addDocument(title, content, category = 'General') {
    if (!title || !content) {
      throw new Error('Title and content are required.');
    }
    const id = `doc-${Date.now()}`;
    const newDoc = {
      id,
      title: title.trim(),
      category: category.trim(),
      createdAt: new Date().toISOString(),
      content: content.trim()
    };
    this.documents.push(newDoc);
    this.saveToDisk();
    this.rebuildIndex();
    return newDoc;
  }

  // Delete document
  deleteDocument(docId) {
    const before = this.documents.length;
    this.documents = this.documents.filter(d => d.id !== docId);
    if (this.documents.length !== before) {
      this.saveToDisk();
      this.rebuildIndex();
      return true;
    }
    return false;
  }

  // List all indexed documents with stats
  getDocuments() {
    return this.documents.map(doc => {
      const docChunks = this.chunks.filter(c => c.docId === doc.id);
      const wordCount = doc.content.split(/\s+/).filter(Boolean).length;
      return {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        createdAt: doc.createdAt,
        wordCount,
        chunkCount: docChunks.length
      };
    });
  }

  // Core RAG Semantic Retrieval
  search(query, topK = 3, targetDocId = null) {
    if (!query || typeof query !== 'string') return [];
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTF = computeTF(queryTokens);

    // Calculate Cosine Similarity & BM25 Match between query and each chunk
    const scoredChunks = [];

    const candidateChunks = targetDocId 
      ? this.chunks.filter(c => c.docId === targetDocId)
      : this.chunks;

    for (const chunk of candidateChunks) {
      let dotProduct = 0;
      let queryNorm = 0;
      let chunkNorm = 0;

      // Exact term overlap count
      let matchedTerms = 0;

      for (const token of queryTokens) {
        const qVal = queryTF[token] || 0;
        const cVal = chunk.tf[token] || 0;
        dotProduct += qVal * cVal;
        queryNorm += qVal * qVal;
        if (cVal > 0) matchedTerms++;
      }

      for (const token in chunk.tf) {
        const cVal = chunk.tf[token];
        chunkNorm += cVal * cVal;
      }

      queryNorm = Math.sqrt(queryNorm);
      chunkNorm = Math.sqrt(chunkNorm);

      let cosineSim = 0;
      if (queryNorm > 0 && chunkNorm > 0) {
        cosineSim = dotProduct / (queryNorm * chunkNorm);
      }

      // Bonus for multiple keyword hits
      const coverageRatio = matchedTerms / queryTokens.length;
      const combinedScore = (cosineSim * 0.65) + (coverageRatio * 0.35);

      if (combinedScore > 0.05) {
        scoredChunks.push({
          id: chunk.id,
          docId: chunk.docId,
          docTitle: chunk.docTitle,
          category: chunk.category,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          text: chunk.text,
          score: Math.min(1.0, combinedScore),
          percentage: Math.min(100, Math.round(combinedScore * 100))
        });
      }
    }

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK);
  }

  // Format retrieved chunks into an augmented LLM context
  buildAugmentedPrompt(userQuery, retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return {
        systemPrompt: 'You are a knowledgeable AI assistant.',
        userPrompt: userQuery,
        hasContext: false
      };
    }

    const contextSnippets = retrievedChunks.map((c, i) => {
      return `[Source ${i + 1}: ${c.docTitle} (Section ${c.chunkIndex + 1})]\n${c.text}`;
    }).join('\n\n');

    const systemPrompt = `You are an accurate, enterprise-grade Knowledge Base AI assistant. 
You must answer the user's question using ONLY the retrieved facts from the verified context below.
RULES:
1. Ground your answer strictly on the provided context snippets.
2. Cite the exact source document and section name when stating facts.
3. If the answer cannot be determined from the context, clearly explain that the information is not present in the current knowledge base.
4. Do NOT invent, assume, or hallucinate details.`;

    const userPrompt = `VERIFIED CONTEXT FROM KNOWLEDGE BASE:
--------------------------------------------------
${contextSnippets}
--------------------------------------------------

USER QUESTION:
${userQuery}

Please provide a clear, well-structured answer with source citations based solely on the context above:`;

    return {
      systemPrompt,
      userPrompt,
      hasContext: true,
      citations: retrievedChunks.map((c, i) => ({
        sourceNumber: i + 1,
        docTitle: c.docTitle,
        chunkIndex: c.chunkIndex + 1,
        relevanceScore: `${c.percentage}%`,
        snippet: c.text
      }))
    };
  }
}

export const ragEngine = new RAGEngine();
