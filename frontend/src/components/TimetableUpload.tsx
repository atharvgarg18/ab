import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { timetableAPI } from '../services/api';
import './TimetableUpload.css';

interface TimetableUploadProps {
  studentId: string;
}

const TimetableUpload: React.FC<TimetableUploadProps> = ({ studentId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setError(null);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10485760,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file || !studentId.trim()) {
      setError('Please provide both student ID and timetable file');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await timetableAPI.uploadTimetable(file, studentId);
      setResult(response);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="upload-container">
      <header className="upload-header">
        <h1>Upload Timetable</h1>
        <p>Upload your timetable image or PDF for automatic parsing</p>
        <div className="current-student-badge">
          Student ID: <strong>{studentId}</strong>
        </div>
      </header>

      {!result ? (
        <div className="upload-form">
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="file-preview">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  className="remove-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="dropzone-content">
                <div className="upload-icon">📤</div>
                <p className="upload-text">
                  {isDragActive ? 'Drop your file here' : 'Drop your timetable here or click to browse'}
                </p>
                <p className="upload-hint">Supports PNG, JPG, or PDF (max 10MB)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || !studentId.trim() || uploading}
            className="upload-button"
          >
            {uploading ? (
              <>
                <div className="button-spinner" />
                Processing...
              </>
            ) : (
              'Upload & Parse'
            )}
          </button>
        </div>
      ) : (
        <div className="upload-success">
          <div className="success-icon">✓</div>
          <h2>Timetable Uploaded Successfully!</h2>
          <p>Your timetable has been parsed and saved.</p>

          {result.structuredData && (
            <div className="parsed-preview">
              <h3>Parsed Schedule</h3>
              <div className="schedule-grid">
                {Object.entries(result.structuredData).map(([day, classes]: [string, any]) => (
                  <div key={day} className="schedule-day">
                    <h4>{day}</h4>
                    <div className="day-classes-preview">
                      {Array.isArray(classes) && classes.length > 0 ? (
                        classes.map((cls: any, idx: number) => (
                          <div key={idx} className="class-preview">
                            <span className="preview-time">{cls.time}</span>
                            <span className="preview-subject">{cls.subject}</span>
                          </div>
                        ))
                      ) : (
                        <span className="no-classes-text">No classes</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={resetForm} className="reset-button">
            Upload Another Timetable
          </button>
        </div>
      )}
    </div>
  );
};

export default TimetableUpload;
