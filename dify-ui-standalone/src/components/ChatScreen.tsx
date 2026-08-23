import { useState, useEffect, useRef } from 'react';
import './ChatScreen.css';
import { ArrowLeft, Send, Sparkles, Plus, Image, Paperclip, Mic, Menu, Info } from 'lucide-react';
import cottonbroHandImg from '../assets/pexels-cottonbro-6153345.jpg';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  citations?: string[];
}

interface ChatScreenProps {
  appId: string | null;
  onBack: () => void;
  onLogout: () => void;
}

const APP_INFO_MAPPING: Record<string, { name: string; welcome: string; mockResponses: string[] }> = {
  'customer-support': {
    name: 'Customer Support Bot',
    welcome: 'Hello! I am your Customer Support assistant. How can I help you with our product, plans, or setup today?',
    mockResponses: [
      'You can configure custom integrations via our webhooks under Settings > Integrations. Let me know if you want step-by-step guidance!',
      'Yes, we support SSO auth including SAML and OIDC. This option is available for Enterprise workspaces.',
      'To ingest files into your knowledge base, head to the "Knowledge" tab, click "Create Knowledge", and drag/drop your PDFs, DOCXs, or URLs.'
    ]
  },
  'lead-gen': {
    name: 'Lead Generation Agent',
    welcome: 'Welcome! I can assist in qualifying prospects, capturing lead details, and suggesting optimal campaigns. Ask me to draft a quick lead scoring rule!',
    mockResponses: [
      'I have updated the lead profile scoring rule: Assigning +15 for executive titles and +10 for companies with >50 employees.',
      'Sure! Here are three templates for cold emails targeted at CTOs, optimized for RAG and automated response rates.',
      'I can extract email addresses from that text block. Please paste the list below and I will compile them into a CSV layout.'
    ]
  },
  'doc-summarizer': {
    name: 'PDF Summarizer Workflow',
    welcome: 'Upload a document or paste text. I will run the multi-step summarization workflow to identify key highlights, action items, and generate a brief translation.',
    mockResponses: [
      'Workflow phase 1 (Text chunking): Done. Phase 2 (LLM Summary): Complete. The key action item is: "Finalize budget proposal by Friday Q3".',
      'The document mentions three main pillars: (1) Core speed improvements, (2) Expanded SQLite support, (3) Standalone CSS variables.',
      'I have generated a translated brief in Spanish, French, and Japanese. Let me know if you would like me to compile them in a single table.'
    ]
  }
};

const DEFAULT_APP_INFO = {
  name: 'Assistant Chatbot',
  welcome: 'Hello! I am your AI assistant. Ask me anything about prompts, workflows, or integrations.',
  mockResponses: [
    'That sounds like a great plan. Let me know how I can assist you further.',
    'I am configured with the latest model endpoints and standard prompt system settings.',
    'Dify simplifies AI development. Feel free to ask more specific questions!'
  ]
};

export default function ChatScreen({ appId, onBack, onLogout }: ChatScreenProps) {
  const info = appId ? (APP_INFO_MAPPING[appId] || DEFAULT_APP_INFO) : DEFAULT_APP_INFO;
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: info.welcome }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([
    { id: '1', title: 'Quick Q&A session', active: true },
    { id: '2', title: 'Settings configuration help', active: false },
    { id: '3', title: 'Workflow summary export', active: false }
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const windowEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    windowEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userText = inputText.trim();
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_DIFY_API_KEY;
    const apiUrl = import.meta.env.VITE_DIFY_API_URL || 'https://api.dify.ai/v1';

    if (apiKey) {
      try {
        const response = await fetch(`${apiUrl}/chat-messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            inputs: {},
            query: userText,
            response_mode: 'blocking',
            user: 'standalone-user',
            conversation_id: conversationId || undefined
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        setIsTyping(false);

        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }

        const botMsg: Message = {
          id: data.message_id || Date.now().toString(),
          sender: 'bot',
          text: data.answer || 'No response answer returned.',
          citations: data.metadata?.retriever_resources?.map((r: any) => `${r.dataset_name}: ${r.document_name}`) || []
        };
        setMessages(prev => [...prev, botMsg]);
      } catch (err) {
        console.error('Dify API Error:', err);
        setIsTyping(false);
        const fallbackReply = `[API Error - falling back to mock] ${info.mockResponses[Math.floor(Math.random() * info.mockResponses.length)]}`;
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          text: fallbackReply
        }]);
      }
    } else {
      setTimeout(() => {
        setIsTyping(false);
        const randomReply = info.mockResponses[Math.floor(Math.random() * info.mockResponses.length)];
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: randomReply,
          citations: ['Documentation:L15', 'System settings reference']
        };
        setMessages(prev => [...prev, botMsg]);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
        
        <button type="button" className="new-chat-btn">
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
                <span>Active playground</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
              <Info size={14} style={{ marginRight: '0.25rem' }} />
              API Reference
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
                  <span>AI Engine Ready</span>
                </div>
                <h3>Start a Conversation with {info.name}</h3>
                <p>Orchestrate prompts, reference external documents, and debug workflow states in this sandbox.</p>
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`message-row ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}>
              <div className="msg-avatar">
                {msg.sender === 'user' ? 'U' : 'AI'}
              </div>
              <div className="msg-bubble">
                <p>{msg.text}</p>
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
                <div className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={windowEndRef} />
        </div>

        {/* Chat input box */}
        <div className="chat-input-container">
          <div className="input-box-wrapper">
            <textarea 
              placeholder="Ask a question, send a prompt, or press Enter..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="input-toolbar">
              <div className="toolbar-left">
                <button type="button" className="toolbar-btn" title="Add Image"><Image size={18} /></button>
                <button type="button" className="toolbar-btn" title="Attach Document"><Paperclip size={18} /></button>
                <button type="button" className="toolbar-btn" title="Voice Input"><Mic size={18} /></button>
              </div>
              <button 
                type="button"
                className="send-btn" 
                onClick={handleSend}
                disabled={!inputText.trim() && !isTyping}
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