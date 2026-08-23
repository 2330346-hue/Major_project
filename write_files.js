const fs = require('fs');
const path = require('path');

const targetRoot = path.join(__dirname, 'dify-ui-standalone');

console.log(`Writing frontend source files to ${targetRoot}...`);

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(path.join(targetRoot, 'src', 'components'));

// Define files to write
const files = {};

// 1. src/index.css
files['src/index.css'] = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Color Palette (Dify Light/Sleek Theme) */
  --bg-app: #f4f5f7;
  --bg-card: #ffffff;
  --bg-hover: #f9fafb;
  --bg-active: #f3f4f6;
  
  --border-default: #e4e7ec;
  --border-hover: #d0d5dd;
  
  --text-primary: #101828;
  --text-secondary: #344054;
  --text-tertiary: #667085;
  --text-placeholder: #98a2b3;
  
  --primary: #155eef;
  --primary-hover: #175cd3;
  --primary-light: #eff4ff;
  
  --success: #12b76a;
  --success-bg: #edfcf2;
  --success-text: #027a48;
  
  --warning: #f79009;
  --warning-bg: #fffaeb;
  --warning-text: #b54708;
  
  --shadow-xs: 0px 1px 2px rgba(16, 24, 40, 0.05);
  --shadow-sm: 0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06);
  --shadow-md: 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06);
  --shadow-lg: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);
  
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-app);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button, input, textarea, select {
  font-family: inherit;
  font-size: inherit;
}

a {
  color: var(--primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}`;

// 2. src/components/LoginScreen.tsx
files['src/components/LoginScreen.tsx'] = `import { useState } from 'react';
import './LoginScreen.css';
import { Eye, EyeOff } from 'lucide-react';
import deepmindImg from '../assets/pexels-googledeepmind-17483871.jpg';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [authType, setAuthType] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setCoords({ x: x * 15, y: y * 15 });
  };
  const handleMouseLeave = () => {
    setCoords({ x: 0, y: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div className="login-container">
      <div className="login-left" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <div className="login-left-bg" style={{
          backgroundImage: \`url(\${deepmindImg})\`,
          transform: \`translate(\${coords.x}px, \${coords.y}px) scale(1.05)\`
        }}></div>
        <div className="login-logo">
          <div className="avatar" style={{ backgroundColor: 'white', color: '#155eef' }}>D</div>
          <span>Dify UI Studio</span>
        </div>
        <div className="login-hero">
          <h1>Build LLM Apps with the Ultimate Studio</h1>
          <p>
            Create, test, and deploy AI Chatbots, intelligent RAG agents, and complex workflows in minutes. Fully responsive, highly optimized, state-of-the-art UI.
          </p>
        </div>
        <div className="login-footer-text">
          © {new Date().getFullYear()} Dify Standalone Studio. All rights reserved.
        </div>
      </div>
      <div className="login-right">
        <div className="login-box">
          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Please enter your credentials to log in</p>
          </div>
          <div className="login-tabs">
            <button 
              className={\`login-tab \${authType === 'password' ? 'active' : ''}\`}
              onClick={() => setAuthType('password')}
            >
              Email & Password
            </button>
            <button 
              className={\`login-tab \${authType === 'code' ? 'active' : ''}\`}
              onClick={() => setAuthType('code')}
            >
              Verification Code
            </button>
          </div>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            {authType === 'password' ? (
              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#667085'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Verification Code</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="6-digit code" 
                    required 
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '0.5rem' }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="divider">or continue with</div>
          
          <div className="oauth-buttons">
            <button type="button" className="oauth-btn" onClick={onLogin}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              Continue with GitHub
            </button>
            <button type="button" className="oauth-btn" onClick={onLogin}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`;

// 3. src/components/LoginScreen.css
files['src/components/LoginScreen.css'] = `.login-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: #0c111d; /* Dify dark background */
  font-family: var(--font-sans);
}

.login-left {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem;
  background: linear-gradient(135deg, #0c111d 0%, #0c3c9c 100%); /* darker blue gradient to blend with image */
  color: white;
  position: relative;
  overflow: hidden;
}

.login-left-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0.22;
  pointer-events: none;
  z-index: 0;
  transition: transform 0.15s ease-out;
}

.login-left::before {
  content: '';
  position: absolute;
  top: -10%;
  right: -10%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
  z-index: 1;
  pointer-events: none;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  z-index: 1;
  position: relative;
}

.login-logo img {
  height: 2rem;
}

.login-hero {
  max-width: 480px;
  z-index: 1;
}

.login-hero h1 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.login-hero p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.login-footer-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  z-index: 1;
  position: relative;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-card);
  padding: 3rem;
}

.login-box {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.login-header {
  margin-bottom: 2rem;
}

.login-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--text-tertiary);
  font-size: 0.95rem;
}

.login-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--border-default);
  margin-bottom: 1.5rem;
}

.login-tab {
  padding: 0.5rem 0;
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: var(--transition-fast);
}

.login-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  outline: none;
  transition: var(--transition-fast);
  background-color: var(--bg-hover);
}

.form-group input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  background-color: var(--bg-card);
}

.login-btn {
  background-color: var(--primary);
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  margin-top: 0.5rem;
}

.login-btn:hover {
  background-color: var(--primary-hover);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-tertiary);
  margin: 1.5rem 0;
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-default);
}

.divider:not(:empty)::before {
  margin-right: .5em;
}

.divider:not(:empty)::after {
  margin-left: .5em;
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.oauth-btn:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
}

@media (max-width: 768px) {
  .login-left {
    display: none;
  }
}`;

// 4. src/components/DashboardScreen.tsx
files['src/components/DashboardScreen.tsx'] = `import { useState } from 'react';
import './DashboardScreen.css';
import { Search, Bell, Plus, MessageSquare, Bot, Route, LogOut, ArrowRight } from 'lucide-react';
import taraImg from '../assets/pexels-tara-winstead-8386434.jpg';

interface AppTemplate {
  id: string;
  name: string;
  description: string;
  type: 'chatbot' | 'agent' | 'workflow';
  created: string;
  iconColor: string;
}

const INITIAL_APPS: AppTemplate[] = [
  {
    id: 'customer-support',
    name: 'Customer Support Bot',
    description: 'An AI-powered customer support chatbot trained on product documentation and user manuals to handle queries.',
    type: 'chatbot',
    created: '2 hours ago',
    iconColor: '#155eef'
  },
  {
    id: 'lead-gen',
    name: 'Lead Generation Agent',
    description: 'An intelligent RAG agent that collects customer details, schedules meetings, and exports CSV lists.',
    type: 'agent',
    created: '1 day ago',
    iconColor: '#c11574'
  },
  {
    id: 'doc-summarizer',
    name: 'PDF Workflow Summarizer',
    description: 'A multi-step workflow that takes PDF files, extracts key terms, translates them, and posts summaries.',
    type: 'workflow',
    created: '3 days ago',
    iconColor: '#027a48'
  },
  {
    id: 'email-reply',
    name: 'Smart Email Responder',
    description: 'Reads incoming email intents, checks current stock databases, and drafts responses with custom templates.',
    type: 'agent',
    created: '1 week ago',
    iconColor: '#7a5af8'
  }
];

interface DashboardScreenProps {
  onLogout: () => void;
  onRunApp: (appId: string) => void;
}

export default function DashboardScreen({ onLogout, onRunApp }: DashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'chatbot' | 'agent' | 'workflow'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<AppTemplate[]>(INITIAL_APPS);

  const handleCreateApp = () => {
    const newApp: AppTemplate = {
      id: \`app-\${Date.now()}\`,
      name: 'Untitled Assistant',
      description: 'A newly created custom workspace template configured with custom LLMs, search parameters and prompt files.',
      type: Math.random() > 0.5 ? 'chatbot' : 'agent',
      created: 'Just now',
      iconColor: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setApps([newApp, ...apps]);
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || app.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="dashboard-container">
      <header className="nav-header">
        <div className="nav-left">
          <div className="nav-logo">
            <div className="avatar" style={{ backgroundColor: '#155eef', color: 'white' }}>D</div>
            <span>Dify Console</span>
          </div>
          <nav className="nav-links">
            <span className="nav-link active">Studio</span>
            <span className="nav-link">Explore</span>
            <span className="nav-link">Knowledge</span>
            <span className="nav-link">Tools</span>
          </nav>
        </div>
        <div className="nav-right">
          <div className="search-bar">
            <Search size={16} color="#667085" />
            <input 
              type="text" 
              placeholder="Search apps..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="icon-btn">
            <Bell size={20} />
          </button>
          <div className="avatar">AD</div>
          <button className="icon-btn" onClick={onLogout} title="Log Out">
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="dashboard-hero">
          <div className="dashboard-hero-bg" style={{ backgroundImage: \`url(\${taraImg})\` }}></div>
          <div className="dashboard-hero-overlay"></div>
          <div className="dashboard-hero-content">
            <h2>Transform Ideas into Intelligent Agents</h2>
            <p>Build chatbots, configure vector databases, or orchestrate complex multi-agent workflows with ease.</p>
          </div>
        </div>
        
        <div className="main-header">
          <div>
            <h1>My Studio Apps</h1>
            <p style={{ color: '#667085', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Create, view, and run AI apps from templates or visual workflows
            </p>
          </div>
          <div className="action-buttons">
            <button className="btn-secondary">Explore Templates</button>
            <button className="btn-primary" onClick={handleCreateApp}>
              <Plus size={18} />
              Create App
            </button>
          </div>
        </div>

        <div className="filter-tabs">
          <button 
            className={\`filter-tab \${activeTab === 'all' ? 'active' : ''}\`}
            onClick={() => setActiveTab('all')}
          >
            All Apps
          </button>
          <button 
            className={\`filter-tab \${activeTab === 'chatbot' ? 'active' : ''}\`}
            onClick={() => setActiveTab('chatbot')}
          >
            Chatbots
          </button>
          <button 
            className={\`filter-tab \${activeTab === 'agent' ? 'active' : ''}\`}
            onClick={() => setActiveTab('agent')}
          >
            Agents
          </button>
          <button 
            className={\`filter-tab \${activeTab === 'workflow' ? 'active' : ''}\`}
            onClick={() => setActiveTab('workflow')}
          >
            Workflows
          </button>
        </div>

        <div className="app-grid">
          {filteredApps.map(app => (
            <div key={app.id} className="app-card" onClick={() => onRunApp(app.id)}>
              <div>
                <div className="card-top">
                  <div className="app-icon-wrapper" style={{ backgroundColor: app.iconColor }}>
                    {app.type === 'chatbot' && <MessageSquare size={20} />}
                    {app.type === 'agent' && <Bot size={20} />}
                    {app.type === 'workflow' && <Route size={20} />}
                  </div>
                  <span className={\`app-badge badge-\${app.type}\`}>
                    {app.type.charAt(0).toUpperCase() + app.type.slice(1)}
                  </span>
                </div>
                <div className="app-info">
                  <h3>{app.name}</h3>
                  <p>{app.description}</p>
                </div>
              </div>
              <div className="card-bottom">
                <span className="card-meta">Edited {app.created}</span>
                <span className="run-link">
                  Open App
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
          {filteredApps.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#667085' }}>
              No apps match your filter or search query.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}`;

// 5. src/components/DashboardScreen.css
files['src/components/DashboardScreen.css'] = `.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-app);
}

.dashboard-hero {
  position: relative;
  height: 200px;
  width: 100%;
  border-radius: var(--radius-md);
  margin-bottom: 2rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-default);
}

.dashboard-hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-attachment: fixed; /* Scrolling parallax */
  z-index: 0;
}

.dashboard-hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(12, 17, 29, 0.9) 0%, rgba(12, 17, 29, 0.25) 100%);
  z-index: 1;
}

.dashboard-hero-content {
  position: relative;
  z-index: 2;
  color: white;
  max-width: 550px;
}

.dashboard-hero-content h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.dashboard-hero-content p {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 4rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-default);
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.nav-logo img {
  height: 1.75rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: var(--text-secondary);
  font-weight: 500;
  padding: 0.5rem 0.25rem;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: var(--transition-fast);
}

.nav-link:hover {
  color: var(--primary);
}

.nav-link.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--bg-hover);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.75rem;
  width: 240px;
}

.search-bar input {
  border: none;
  background: none;
  outline: none;
  font-size: 0.875rem;
  color: var(--text-primary);
  width: 100%;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.icon-btn:hover {
  background-color: var(--bg-hover);
}

.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.dashboard-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.main-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-secondary {
  background-color: var(--bg-card);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
}

.btn-primary {
  background-color: var(--primary);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.filter-tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 1px solid var(--border-default);
  margin-bottom: 1.5rem;
}

.filter-tab {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: 0.75rem 0.25rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: var(--transition-fast);
}

.filter-tab:hover {
  color: var(--text-secondary);
}

.filter-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.app-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 180px;
  cursor: pointer;
  transition: var(--transition-normal);
  position: relative;
}

.app-card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.app-icon-wrapper {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.app-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.badge-chatbot {
  background-color: #eff4ff;
  color: #175cd3;
}

.badge-agent {
  background-color: #fdf2fa;
  color: #c11574;
}

.badge-workflow {
  background-color: #ecfdf3;
  color: #027a48;
}

.app-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.app-info p {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 1rem;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-default);
  padding-top: 0.75rem;
  margin-top: auto;
}

.card-meta {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.run-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.run-link:hover {
  color: var(--primary-hover);
}`;

// 6. src/components/ChatScreen.tsx
files['src/components/ChatScreen.tsx'] = `import { useState, useEffect, useRef } from 'react';
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
        const response = await fetch(\`\${apiUrl}/chat-messages\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${apiKey}\`
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
          throw new Error(\`API Error: \${response.statusText}\`);
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
          citations: data.metadata?.retriever_resources?.map((r: any) => \`\${r.dataset_name}: \${r.document_name}\`) || []
        };
        setMessages(prev => [...prev, botMsg]);
      } catch (err) {
        console.error('Dify API Error:', err);
        setIsTyping(false);
        const fallbackReply = \`[API Error - falling back to mock] \${info.mockResponses[Math.floor(Math.random() * info.mockResponses.length)]}\`;
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
      <aside className={\`chat-sidebar \${sidebarOpen ? '' : 'collapsed'}\`}>
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
              className={\`history-item \${item.active ? 'active' : ''}\`}
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
              <div className="chat-welcome-banner-bg" style={{ backgroundImage: \`url(\${cottonbroHandImg})\` }}></div>
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
            <div key={msg.id} className={\`message-row \${msg.sender === 'user' ? 'user-message' : 'bot-message'}\`}>
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
}`;

// 7. src/components/ChatScreen.css
files['src/components/ChatScreen.css'] = `.chat-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-app);
}

.chat-welcome-banner {
  position: relative;
  width: 100%;
  max-width: 800px;
  height: 180px;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 2rem;
  margin-bottom: 2rem;
  align-self: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-default);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
}

.chat-welcome-banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.chat-welcome-banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(12, 17, 29, 0.92) 0%, rgba(12, 17, 29, 0.4) 100%);
  z-index: 1;
}

.chat-welcome-banner-content {
  position: relative;
  z-index: 2;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.spark-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background-color: rgba(21, 94, 239, 0.2);
  border: 1px solid rgba(21, 94, 239, 0.4);
  color: #84adff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  width: fit-content;
}

.chat-welcome-banner-content h3 {
  font-size: 1.35rem;
  font-weight: 700;
}

.chat-welcome-banner-content p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
  max-width: 600px;
}

.chat-sidebar {
  width: 260px;
  background-color: #0c111d; /* Dify dark sidebar theme */
  color: #98a2b3;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1f2a37;
  transition: var(--transition-normal);
  z-index: 100;
}

.chat-sidebar.collapsed {
  margin-left: -260px;
}

.sidebar-header {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1f2a37;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.sidebar-logo img {
  height: 1.5rem;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.25rem;
  padding: 0.6rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.new-chat-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.chat-history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-sm);
  margin-bottom: 0.25rem;
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.9rem;
}

.history-item:hover {
  background-color: rgba(255, 255, 255, 0.03);
  color: white;
}

.history-item.active {
  background-color: rgba(255, 255, 255, 0.08);
  color: white;
  font-weight: 500;
}

.history-item-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 1.25rem;
  border-top: 1px solid #1f2a37;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar-footer-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: none;
  color: #98a2b3;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.sidebar-footer-btn:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
}

.chat-header {
  height: 4rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--success);
}

.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.chat-window::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  height: 320px;
  background-image: url('../assets/pexels-cottonbro-6153740.jpg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.035; /* subtle watermark */
  pointer-events: none;
  z-index: 0;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-tertiary);
  padding: 2rem;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 16px;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.chat-empty h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.chat-empty p {
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.suggested-questions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.suggested-btn {
  background-color: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  text-align: left;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.suggested-btn:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--primary);
}

.message-row {
  display: flex;
  gap: 1rem;
  max-width: 800px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.message-row.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-row.bot-message {
  align-self: flex-start;
}

.msg-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.user-message .msg-avatar {
  background-color: var(--text-secondary);
}

.bot-message .msg-avatar {
  background-color: var(--primary);
}

.msg-bubble {
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  line-height: 1.5;
  box-shadow: var(--shadow-xs);
  max-width: calc(100% - 4rem);
}

.user-message .msg-bubble {
  background-color: var(--primary);
  color: white;
  border-bottom-right-radius: 2px;
}

.bot-message .msg-bubble {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-bottom-left-radius: 2px;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  height: 1.25rem;
}

.typing-dot {
  width: 6px;
  height: 6px;
  background-color: var(--text-tertiary);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

.chat-input-container {
  padding: 1.5rem 2rem;
  background-color: var(--bg-card);
  border-top: 1px solid var(--border-default);
}

.input-box-wrapper {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background-color: var(--bg-hover);
  padding: 0.5rem;
  transition: var(--transition-fast);
  display: flex;
  flex-direction: column;
}

.input-box-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  background-color: var(--bg-card);
}

.input-box-wrapper textarea {
  border: none;
  background: none;
  outline: none;
  padding: 0.5rem;
  resize: none;
  width: 100%;
  font-size: 0.95rem;
  color: var(--text-primary);
  min-height: 50px;
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
  border-top: 1px solid transparent;
}

.input-box-wrapper:focus-within .input-toolbar {
  border-top-color: var(--border-default);
}

.toolbar-left {
  display: flex;
  gap: 0.25rem;
}

.toolbar-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.toolbar-btn:hover {
  background-color: var(--bg-active);
  color: var(--text-secondary);
}

.send-btn {
  background-color: var(--primary);
  color: white;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.send-btn:hover {
  background-color: var(--primary-hover);
}

.send-btn:disabled {
  background-color: var(--border-default);
  color: var(--text-placeholder);
  cursor: not-allowed;
}

.citation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-default);
}

.citation-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--primary);
  background-color: var(--primary-light);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-weight: 500;
}`;

// 8. src/App.tsx
files['src/App.tsx'] = `import { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import ChatScreen from './components/ChatScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'chat'>('dashboard');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedAppId(null);
  };

  const handleRunApp = (appId: string) => {
    setSelectedAppId(appId);
    setCurrentScreen('chat');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === 'dashboard') {
    return (
      <DashboardScreen 
        onLogout={handleLogout} 
        onRunApp={handleRunApp} 
      />
    );
  }

  return (
    <ChatScreen 
      appId={selectedAppId} 
      onBack={handleBackToDashboard} 
      onLogout={handleLogout} 
    />
  );
}`;

// Write files to target directories
Object.keys(files).forEach(filePath => {
  const fullPath = path.join(targetRoot, filePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, files[filePath], 'utf8');
  console.log(`Successfully wrote ${filePath}`);
});

// Copy public logo assets from original web folder
const logoSrc = 'C:\\Users\\KIIT0001\\Desktop\\diffy\\dify\\web\\public\\logo';
const logoDest = path.join(targetRoot, 'public', 'logo');

if (fs.existsSync(logoSrc)) {
  ensureDir(logoDest);
  const logoFiles = fs.readdirSync(logoSrc);
  logoFiles.forEach(file => {
    fs.copyFileSync(path.join(logoSrc, file), path.join(logoDest, file));
  });
  console.log('Successfully copied logo assets!');
}

console.log('All source code and assets written successfully!');
