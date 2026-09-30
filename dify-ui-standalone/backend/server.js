import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import ragRouter from './routes/rag.js';
import vendingRouter from './routes/vending.js';

const app = express();
const PORT = process.env.PORT || 5001;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma:2b';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let ollamaConnected = false;
  let availableModels = [];

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      ollamaConnected = true;
      availableModels = (data.models || []).map(m => m.name);
    }
  } catch (_) {
    ollamaConnected = false;
  }

  res.json({
    status: 'ok',
    configuredModel: OLLAMA_MODEL,
    ollamaUrl: OLLAMA_URL,
    ollamaConnected,
    availableModels
  });
});

// Chat, RAG & Vending Agent routes
app.use('/api/chat', chatRouter);
app.use('/api/rag', ragRouter);
app.use('/api/vending', vendingRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Ollama Backend Server running on http://localhost:${PORT}`);
  console.log(` Target Ollama URL : ${OLLAMA_URL}`);
  console.log(` Configured Model  : ${OLLAMA_MODEL}`);
  console.log(`====================================================`);
});
