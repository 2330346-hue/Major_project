import { useState, useEffect, useRef } from 'react';
import './VendingScreen.css';
import { 
  ArrowLeft, 
  TrendingUp, 
  Package, 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  ShoppingCart, 
  Activity, 
  Cpu, 
  Thermometer, 
  Mic, 
  Send, 
  Sparkles, 
  Bot, 
  Wrench, 
  CheckCircle2, 
  XCircle,
  Volume2,
  Coffee,
  X,
  RotateCcw,
  CoffeeIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  stock: number;
  maxStock: number;
  sold: number;
  category: string;
  color: string;
  trend: number;
}

interface VendingScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

interface ToolExecutionResult {
  tool: string;
  requestedName?: string;
  product?: Product;
  status: 'SUCCESS' | 'ERROR';
  code: string;
  valid: boolean;
  message: string;
}

interface AgentState {
  thought?: string;
  tool_call?: {
    name: string;
    parameters: { productName: string; quantity?: number };
  } | null;
  response?: string;
}

interface SupportChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isError?: boolean;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Cola Zero', emoji: '🥤', price: 1.50, stock: 8, maxStock: 12, sold: 47, category: 'Drinks', color: '#ef4444', trend: 12 },
  { id: 'p2', name: 'Sparkling Water', emoji: '💧', price: 1.20, stock: 3, maxStock: 12, sold: 29, category: 'Drinks', color: '#3b82f6', trend: 5 },
  { id: 'p3', name: 'Energy Boost', emoji: '⚡', price: 2.50, stock: 11, maxStock: 12, sold: 63, category: 'Drinks', color: '#f59e0b', trend: 28 },
  { id: 'p4', name: 'Protein Bar', emoji: '🍫', price: 2.00, stock: 5, maxStock: 10, sold: 34, category: 'Snacks', color: '#8b5cf6', trend: -3 },
  { id: 'p5', name: 'Salted Chips', emoji: '🥨', price: 1.80, stock: 1, maxStock: 10, sold: 55, category: 'Snacks', color: '#f97316', trend: 18 },
  { id: 'p6', name: 'Mixed Nuts', emoji: '🥜', price: 2.20, stock: 9, maxStock: 10, sold: 21, category: 'Snacks', color: '#10b981', trend: 7 },
  { id: 'p7', name: 'Matcha Latte', emoji: '🍵', price: 3.00, stock: 4, maxStock: 8, sold: 18, category: 'Drinks', color: '#22c55e', trend: 42 },
  { id: 'p8', name: 'Gummy Bears', emoji: '🐻', price: 1.50, stock: 0, maxStock: 10, sold: 72, category: 'Snacks', color: '#ec4899', trend: -8 },
];

const COFFEE_SUPPORT_SYSTEM_PROMPT = `You are the SmartVend Coffee & Vending Machine Customer Support Assistant.

STRICT TOPIC BOUNDARY RULES:
1. You MUST ONLY answer queries related to:
   - Coffees (espresso, latte, cappuccino, americano, mocha, macchiato, caffeine levels, brewing temperatures, roast profiles, milk alternatives, cold vs hot coffee, Matcha Latte, etc.)
   - SmartVend Vending Machine items (Cola Zero, Sparkling Water, Energy Boost, Matcha Latte, Protein Bar, Salted Chips, Mixed Nuts, Gummy Bears; stock status, pricing, pairing suggestions, vending assistance).
2. If the user asks ANY question NOT related to coffee or vending machine items (e.g. general trivia, math, sports, coding, history, news, non-vending topics), you MUST politely DECLINE to answer and respond:
   "I am the SmartVend Coffee & Vending Support Assistant. I can only answer questions related to coffees, caffeine content, hot/cold beverages, and items available in our vending machine. How can I help you with our drinks or snacks today?"
3. Be friendly, warm, helpful, and expert on coffee and vending items.`;

const formatTimestamp = (date = new Date()) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="mini-chart">
      {data.map((v, i) => (
        <div key={i} className="mini-bar" style={{ height: `${(v / max) * 100}%` }}></div>
      ))}
    </div>
  );
}

export default function VendingScreen({ onBack, onLogout }: VendingScreenProps) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(384.50);
  const [totalSales, setTotalSales] = useState(339);
  const [uptime, setUptime] = useState(99.7);
  const [temp, setTemp] = useState(4.2);
  const [dispensing, setDispensing] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([
    '[SYSTEM] SmartVend Agent v2.4 initialized with Whisper STT & dispense_product tool',
    '[SYSTEM] Inventory sync OK — 8 products online'
  ]);
  const [, setTick] = useState(0);

  // Voice & Agent States for Vending Machine Console
  const [promptInput, setPromptInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'recording' | 'transcribing' | 'thinking' | 'dispensing' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [agentOutput, setAgentOutput] = useState<AgentState | null>(null);
  const [lastToolExecution, setLastToolExecution] = useState<ToolExecutionResult | null>(null);

  // Customer Support Chatbot Drawer State (Inside Vending Machine)
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '☕ Welcome to SmartVend Coffee & Customer Support! I can assist you with coffee choices, caffeine levels, brewing temps, and any vending machine items. What can I help you with today?',
      timestamp: formatTimestamp()
    }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [isSupportMicRecording, setIsSupportMicRecording] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const supportScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTemp(prev => parseFloat((prev + (Math.random() - 0.5) * 0.3).toFixed(1)));
      setUptime(prev => Math.min(100, parseFloat((prev + 0.01).toFixed(2))));
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Scroll support chat to bottom
  useEffect(() => {
    if (isSupportChatOpen) {
      supportScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [supportMessages, isSupportTyping, isSupportChatOpen]);

  // UI Dispense Routine
  const triggerUiDispense = (product: Product) => {
    if (product.stock === 0 || dispensing) return;
    setDispensing(product.id);
    setTimeout(() => {
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, stock: p.stock - 1, sold: p.sold + 1 } : p
      ));
      setTotalRevenue(prev => parseFloat((prev + product.price).toFixed(2)));
      setTotalSales(prev => prev + 1);
      setLog(prev => [`[AGENT TOOL DISPENSE] Dispensed: ${product.emoji} ${product.name} — $${product.price.toFixed(2)}`, ...prev.slice(0, 9)]);
      setDispensing(null);
    }, 1200);
  };

  const handleRestock = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stock: p.maxStock } : p
    ));
    const p = products.find(x => x.id === productId);
    if (p) setLog(prev => [`[RESTOCK] Restocked: ${p.name} to ${p.maxStock}`, ...prev.slice(0, 9)]);
  };

  // Agent Tool Execution & Verification Loop
  const runVendingAgent = async (inputPrompt: string) => {
    if (!inputPrompt.trim()) return;

    setAgentStatus('thinking');
    setStatusMessage('Agent thinking & evaluating tools...');
    setAgentOutput(null);
    setLastToolExecution(null);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/vending/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputPrompt,
          inventory: products
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `Agent error (${response.status})`);
      }

      const { agent, toolExecution } = data;
      setAgentOutput(agent);
      setLastToolExecution(toolExecution);

      if (toolExecution) {
        if (toolExecution.valid && toolExecution.product) {
          setAgentStatus('dispensing');
          setStatusMessage(`Tool Validated: Dispensing ${toolExecution.product.name}...`);
          
          const targetProduct = products.find(p => p.id === toolExecution.product.id);
          if (targetProduct && targetProduct.stock > 0) {
            triggerUiDispense(targetProduct);
          }
        } else {
          setAgentStatus('error');
          setStatusMessage(`Tool Validation Failed: ${toolExecution.message}`);
          setLog(prev => [`[TOOL ERROR] ${toolExecution.message}`, ...prev.slice(0, 9)]);
        }
      } else {
        setAgentStatus('idle');
        setStatusMessage('Answer provided.');
      }
    } catch (err) {
      console.error('Agent invocation failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAgentStatus('error');
      setStatusMessage(`Agent Error: ${errMsg}`);
      setLog(prev => [`[AGENT ERROR] ${errMsg}`, ...prev.slice(0, 9)]);
    }
  };

  // Whisper Voice Transcription Handler for Vending Agent Input
  const sendAudioToWhisper = async (audioBlob: Blob) => {
    setAgentStatus('transcribing');
    setStatusMessage('Transcribing speech with OpenAI Whisper...');

    const formData = new FormData();
    const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
    formData.append('file', audioBlob, `vending_voice.${ext}`);
    formData.append('language', 'en');

    try {
      const response = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Whisper transcription failed.');
      }

      const transcribedText = (data.text || '').trim();
      if (!transcribedText) {
        setAgentStatus('error');
        setStatusMessage('Whisper detected no speech in recording.');
      } else {
        setPromptInput(transcribedText);
        setLog(prev => [`[WHISPER STT] Transcribed: "${transcribedText}"`, ...prev.slice(0, 9)]);
        await runVendingAgent(transcribedText);
      }
    } catch (err) {
      console.error('Whisper STT failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAgentStatus('error');
      setStatusMessage(`Whisper Error: ${errMsg}. Ensure http://localhost:5000 is running.`);
    }
  };

  // Mic Recording for Vending Console
  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const vol = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(vol);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioCtx.state !== 'closed') audioCtx.close();
        setMicVolume(0);

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());

        sendAudioToWhisper(blob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setAgentStatus('recording');
      setStatusMessage('Listening to your voice command...');
    } catch (err) {
      console.error('Mic access error:', err);
      alert('Microphone access denied or audio input device missing.');
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  // ----------------------------------------------------
  // CUSTOMER SUPPORT CHATBOT (COFFEE & VENDING ONLY)
  // ----------------------------------------------------
  const handleSendSupportMessage = async (textToSend?: string) => {
    const messageText = (textToSend || supportInput).trim();
    if (!messageText || isSupportTyping) return;

    const userMsg: SupportChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: formatTimestamp()
    };

    const updatedMessages = [...supportMessages, userMsg];
    setSupportMessages(updatedMessages);
    setSupportInput('');
    setIsSupportTyping(true);

    // Build multi-turn context with system prompt boundary rule
    const conversationPayload = [
      { role: 'system', content: COFFEE_SUPPORT_SYSTEM_PROMPT },
      ...updatedMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    ];

    try {
      const response = await fetch('http://127.0.0.1:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationPayload })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      const botReply = data.message?.content || 'Thank you for reaching out!';
      const botMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        timestamp: formatTimestamp()
      };
      setSupportMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Support Chat Error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const botErrorMsg: SupportChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `Error connecting to Coffee Support Agent: ${errMsg}`,
        timestamp: formatTimestamp(),
        isError: true
      };
      setSupportMessages(prev => [...prev, botErrorMsg]);
    } finally {
      setIsSupportTyping(false);
    }
  };

  // Support Mic Voice Recording (Whisper)
  const startSupportMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());

        const formData = new FormData();
        formData.append('file', blob, 'support_voice.webm');
        formData.append('language', 'en');

        try {
          const res = await fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.text) {
            setSupportInput(data.text);
            handleSendSupportMessage(data.text);
          }
        } catch (err) {
          console.error('Whisper transcribe error:', err);
        } finally {
          setIsSupportMicRecording(false);
        }
      };

      mediaRecorder.start();
      setIsSupportMicRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
    }
  };

  const stopSupportMicRecording = () => {
    if (mediaRecorderRef.current && isSupportMicRecording) {
      mediaRecorderRef.current.stop();
      setIsSupportMicRecording(false);
    }
  };

  const handleClearSupportChat = () => {
    setSupportMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: '☕ Chat reset. Ask me anything about our coffees, lattes, espresso, caffeine, or vending items!',
        timestamp: formatTimestamp()
      }
    ]);
  };

  const handleExampleClick = (exampleText: string) => {
    setPromptInput(exampleText);
    runVendingAgent(exampleText);
  };

  const lowStock = products.filter(p => p.stock <= 2);
  const totalItems = products.reduce((a, p) => a + p.stock, 0);
  const weekSales = [42, 55, 37, 68, 72, 58, totalSales % 80 + 10];

  return (
    <div className="vending-container">
      {/* Sidebar */}
      <aside className="vending-sidebar">
        <div className="vending-sidebar-header">
          <div className="vending-logo">
            <span className="vending-logo-icon">🤖</span>
            <div>
              <div className="vending-logo-title">SmartVend AI</div>
              <div className="vending-logo-sub">Whisper STT + Agent Tool</div>
            </div>
          </div>
        </div>

        {/* Customer Support Chatbot Sidebar Button */}
        <button 
          type="button" 
          className={`support-chat-sidebar-btn ${isSupportChatOpen ? 'active' : ''}`}
          onClick={() => setIsSupportChatOpen(!isSupportChatOpen)}
        >
          <CoffeeIcon size={16} color="#fbbf24" />
          <span>Coffee & Support Bot</span>
          <span className="unread-dot"></span>
        </button>

        <div className="vending-status-card">
          <div className="status-row"><Cpu size={14} /><span>Machine Status</span><span className="badge-online">ONLINE</span></div>
          <div className="status-row"><Sparkles size={14} /><span>Whisper STT</span><span className="badge-whisper">tiny.en</span></div>
          <div className="status-row"><Wrench size={14} /><span>Agent Tool</span><span className="badge-tool">dispense_product</span></div>
          <div className="status-row"><Coffee size={14} /><span>Support Agent</span><span className="badge-coffee">Coffee & Vending</span></div>
          <div className="status-row"><Thermometer size={14} /><span>Temperature</span><span className="badge-temp">{temp}°C</span></div>
          <div className="status-row"><Activity size={14} /><span>Uptime</span><span className="badge-uptime">{uptime}%</span></div>
          <div className="status-row"><Zap size={14} /><span>Power Draw</span><span className="badge-power">142W</span></div>
        </div>

        {lowStock.length > 0 && (
          <div className="alert-panel">
            <div className="alert-title"><AlertTriangle size={13} /> Low Stock Alerts</div>
            {lowStock.map(p => (
              <div key={p.id} className="alert-row">
                <span>{p.emoji} {p.name} ({p.stock})</span>
                <button className="restock-btn" onClick={() => handleRestock(p.id)}><RefreshCw size={11} /> Restock</button>
              </div>
            ))}
          </div>
        )}

        <div className="vending-log">
          <div className="log-title"><Activity size={12} /> Live System & Tool Log</div>
          {log.map((entry, i) => (
            <div key={i} className="log-entry" style={{ opacity: 1 - i * 0.08 }}>{entry}</div>
          ))}
        </div>

        <div className="vending-sidebar-footer">
          <button className="sidebar-nav-btn" onClick={onBack}><ArrowLeft size={14} /> Back to Studio</button>
          <button className="sidebar-nav-btn danger" onClick={onLogout}>Log Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="vending-main">
        {/* Topbar KPIs & Support Chat Launcher */}
        <div className="vending-topbar">
          <div>
            <h1>Smart Vending Machine Agent</h1>
            <p>Voice-activated agent with Whisper STT, tool calling & Coffee Support Bot — <span className="live-dot-label"><span className="live-dot"></span>LIVE</span></p>
          </div>
          <div className="topbar-kpis">
            <button 
              type="button" 
              className="kpi-support-btn"
              onClick={() => setIsSupportChatOpen(!isSupportChatOpen)}
              title="Open Customer Support Chatbot for Coffee & Vending Queries"
            >
              <Coffee size={18} color="#f59e0b" />
              <span>Coffee Support Bot</span>
            </button>
            <div className="kpi-chip"><TrendingUp size={14} /><span>${totalRevenue.toFixed(2)}</span><label>Revenue</label></div>
            <div className="kpi-chip"><ShoppingCart size={14} /><span>{totalSales}</span><label>Total Sales</label></div>
            <div className="kpi-chip"><Package size={14} /><span>{totalItems}</span><label>Items Left</label></div>
          </div>
        </div>

        {/* VOICE & AGENT TOOL CONTROL CARD */}
        <div className="agent-control-card">
          <div className="agent-card-header">
            <div className="agent-header-title">
              <Bot size={18} color="#818cf8" />
              <span>Voice Agent Control Console</span>
            </div>
            <div className={`agent-status-pill ${agentStatus}`}>
              <span className="status-dot"></span>
              <span>{statusMessage || 'Ready for Voice or Text Commands'}</span>
            </div>
          </div>

          {/* Voice Input & Prompt Bar */}
          <div className="voice-input-group">
            <button
              type="button"
              className={`mic-record-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopMicRecording : startMicRecording}
              title={isRecording ? "Click to stop recording" : "Click to speak via Whisper STT"}
            >
              <Mic size={18} />
              <span>{isRecording ? "Stop Recording" : "Voice Command"}</span>
            </button>

            {isRecording && (
              <div className="mic-live-indicator">
                <Volume2 size={15} color="#ef4444" />
                <div className="mic-vol-track">
                  <div className="mic-vol-bar" style={{ width: `${Math.max(8, micVolume)}%` }}></div>
                </div>
                <span className="rec-pulse">REC</span>
              </div>
            )}

            <input
              type="text"
              className="agent-prompt-input"
              placeholder='Try speaking or typing: "Dispense Cola Zero", "I want a Protein Bar", "Give me Gummy Bears"...'
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') runVendingAgent(promptInput);
              }}
            />

            <button
              type="button"
              className="agent-send-btn"
              onClick={() => runVendingAgent(promptInput)}
              disabled={!promptInput.trim() || agentStatus === 'thinking' || agentStatus === 'transcribing'}
            >
              <Send size={15} />
              <span>Send Agent</span>
            </button>
          </div>

          {/* Interactive Preset Example Buttons */}
          <div className="examples-section">
            <span className="examples-label">Quick Test Examples:</span>
            <div className="examples-grid">
              <button className="example-chip success" onClick={() => handleExampleClick("Dispense Cola Zero")}>
                🥤 "Dispense Cola Zero"
              </button>
              <button className="example-chip success" onClick={() => handleExampleClick("I want a Protein Bar")}>
                🍫 "I want a Protein Bar"
              </button>
              <button className="example-chip warning" onClick={() => handleExampleClick("Give me Gummy Bears")}>
                🐻 "Give me Gummy Bears" <i>(Out of Stock Test)</i>
              </button>
              <button className="example-chip danger" onClick={() => handleExampleClick("Dispense Iced Coffee")}>
                ☕ "Dispense Iced Coffee" <i>(Unknown Item Test)</i>
              </button>
              <button className="example-chip info" onClick={() => handleExampleClick("What drinks do you have?")}>
                ❓ "What drinks do you have?" <i>(General Q&A)</i>
              </button>
            </div>
          </div>

          {/* Agent & Tool Execution Output Display */}
          {(agentOutput || lastToolExecution) && (
            <div className="agent-response-panel">
              {agentOutput?.thought && (
                <div className="agent-thought">
                  <Bot size={13} color="#a855f7" />
                  <span><b>Agent Thought:</b> {agentOutput.thought}</span>
                </div>
              )}

              {lastToolExecution && (
                <div className={`tool-execution-badge ${lastToolExecution.valid ? 'valid' : 'invalid'}`}>
                  {lastToolExecution.valid ? (
                    <CheckCircle2 size={16} color="#34d399" />
                  ) : (
                    <XCircle size={16} color="#f87171" />
                  )}
                  <div>
                    <div className="tool-name-line">
                      <Wrench size={13} />
                      <span>Tool Call: <code>{lastToolExecution.tool}</code></span>
                      <span className={`tool-status-tag ${lastToolExecution.status}`}>
                        {lastToolExecution.code}
                      </span>
                    </div>
                    <div className="tool-msg-text">{lastToolExecution.message}</div>
                  </div>
                </div>
              )}

              {agentOutput?.response && (
                <div className="agent-response-text">
                  <Sparkles size={14} color="#818cf8" />
                  <span>{agentOutput.response}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Weekly Chart */}
        <div className="weekly-chart-card">
          <div className="card-header"><TrendingUp size={15} /> Weekly Sales Volume</div>
          <div className="weekly-bars">
            {['M','T','W','T','F','S','Today'].map((day, i) => (
              <div key={i} className="weekly-col">
                <div className="weekly-bar-wrap">
                  <div className="weekly-bar" style={{ height: `${(weekSales[i] / 80) * 100}%`, background: i === 6 ? '#f59e0b' : 'rgba(21,94,239,0.7)' }}></div>
                </div>
                <span className="weekly-label">{day}</span>
                <span className="weekly-val">{weekSales[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="products-grid">
          {products.map(product => {
            const stockPct = (product.stock / product.maxStock) * 100;
            const isLow = product.stock <= 2;
            const isEmpty = product.stock === 0;
            const isDispensing = dispensing === product.id;
            const isTargetedByAgent = lastToolExecution?.product?.id === product.id;

            return (
              <div
                key={product.id}
                className={`product-card ${isLow ? 'low-stock' : ''} ${isEmpty ? 'empty-stock' : ''} ${selectedProduct?.id === product.id ? 'selected' : ''} ${isTargetedByAgent ? 'agent-targeted' : ''}`}
                onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
                style={{ '--accent': product.color } as React.CSSProperties}
              >
                {isTargetedByAgent && (
                  <div className="agent-badge-tag">
                    <Wrench size={10} /> Agent Target
                  </div>
                )}
                <div className="product-emoji">{product.emoji}</div>
                <div className="product-info">
                  <div className="product-name">{product.name}</div>
                  <div className="product-category">{product.category}</div>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                </div>
                <div className="product-stats">
                  <div className="stock-bar-wrap">
                    <div className="stock-bar" style={{ width: `${stockPct}%`, background: isLow ? '#ef4444' : product.color }}></div>
                  </div>
                  <div className="stock-numbers">
                    <span className={isEmpty ? 'stock-empty' : isLow ? 'stock-low' : ''}>{product.stock}/{product.maxStock}</span>
                    <span className={`trend ${product.trend >= 0 ? 'up' : 'down'}`}>{product.trend >= 0 ? '▲' : '▼'} {Math.abs(product.trend)}%</span>
                  </div>
                  <MiniBarChart data={[product.sold * 0.4, product.sold * 0.6, product.sold * 0.5, product.sold * 0.8, product.sold * 0.7, product.sold * 0.9, product.sold].map(Math.round)} />
                </div>
                <div className="product-actions">
                  <button
                    className={`dispense-btn ${isEmpty ? 'disabled' : ''} ${isDispensing ? 'dispensing' : ''}`}
                    onClick={e => { e.stopPropagation(); triggerUiDispense(product); }}
                    disabled={isEmpty || !!dispensing}
                  >
                    {isDispensing ? '⚙ Dispensing...' : isEmpty ? 'Out of Stock' : '⬇ Dispense'}
                  </button>
                  {isLow && !isEmpty && (
                    <button className="restock-mini" onClick={e => { e.stopPropagation(); handleRestock(product.id); }}><RefreshCw size={11} /></button>
                  )}
                </div>
                <div className="sold-tag">{product.sold} sold</div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ---------------------------------------------------- */}
      {/* CUSTOMER SUPPORT CHATBOT DRAWER (COFFEE & VENDING ONLY) */}
      {/* ---------------------------------------------------- */}
      {isSupportChatOpen && (
        <div className="support-chat-drawer">
          <div className="support-drawer-header">
            <div className="support-header-left">
              <div className="coffee-bot-icon">☕</div>
              <div>
                <h3>Coffee & Vending Support Bot</h3>
                <span className="support-sub">Answers coffee & vending queries ONLY</span>
              </div>
            </div>
            <div className="support-header-actions">
              <button 
                type="button" 
                className="support-action-icon" 
                onClick={handleClearSupportChat}
                title="Clear Support Chat"
              >
                <RotateCcw size={14} />
              </button>
              <button 
                type="button" 
                className="support-action-icon" 
                onClick={() => setIsSupportChatOpen(false)}
                title="Close Drawer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Preset Suggested Questions for Coffee & Vending */}
          <div className="support-chips-bar">
            <button 
              className="chip-btn" 
              onClick={() => handleSendSupportMessage("What coffee and latte options do you have?")}
            >
              ☕ Coffee & Lattes
            </button>
            <button 
              className="chip-btn" 
              onClick={() => handleSendSupportMessage("Which vending drink has the highest caffeine?")}
            >
              ⚡ High Caffeine Drinks
            </button>
            <button 
              className="chip-btn" 
              onClick={() => handleSendSupportMessage("What snacks pair best with Matcha Latte?")}
            >
              🍫 Snack Pairings
            </button>
            <button 
              className="chip-btn danger-chip" 
              onClick={() => handleSendSupportMessage("Who won the World Cup?")}
              title="Test non-coffee topic boundary decline"
            >
              ⚽ Non-Coffee Topic Test
            </button>
          </div>

          {/* Messages Container */}
          <div className="support-messages-window">
            {supportMessages.map(msg => (
              <div key={msg.id} className={`support-msg-row ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                <div className="support-avatar">
                  {msg.sender === 'user' ? 'U' : '☕'}
                </div>
                <div className={`support-bubble ${msg.isError ? 'error' : ''}`}>
                  <p>{msg.text}</p>
                  <span className="support-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isSupportTyping && (
              <div className="support-msg-row bot">
                <div className="support-avatar">☕</div>
                <div className="support-bubble typing">
                  <div className="typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span className="typing-text">Coffee Bot is thinking...</span>
                </div>
              </div>
            )}
            <div ref={supportScrollRef} />
          </div>

          {/* Support Input Box */}
          <div className="support-input-area">
            <textarea
              className="support-textarea"
              placeholder="Ask about coffees, espresso, caffeine, or vending items..."
              value={supportInput}
              onChange={e => setSupportInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendSupportMessage();
                }
              }}
            />
            <div className="support-input-actions">
              <button
                type="button"
                className={`support-mic-btn ${isSupportMicRecording ? 'recording' : ''}`}
                onClick={isSupportMicRecording ? stopSupportMicRecording : startSupportMicRecording}
                title={isSupportMicRecording ? "Stop voice input" : "Voice input via Whisper STT"}
              >
                <Mic size={16} />
              </button>
              <button
                type="button"
                className="support-send-btn"
                onClick={() => handleSendSupportMessage()}
                disabled={!supportInput.trim() || isSupportTyping}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}