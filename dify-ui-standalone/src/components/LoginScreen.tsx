import { useState } from 'react';
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
          backgroundImage: `url(${deepmindImg})`,
          transform: `translate(${coords.x}px, ${coords.y}px) scale(1.05)`
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
              className={`login-tab ${authType === 'password' ? 'active' : ''}`}
              onClick={() => setAuthType('password')}
            >
              Email & Password
            </button>
            <button 
              className={`login-tab ${authType === 'code' ? 'active' : ''}`}
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
}