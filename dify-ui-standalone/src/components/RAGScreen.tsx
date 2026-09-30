import { useState, useEffect, useRef } from 'react';
import './RAGScreen.css';
import {
  ArrowLeft,
  BookOpen,
  Send,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';

interface DocumentMeta {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  wordCount: number;
  chunkCount: number;
}

interface Citation {
  sourceNumber: number;
  docTitle: string;
  chunkIndex: number;
  relevanceScore: string;
  snippet: string;
}

interface RAGMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  citations?: Citation[];
  isRAG?: boolean;
}

interface RAGScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export default function RAGScreen({ onBack, onLogout }: RAGScreenProps) {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [enableRAG, setEnableRAG] = useState<boolean>(true);
  const [messages, setMessages] = useState<RAGMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // New Document Form
  const [showAddDoc, setShowAddDoc] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('General');
  const [newContent, setNewContent] = useState<string>('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/rag/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch RAG documents:', err);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmittingDoc(true);
    try {
      const res = await fetch('/api/rag/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory.trim(),
          content: newContent.trim()
        })
      });

      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setShowAddDoc(false);
        await fetchDocuments();
      } else {
        alert('Failed to index document.');
      }
    } catch (err) {
      console.error('Error adding document:', err);
      alert('Error indexing document.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this document from the Knowledge Base?')) return;

    try {
      const res = await fetch(`/api/rag/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedDocId === id) setSelectedDocId('all');
        await fetchDocuments();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: RAGMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend.trim(),
          documentId: selectedDocId === 'all' ? null : selectedDocId,
          enableRAG,
          topK: 3
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to retrieve response');
      }

      const botMsg: RAGMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.answer || '(No response received from local AI model)',
        citations: data.citations || [],
        isRAG: data.isRAG
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('RAG chat error:', err);
      const botMsg: RAGMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '⚠️ Unable to complete RAG query. Please make sure both the Node.js backend (port 5001) and Ollama (port 11434) are active.'
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="rag-container">
      {/* Header */}
      <header className="rag-header">
        <div className="rag-header-left">
          <button type="button" className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            Back to Studio
          </button>
          <div className="rag-title-group">
            <h1>Enterprise RAG Knowledge Assistant</h1>
            <div className="rag-status-pill">
              <ShieldCheck size={13} />
              <span>Ollama gemma:2b + BM25 Vector Retrieval Active</span>
            </div>
          </div>
        </div>
        <button type="button" className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </header>

      {/* Main Grid */}
      <main className="rag-content">
        {/* Left Column: Knowledge Base Manager */}
        <section className="rag-kb-panel">
          <div className="rag-card">
            <div className="rag-card-header">
              <div className="rag-card-title">
                <BookOpen size={18} color="#38bdf8" />
                <span>Indexed Documents</span>
              </div>
              <button
                type="button"
                className="action-icon-btn primary-action"
                onClick={() => setShowAddDoc(!showAddDoc)}
              >
                <Plus size={14} />
                <span>{showAddDoc ? 'Cancel' : 'Add Document'}</span>
              </button>
            </div>

            {/* Add Document Form */}
            {showAddDoc && (
              <form className="doc-form" onSubmit={handleAddDocument} style={{ marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  className="doc-input"
                  placeholder="Document Title (e.g., Security Guidelines)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="doc-input"
                  placeholder="Category (e.g., IT, HR, Sales)"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                />
                <textarea
                  className="doc-textarea"
                  placeholder="Paste document text here to automatically chunk and index..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  required
                />
                <button type="submit" className="doc-submit-btn" disabled={isSubmittingDoc}>
                  {isSubmittingDoc ? 'Indexing...' : 'Index & Chunk Document'}
                </button>
              </form>
            )}

            {/* Documents List */}
            <div className="doc-list">
              <div
                className={`doc-item ${selectedDocId === 'all' ? 'selected' : ''}`}
                onClick={() => setSelectedDocId('all')}
              >
                <div className="doc-item-top">
                  <span className="doc-item-title">🔍 Search All Documents</span>
                  <span className="doc-item-badge">{documents.length} Docs</span>
                </div>
                <div className="doc-item-meta">
                  <span>Full Knowledge Base Coverage</span>
                </div>
              </div>

              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={`doc-item ${selectedDocId === doc.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDocId(doc.id)}
                >
                  <div className="doc-item-top">
                    <span className="doc-item-title" title={doc.title}>
                      <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                      {doc.title}
                    </span>
                    <button
                      type="button"
                      className="doc-delete-btn"
                      title="Delete document"
                      onClick={e => handleDeleteDocument(doc.id, e)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="doc-item-meta">
                    <span className="doc-item-badge">{doc.category}</span>
                    <span>{doc.chunkCount} chunks</span>
                    <span>{doc.wordCount} words</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RAG Info Card */}
          <div className="rag-card" style={{ background: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.15)' }}>
            <div className="rag-card-title" style={{ fontSize: '0.9rem', color: '#38bdf8' }}>
              <Info size={16} />
              <span>How RAG Works in this Project</span>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
              1. <b>Chunking:</b> Documents are split into 400-character overlapping windows.<br />
              2. <b>Retrieval:</b> When you ask a question, the top relevant chunks are calculated via BM25 cosine scoring.<br />
              3. <b>Augmentation:</b> Facts are fed to local <code>gemma:2b</code> with strict source grounding to prevent hallucinations.
            </p>
          </div>
        </section>

        {/* Right Column: RAG Q&A Chat */}
        <section className="rag-card rag-chat-panel">
          {/* Controls Bar */}
          <div className="rag-controls-bar">
            <div className="rag-toggle-wrapper">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={enableRAG}
                  onChange={e => setEnableRAG(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span>{enableRAG ? 'Knowledge Base (RAG Active)' : 'General Chat (No Context)'}</span>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Filtering: <b style={{ color: '#38bdf8' }}>{selectedDocId === 'all' ? 'All Knowledge Base' : 'Selected Document'}</b>
            </div>
          </div>

          {/* Messages Display */}
          {messages.length === 0 ? (
            <div className="rag-empty-view">
              <Sparkles size={36} color="#38bdf8" />
              <h3 style={{ margin: 0, color: '#f8fafc' }}>Ask Any Question About Your Documents</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Select a sample prompt below or type your own question to test real-time retrieval & citations:
              </p>

              <div className="sample-prompts-grid">
                <button
                  type="button"
                  className="sample-prompt-card"
                  onClick={() => handleSendMessage('What is our company remote work and leave policy?')}
                >
                  🏢 <b>"What is our company remote work and leave policy?"</b>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>Tests Employee Handbook</div>
                </button>

                <button
                  type="button"
                  className="sample-prompt-card"
                  onClick={() => handleSendMessage('What are the local AI and LLM architecture specifications?')}
                >
                  ⚙️ <b>"What are the local AI architecture specifications?"</b>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>Tests Project Specs</div>
                </button>

                <button
                  type="button"
                  className="sample-prompt-card"
                  onClick={() => handleSendMessage('What is the product return and refund policy?')}
                >
                  📦 <b>"What is the product return and refund policy?"</b>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>Tests Customer FAQ</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="rag-messages-box">
              {messages.map(msg => (
                <div key={msg.id} className={`rag-msg ${msg.sender}`}>
                  <div className="rag-bubble">{msg.text}</div>

                  {/* Citations block for bot messages */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="rag-citations-container">
                      <div className="rag-citations-header">
                        <Check size={14} />
                        <span>Verified Knowledge Base Sources ({msg.citations.length} Citations)</span>
                      </div>
                      <div className="rag-citation-cards">
                        {msg.citations.map((cit, idx) => (
                          <div key={idx} className="citation-chip">
                            <div className="citation-title-group">
                              <span className="citation-source-name">
                                Source {cit.sourceNumber}: {cit.docTitle} (Section {cit.chunkIndex})
                              </span>
                              <span className="citation-snippet-preview">
                                "{cit.snippet}"
                              </span>
                            </div>
                            <span className="citation-score-pill">{cit.relevanceScore} Match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="rag-msg bot">
                  <div className="rag-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="spinner" />
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      Retrieving relevant chunks & generating answer with local gemma:2b...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Bar */}
          <div className="rag-input-box">
            <input
              type="text"
              className="rag-input-field"
              placeholder="Ask a question grounded in your knowledge base..."
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isThinking}
            />
            <button
              type="button"
              className="rag-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isThinking}
            >
              <Send size={18} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
