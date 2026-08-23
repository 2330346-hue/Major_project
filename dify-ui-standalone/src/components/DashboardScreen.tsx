import { useState } from 'react';
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
  },
  {
    id: 'vending-machine',
    name: 'Vending Machine Agent',
    description: 'An AI-powered smart vending system with real-time inventory tracking, predictive restocking, and an interactive product analytics dashboard.',
    type: 'agent',
    created: 'Just now',
    iconColor: '#f59e0b'
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
      id: `app-${Date.now()}`,
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
          <div className="dashboard-hero-bg" style={{ backgroundImage: `url(${taraImg})` }}></div>
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
            className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Apps
          </button>
          <button 
            className={`filter-tab ${activeTab === 'chatbot' ? 'active' : ''}`}
            onClick={() => setActiveTab('chatbot')}
          >
            Chatbots
          </button>
          <button 
            className={`filter-tab ${activeTab === 'agent' ? 'active' : ''}`}
            onClick={() => setActiveTab('agent')}
          >
            Agents
          </button>
          <button 
            className={`filter-tab ${activeTab === 'workflow' ? 'active' : ''}`}
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
                  <span className={`app-badge badge-${app.type}`}>
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
}