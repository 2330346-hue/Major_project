import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Trash2, AlertCircle, FileSearch, Sparkles } from 'lucide-react';

interface ResumeUploadProps {
  onAnalyze: (file: File, jobDescription: string) => void;
  isAnalyzing: boolean;
}

export default function ResumeUpload({ onAnalyze, isAnalyzing }: ResumeUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt'];
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg('Please upload a PDF, DOC, or DOCX file.');
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg('File size must be 5 MB or less.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="upload-section-card">
      <div className="upload-header">
        <div className="upload-header-icon">
          <FileSearch size={28} color="#155eef" />
        </div>
        <div>
          <h2>AI Resume ATS Analyzer</h2>
          <p className="upload-subtitle">
            Upload your resume and discover how ATS-friendly it is.
          </p>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <div className="drop-zone-content">
            <div className="upload-cloud-circle">
              <UploadCloud size={32} color="#155eef" />
            </div>
            <div className="drop-zone-text">
              <span className="bold-text">Drag & drop your resume here</span>
              <span className="link-text"> standard click to browse</span>
            </div>
            <p className="format-hint">
              Supported formats: PDF, DOCX, DOC (Maximum file size: 5 MB)
            </p>
          </div>
        ) : (
          <div className="file-preview-card" onClick={(e) => e.stopPropagation()}>
            <div className="file-info-left">
              <div className="file-icon-badge">
                <FileText size={24} color="#155eef" />
              </div>
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-meta">
                  {selectedFile.name.split('.').pop()?.toUpperCase()} • {formatFileSize(selectedFile.size)} • <span className="ready-badge">Ready for analysis</span>
                </span>
              </div>
            </div>
            <button
              className="remove-file-btn"
              onClick={handleRemoveFile}
              title="Remove file"
              type="button"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="error-alert">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Optional Job Description Section */}
      <div className="job-desc-wrapper">
        <label className="job-desc-label">
          <span>Compare Against a Job Description</span>
          <span className="optional-badge">Optional</span>
        </label>
        <textarea
          className="job-desc-textarea"
          rows={4}
          placeholder="Paste the job description here (optional)..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <p className="job-desc-hint">
          Adding a job description allows us to calculate keyword matching and role relevance.
        </p>
      </div>

      {/* Submit Button */}
      <div className="upload-actions">
        <button
          className="btn-primary analyze-btn"
          disabled={!selectedFile || isAnalyzing}
          onClick={() => selectedFile && onAnalyze(selectedFile, jobDescription)}
        >
          <Sparkles size={18} />
          {isAnalyzing ? 'Analyzing Resume...' : 'Analyze Resume'}
        </button>
      </div>
    </div>
  );
}
