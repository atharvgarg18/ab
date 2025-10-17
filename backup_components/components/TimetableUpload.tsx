import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { timetableAPI } from '../services/api';
import './TimetableUpload.css';

interface TimetableUploadProps {
  studentId: string;
}

const TimetableUpload: React.FC<TimetableUploadProps> = ({ studentId: propStudentId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [studentId, setStudentId] = useState(propStudentId || '');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync with prop changes
  useEffect(() => {
    setStudentId(propStudentId);
  }, [propStudentId]);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setResult(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!studentId.trim()) {
      setError('Please enter a student ID');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await timetableAPI.uploadTimetable(file, studentId);
      setResult(response);
      setFile(null);
      setStudentId('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to upload timetable';
      setError(errorMessage);
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Timetable</h2>
      
      <form onSubmit={handleUpload} className="upload-form">
        {/* Student ID Input */}
        <div className="form-group">
          <label htmlFor="studentId">Student ID:</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter your student ID"
            disabled={uploading}
          />
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="file-info">
              <p>📄 {file.name}</p>
              <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="dropzone-text">
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <>
                  <p>Drag & drop your timetable here</p>
                  <p className="or-text">or click to select</p>
                  <p className="file-types">Supports: PNG, JPG, PDF (Max 10MB)</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={!file || !studentId || uploading}
          className="upload-button"
        >
          {uploading ? 'Processing...' : 'Upload & Extract'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="message error">
          ❌ {error}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="message success">
          <h3>✅ Timetable Uploaded Successfully!</h3>
          <p>Timetable ID: {result.timetableId}</p>
          
          {result.data && result.data.timetable && (
            <div className="timetable-preview">
              <h4>Extracted Timetable:</h4>
              {result.data.timetable.map((daySchedule: any, index: number) => (
                <div key={index} className="day-schedule">
                  <h5>{daySchedule.day}</h5>
                  {daySchedule.slots && daySchedule.slots.length > 0 ? (
                    <ul>
                      {daySchedule.slots.map((slot: any, slotIndex: number) => (
                        <li key={slotIndex}>
                          <strong>{slot.startTime} - {slot.endTime}</strong>: {slot.subject}
                          {slot.room && ` (${slot.room})`}
                          {slot.teacher && ` - ${slot.teacher}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-slots">No classes scheduled</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimetableUpload;
