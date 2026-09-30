import { useState, useEffect, useRef } from 'react';
import './ChatScreen.css';
import { ArrowLeft, Send, Sparkles, Plus, Image, Paperclip, Mic, Menu, Info, RotateCcw } from 'lucide-react';
import cottonbroHandImg from '../assets/pexels-cottonbro-6153345.jpg';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp?: string;
  isError?: boolean;
  citations?: string[];
}

interface ChatScreenProps {
  appId: string | null;
  onBack: () => void;
  onLogout: () => void;
}

const APP_INFO_MAPPING: Record<string, { name: string; welcome: string }> = {
  'customer-support': {
    name: 'Customer Support Bot (Ollama)',
    welcome: 'Hello! I am your local Customer Support assistant powered by Ollama gemma:2b. How can I help you today?'
  },
  'lead-gen': {
    name: 'Lead Generation Agent (Ollama)',
    welcome: 'Welcome! I am your local Lead Generation agent powered by Ollama gemma:2b. Ask me anything about qualifying prospects and marketing campaigns!'
  },
  'doc-summarizer': {
    name: 'Document Summarizer (Ollama)',
    welcome: 'Hello! I am your local summarizer assistant powered by Ollama gemma:2b. Paste any text to get clear, concise summaries.'
  }
};

const DEFAULT_APP_INFO = {
  name: 'Local Ollama Assistant (gemma:2b)',
  welcome: 'Hello! I am your local AI assistant powered by Ollama and gemma:2b. How can I assist you today?'
};

const formatTimestamp = (date = new Date()) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatScreen({ appId, onBack, onLogout }: ChatScreenProps) {
  const info = appId ? (APP_INFO_MAPPING[appId] || DEFAULT_APP_INFO) : DEFAULT_APP_INFO;
  const storageKey = `ollama_chat_history_${appId || 'default'}`;

  // Initial messages from localStorage or default welcome message
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`ollama_chat_history_${appId || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage', e);
    }
    return [{ id: '1', sender: 'bot', text: info.welcome, timestamp: formatTimestamp() }];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([
    { id: '1', title: 'Ollama Gemma Session', active: true },
    { id: '2', title: 'Local AI Workspace', active: false },
    { id: '3', title: 'Workflow Assistance', active: false }
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const windowEndRef = useRef<HTMLDivElement>(null);

  // Audio voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Scroll to bottom on new messages or typing state change
  useEffect(() => {
    windowEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history to localStorage', e);
    }
  }, [messages, storageKey]);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');
          
          const res = await fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData
          });
          
          const data = await res.json();
          if (data.text) {
            setInputText(prev => prev ? `${prev} ${data.text}` : data.text);
          } else if (data.error) {
            console.error('Whisper Transcribe Error:', data.error);
            alert('Transcription Error: ' + data.error);
          }
        } catch (err) {
          console.error('Error connecting to Whisper server:', err);
          alert('Could not connect to Whisper Transcriber backend on http://localhost:5000. Make sure python app.py is running.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone permission denied or audio device not found.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Start new conversation
  const handleNewChat = () => {
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      sender: 'bot',
      text: info.welcome,
      timestamp: formatTimestamp()
    };
    setMessages([welcomeMsg]);
    setInputText('');
    localStorage.removeItem(storageKey);
  };

  // Clear conversation with confirmation
  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      handleNewChat();
    }
  };

  // Send message to local Ollama via backend API
  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    const userText = inputText.trim();
    const userTimestamp = formatTimestamp();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: userTimestamp
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    // Build multi-turn conversational context for Ollama API
    // Convert 'user' -> 'user', 'bot' -> 'assistant'
    const conversationHistory = updatedMessages
      .filter(msg => !msg.isError)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: conversationHistory
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `Server returned error (${response.status})`);
      }

      const assistantReply = data.message?.content || 'No response text received.';
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: assistantReply,
        timestamp: formatTimestamp()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Ollama Chat Error:', err);

      let friendlyError = 'Unable to connect to the local AI model. Please make sure Ollama is running.';
      if (err instanceof Error && err.message) {
        if (err.message.includes('not found') || err.message.includes('timed out')) {
          friendlyError = err.message;
        }
      }

      const botErrorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: friendlyError,
        timestamp: formatTimestamp(),
        isError: true
      };
      setMessages(prev => [...prev, botErrorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !isTyping) {
        handleSend();
      }
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <aside className={`chat-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="avatar" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', width: '1.75rem', height: '1.75rem' }}>D</div>
            <span>Dify WebApp</span>
          </div>
          <button type="button" className="icon-btn" style={{ color: '#98a2b3' }} onClick={() => setSidebarOpen(false)}>
            <Menu size={16} />
          </button>
        </div>
        
        <button type="button" className="new-chat-btn" onClick={handleNewChat} title="Start fresh conversation">
          <Plus size={16} />
          New Conversation
        </button>
        
        <div className="chat-history-list">
          {history.map(item => (
            <div 
              key={item.id} 
              className={`history-item ${item.active ? 'active' : ''}`}
              onClick={() => {
                setHistory(history.map(h => ({ ...h, active: h.id === item.id })));
              }}
            >
              <div className="history-item-left">
                <Sparkles size={14} />
                <span>{item.title}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <button type="button" className="sidebar-footer-btn" onClick={handleClearChat} title="Clear conversation history">
            <RotateCcw size={16} />
            Clear Chat
          </button>
          <button type="button" className="sidebar-footer-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            Back to Studio
          </button>
          <button type="button" className="sidebar-footer-btn" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main chat view */}
      <main className="chat-main">
        <header className="chat-header">
          <div className="header-info">
            {!sidebarOpen && (
              <button type="button" className="icon-btn" onClick={() => setSidebarOpen(true)} style={{ marginRight: '0.5rem' }}>
                <Menu size={20} />
              </button>
            )}
            <div className="header-title">
              <h2>{info.name}</h2>
              <div className="status-indicator">
                <span className="status-dot"></span>
                <span>Ollama (gemma:2b) connected</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button 
              type="button" 
              className="btn-secondary clear-chat-top-btn" 
              onClick={handleClearChat}
              title="Clear current conversation"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RotateCcw size={14} />
              Clear Chat
            </button>
            <button type="button" className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
              <Info size={14} style={{ marginRight: '0.25rem' }} />
              Local Model: gemma:2b
            </button>
          </div>
        </header>

        {/* Chat message window */}
        <div className="chat-window">
          {messages.length <= 1 && (
            <div className="chat-welcome-banner">
              <div className="chat-welcome-banner-bg" style={{ backgroundImage: `url(${cottonbroHandImg})` }}></div>
              <div className="chat-welcome-banner-overlay"></div>
              <div className="chat-welcome-banner-content">
                <div className="spark-badge">
                  <Sparkles size={14} />
                  <span>Local LLM: Ollama gemma:2b</span>
                </div>
                <h3>Start a Conversation with {info.name}</h3>
                <p>Chat with your local Ollama model directly. Complete conversational context and history are maintained across turns.</p>
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`message-row ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}>
              <div className="msg-avatar">
                {msg.sender === 'user' ? 'U' : 'AI'}
              </div>
              <div className={`msg-bubble ${msg.isError ? 'msg-error-bubble' : ''}`}>
                <p>{msg.text}</p>
                {msg.timestamp && (
                  <div className="message-timestamp">
                    {msg.timestamp}
                  </div>
                )}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="citation-list">
                    {msg.citations.map((c, i) => (
                      <span key={i} className="citation-item">
                        [{i + 1}] {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message-row bot-message">
              <div className="msg-avatar">AI</div>
              <div className="msg-bubble">
                <div className="ai-thinking-wrapper">
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                  <span className="ai-thinking-text">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={windowEndRef} />
        </div>

        {/* Chat input box */}
        <div className="chat-input-container">
          {(isRecording || isTranscribing) && (
            <div className={`voice-status-banner ${isRecording ? 'recording' : 'transcribing'}`}>
              <div className="voice-status-dot" />
              <span>
                {isRecording ? 'Listening... Speak into your mic. Click mic button again to stop.' : 'Transcribing audio with Whisper AI...'}
              </span>
            </div>
          )}
          <div className="input-box-wrapper">
            <textarea 
              placeholder={isRecording ? "Listening..." : "Ask a question, send a prompt, or use voice input... (Press Enter to send, Shift+Enter for new line)"}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <div className="input-toolbar">
              <div className="toolbar-left">
                <button type="button" className="toolbar-btn" title="Add Image"><Image size={18} /></button>
                <button type="button" className="toolbar-btn" title="Attach Document"><Paperclip size={18} /></button>
                <button 
                  type="button" 
                  className={`toolbar-btn ${isRecording ? 'recording-active' : isTranscribing ? 'transcribing-active' : ''}`}
                  title={isRecording ? "Stop Recording & Transcribe" : isTranscribing ? "Transcribing..." : "Voice Input (Whisper Transcriber)"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing || isTyping}
                >
                  <Mic size={18} />
                </button>
              </div>
              <button 
                type="button"
                className="send-btn" 
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                title={isTyping ? "AI is generating a response..." : "Send Message"}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}