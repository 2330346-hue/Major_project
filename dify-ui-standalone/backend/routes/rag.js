import { Router } from 'express';
import { ragEngine } from '../services/ragEngine.js';

const router = Router();

// GET /api/rag/documents - List all indexed documents
router.get('/documents', (req, res) => {
  try {
    const docs = ragEngine.getDocuments();
    return res.json({
      status: 'success',
      totalDocuments: docs.length,
      documents: docs
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents.' });
  }
});

// POST /api/rag/documents - Add a new document
router.post('/documents', (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  try {
    const doc = ragEngine.addDocument(title, content, category || 'General');
    return res.status(201).json({
      status: 'success',
      message: 'Document indexed successfully.',
      document: doc
    });
  } catch (error) {
    console.error('Error adding document:', error);
    return res.status(500).json({ error: error.message || 'Failed to index document.' });
  }
});

// DELETE /api/rag/documents/:id - Remove document
router.delete('/documents/:id', (req, res) => {
  const { id } = req.params;
  try {
    const deleted = ragEngine.deleteDocument(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    return res.json({ status: 'success', message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// POST /api/rag/query - Semantic Search only (Retrieval inspection)
router.post('/query', (req, res) => {
  const { query, topK = 3, documentId } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query string is required.' });
  }

  try {
    const matches = ragEngine.search(query, parseInt(topK) || 3, documentId || null);
    return res.json({
      status: 'success',
      query,
      matchCount: matches.length,
      matches
    });
  } catch (error) {
    console.error('Error querying RAG:', error);
    return res.status(500).json({ error: 'Failed to search knowledge base.' });
  }
});

// POST /api/rag/chat - End-to-end RAG Generation with Ollama gemma:2b
router.post('/chat', async (req, res) => {
  const { query, topK = 3, documentId, enableRAG = true } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'gemma:2b';

  let messagesForOllama = [];
  let citations = [];

  if (enableRAG) {
    // 1. Retrieval Phase: search knowledge base
    const matches = ragEngine.search(query, parseInt(topK) || 3, documentId || null);

    // 2. Augmentation Phase: build context
    const augmented = ragEngine.buildAugmentedPrompt(query, matches);
    citations = augmented.citations || [];

    messagesForOllama = [
      { role: 'system', content: augmented.systemPrompt },
      { role: 'user', content: augmented.userPrompt }
    ];
  } else {
    // General chat without RAG
    messagesForOllama = [
      { role: 'system', content: 'You are a helpful and knowledgeable AI assistant.' },
      { role: 'user', content: query }
    ];
  }

  // 3. Generation Phase: Send augmented prompt to local Ollama gemma:2b
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: messagesForOllama,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      return res.status(ollamaResponse.status).json({
        error: `Ollama error (${ollamaResponse.status}): ${errText}`
      });
    }

    const data = await ollamaResponse.json();
    const answer = data.message ? data.message.content : '';

    return res.json({
      status: 'success',
      answer,
      citations,
      isRAG: enableRAG,
      model: ollamaModel,
      retrievedCount: citations.length
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Ollama request timed out.' });
    }
    console.error('Error generating RAG response:', error);
    return res.status(500).json({
      error: 'Unable to connect to the local AI model. Please make sure Ollama is running.'
    });
  }
});

export default router;
