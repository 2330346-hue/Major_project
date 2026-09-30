import { useState, useRef, useEffect } from 'react';
import './AudioTranscriberScreen.css';
import { 
  ArrowLeft, 
  Upload, 
  Music, 
  Mic, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  MessageSquare, 
  Sparkles,
  Volume2,
  AlertTriangle,
  Globe
} from 'lucide-react';

interface AudioTranscriberScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onOpenChat?: (initialPrompt: string) => void;
}

export default function AudioTranscriberScreen({ onBack, onLogout, onOpenChat }: AudioTranscriberScreenProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [noSpeechDetected, setNoSpeechDetected] = useState(false);
  const [stats, setStats] = useState<{ words: number; chars: number; language?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');

  // Live recording state & mic audio meter
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL and audio context
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setAudioFile(file);
    setNoSpeechDetected(false);
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  // Quick load the real speech "audio sample.mp3"
  const handleLoadSample = async () => {
    try {
      const response = await fetch('/audio sample.mp3');
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], 'audio sample.mp3', { type: 'audio/mp3' });
        handleFileSelect(file);
      } else {
        alert('Could not load audio sample file.');
      }
    } catch (err) {
      console.error('Failed to load sample:', err);
      alert('Error fetching sample MP3.');
    }
  };

  // Live microphone recording with real-time volume analyzer
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Audio level analyser
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
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const vol = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(vol);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioCtx.state !== 'closed') audioCtx.close();
        setMicVolume(0);

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());

        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([audioBlob], `live_recording.${ext}`, { type: mimeType });
        handleFileSelect(file);
      };

      // Collect data every 250ms
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing mic:', err);
      alert('Microphone access denied or audio input device not found. Please check browser and Windows permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  // Perform transcription via Whisper backend
  const handleTranscribe = async () => {
    if (!audioFile) {
      alert('Please select or record an audio file first.');
      return;
    }

    setIsTranscribing(true);
    setTranscript('');
    setNoSpeechDetected(false);

    const formData = new FormData();
    formData.append('file', audioFile, audioFile.name);
    if (selectedLanguage) {
      formData.append('language', selectedLanguage);
    }

    try {
      const response = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `Transcription failed (${response.status})`);
      }

      const text = data.text ? data.text.trim() : '';

      if (!text) {
        setNoSpeechDetected(true);
        setTranscript('');
        setStats(null);
      } else {
        setTranscript(text);
        setNoSpeechDetected(false);
        const words = text.split(/\s+/).filter(Boolean).length;
        const chars = text.length;
        setStats({ words, chars, language: data.language || 'English' });
      }
    } catch (err) {
      console.error('Transcription error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setTranscript(`[Transcription Error: ${errMsg}]\n\nPlease verify that the Whisper Transcriber backend is running at http://localhost:5000.`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendToChatbot = () => {
    if (!transcript) return;
    if (onOpenChat) {
      onOpenChat(`Please summarize and explain this audio transcript:\n\n"${transcript}"`);
    } else {
      onBack();
    }
  };

  return (
    <div className="audio-agent-container">
      {/* Header */}
      <header className="audio-agent-header">
        <div className="audio-header-left">
          <button type="button" className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            Back to Studio
          </button>
          <div className="audio-title-group">
            <h1>MP3 to Text Transcriber</h1>
            <div className="audio-status-pill">
              <span className="status-indicator-dot"></span>
              <span>OpenAI Whisper Tiny Engine Online</span>
            </div>
          </div>
        </div>
        <div className="audio-header-right">
          <button type="button" className="logout-btn" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="audio-agent-content">
        {/* Left Column: Upload & Controls */}
        <section className="audio-upload-panel">
          <div className="card-box">
            <div className="panel-title">
              <Upload size={18} color="#a855f7" />
              <span>Select Audio File</span>
            </div>

            <div 
              className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="dropzone-icon">
                <Music size={26} />
              </div>
              <div className="dropzone-text">
                <h4>Drop your MP3 / audio file here</h4>
                <p>Supports MP3, WAV, M4A, OGG, WEBM</p>
              </div>
              <button 
                type="button" 
                className="sample-quick-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample();
                }}
              >
                Use "audio sample.mp3"
              </button>
            </div>

            {/* Audio Preview */}
            {audioFile && (
              <div className="audio-player-wrapper">
                <div className="audio-file-badge">
                  <div className="file-info-name">
                    <Volume2 size={16} color="#c084fc" />
                    <span>{audioFile.name}</span>
                  </div>
                  <span className="file-size-tag">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                {audioUrl && (
                  <audio controls src={audioUrl}>
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
            )}

            {/* Language Selection */}
            <div className="language-selector-group">
              <label>
                <Globe size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Language:
              </label>
              <select 
                className="language-select" 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="auto">Auto-Detect Language</option>
                <option value="en">English (en)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
              </select>
            </div>
          </div>

          {/* Microphone Live Recording Option */}
          <div className="card-box">
            <div className="panel-title">
              <Mic size={18} color="#ef4444" />
              <span>Live Microphone Recording</span>
            </div>
            <div className="record-box">
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#f1f5f9' }}>
                  {isRecording ? 'Recording audio in real-time...' : 'Record voice directly with your mic'}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {isRecording ? 'Speak clearly into your microphone' : 'Capture instant voice memos'}
                </span>
              </div>
              <button 
                type="button" 
                className={`record-btn ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                <Mic size={16} />
                {isRecording ? 'Stop Recording' : 'Record Mic'}
              </button>
            </div>

            {/* Live Volume Meter */}
            {isRecording && (
              <div className="mic-meter-container">
                <div className="mic-meter-label">
                  <span>Mic Input Level</span>
                  <span>{micVolume > 5 ? `${micVolume}% Active` : 'Waiting for voice...'}</span>
                </div>
                <div className="mic-meter-track">
                  <div 
                    className="mic-meter-bar" 
                    style={{ width: `${Math.max(4, micVolume)}%` }} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Transcribe Submit Action */}
          <button 
            type="button" 
            className="transcribe-action-btn"
            onClick={handleTranscribe}
            disabled={!audioFile || isTranscribing}
          >
            {isTranscribing ? (
              <>
                <span className="spinner" />
                <span>Transcribing with Whisper...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Transcribe Audio to Text</span>
              </>
            )}
          </button>
        </section>

        {/* Right Column: Transcript View */}
        <section className="card-box transcript-panel">
          <div className="transcript-header-bar">
            <div className="panel-title" style={{ margin: 0 }}>
              <FileText size={18} color="#6366f1" />
              <span>Transcription Output</span>
            </div>

            {stats && (
              <div className="transcript-stats">
                <span className="stat-chip">{stats.words} words</span>
                <span className="stat-chip">{stats.chars} characters</span>
                {stats.language && <span className="stat-chip">Language: {stats.language}</span>}
              </div>
            )}

            <div className="transcript-actions">
              <button 
                type="button" 
                className="action-icon-btn" 
                onClick={handleCopy}
                disabled={!transcript}
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button 
                type="button" 
                className="action-icon-btn" 
                onClick={handleDownloadTxt}
                disabled={!transcript}
                title="Download text file"
              >
                <Download size={14} />
                <span>Export .txt</span>
              </button>
              <button 
                type="button" 
                className="action-icon-btn primary-action" 
                onClick={handleSendToChatbot}
                disabled={!transcript}
                title="Ask Ollama LLM about this transcription"
              >
                <MessageSquare size={14} />
                <span>Ask Chatbot</span>
              </button>
            </div>
          </div>

          {/* Text Container */}
          <div className="transcript-text-container">
            {transcript ? (
              transcript
            ) : noSpeechDetected ? (
              <div className="no-speech-warning-card">
                <div className="no-speech-title">
                  <AlertTriangle size={20} color="#f59e0b" />
                  <span>No audible speech was detected in this recording</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#f1f5f9' }}>
                  OpenAI Whisper processed the audio clip but did not find clear spoken words.
                </p>
                <ul className="no-speech-reasons">
                  <li><b>Microphone Input Level:</b> The recording may have been silent, too quiet, or your microphone volume is muted in Windows Settings.</li>
                  <li><b>Audio Content:</b> Chimes, sound effects, or background hum without human speech are filtered out by Whisper.</li>
                  <li><b>Spoken Language:</b> If speaking a language other than English, ensure <b>Language</b> is set to <i>Auto-Detect</i>.</li>
                </ul>
                <div className="no-speech-actions">
                  <button type="button" className="no-speech-btn" onClick={handleLoadSample}>
                    Test with Sample Speech Audio
                  </button>
                  <button type="button" className="no-speech-btn" onClick={startRecording}>
                    Record Again with Mic
                  </button>
                </div>
              </div>
            ) : (
              <div className="transcript-empty-state">
                <Music size={36} />
                <p>Upload an MP3 audio file on the left and click <b>Transcribe Audio to Text</b></p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
