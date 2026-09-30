import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { messages } = req.body;

  // 1. Validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Invalid request: "messages" must be a non-empty array of message objects.'
    });
  }

  // Validate each message format
  const validRoles = ['user', 'assistant', 'system'];
  const formattedMessages = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      return res.status(400).json({
        error: `Invalid message at index ${i}: message must be an object.`
      });
    }

    if (!validRoles.includes(msg.role)) {
      return res.status(400).json({
        error: `Invalid role "${msg.role}" at index ${i}. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    if (typeof msg.content !== 'string') {
      return res.status(400).json({
        error: `Invalid content at index ${i}: content must be a string.`
      });
    }

    formattedMessages.push({
      role: msg.role,
      content: msg.content
    });
  }

  // Ensure the latest message has content
  const latestMessage = formattedMessages[formattedMessages.length - 1];
  if (!latestMessage.content.trim()) {
    return res.status(400).json({
      error: 'The latest message cannot be empty.'
    });
  }

  // Ensure conversation does not start with an unprompted assistant message (which confuses smaller models)
  while (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
    formattedMessages.shift();
  }

  if (formattedMessages.length === 0) {
    return res.status(400).json({
      error: 'Conversation must contain at least one user message.'
    });
  }

  // Prepend a clear system instruction if not already present
  const messagesForOllama = [...formattedMessages];
  if (!messagesForOllama.some(m => m.role === 'system')) {
    messagesForOllama.unshift({
      role: 'system',
      content: 'You are a helpful and knowledgeable AI assistant. Always provide clear, accurate answers and write working code when requested.'
    });
  }

  // 2. Ollama Configuration
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'gemma:2b';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

  try {
    const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ollamaModel,
        messages: messagesForOllama,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!ollamaResponse.ok) {
      let errDetail = '';
      try {
        const errJson = await ollamaResponse.json();
        errDetail = errJson.error || JSON.stringify(errJson);
      } catch (_) {
        errDetail = await ollamaResponse.text();
      }

      if (ollamaResponse.status === 404) {
        return res.status(404).json({
          error: `Model "${ollamaModel}" not found in Ollama. Run "ollama run ${ollamaModel}" in your terminal to download it.`
        });
      }

      return res.status(ollamaResponse.status).json({
        error: `Ollama error (${ollamaResponse.status}): ${errDetail || ollamaResponse.statusText}`
      });
    }

    const data = await ollamaResponse.json();

    // Ollama chat response shape: { model: "...", message: { role: "assistant", content: "..." }, done: true }
    if (data && data.message) {
      return res.json({
        message: data.message,
        model: data.model || ollamaModel,
        done: data.done
      });
    } else {
      return res.status(500).json({
        error: 'Unexpected response structure from Ollama API.'
      });
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Request timed out waiting for local AI response. Ollama may be busy or loading the model.'
      });
    }

    // Network / connection refused error
    if (error.cause && (error.cause.code === 'ECONNREFUSED' || error.cause.errno === -4078)) {
      return res.status(503).json({
        error: 'Unable to connect to the local AI model. Please make sure Ollama is running.'
      });
    }

    console.error('Error proxying to Ollama:', error);
    return res.status(500).json({
      error: 'Unable to connect to the local AI model. Please make sure Ollama is running.'
    });
  }
});

export default router;
