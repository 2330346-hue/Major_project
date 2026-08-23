import { useState } from 'react';
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
}