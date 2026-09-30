import { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import ChatScreen from './components/ChatScreen';
import VendingScreen from './components/VendingScreen';
import ResumeAnalyzerScreen from './components/ResumeAnalyzerScreen';
import AudioTranscriberScreen from './components/AudioTranscriberScreen';
import RAGScreen from './components/RAGScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'chat' | 'vending' | 'resume-analyzer' | 'audio-transcriber' | 'rag'>('dashboard');
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
    if (appId === 'vending-machine') {
      setCurrentScreen('vending');
    } else if (appId === 'resume-analyzer') {
      setCurrentScreen('resume-analyzer');
    } else if (appId === 'mp3-to-text') {
      setCurrentScreen('audio-transcriber');
    } else if (appId === 'rag-assistant' || appId === 'lead-gen') {
      setCurrentScreen('rag');
    } else {
      setCurrentScreen('chat');
    }
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

  if (currentScreen === 'vending') {
    return (
      <VendingScreen
        onBack={handleBackToDashboard}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === 'resume-analyzer') {
    return (
      <ResumeAnalyzerScreen
        onBack={handleBackToDashboard}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === 'audio-transcriber') {
    return (
      <AudioTranscriberScreen
        onBack={handleBackToDashboard}
        onLogout={handleLogout}
        onOpenChat={(_prompt) => {
          setSelectedAppId('customer-support');
          setCurrentScreen('chat');
        }}
      />
    );
  }

  if (currentScreen === 'rag') {
    return (
      <RAGScreen
        onBack={handleBackToDashboard}
        onLogout={handleLogout}
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