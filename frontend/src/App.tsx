import { useState } from 'react'
import './App.css'
import TimetableUpload from './components/TimetableUpload'
import ChatBot from './components/ChatBot'
import PriorityList from './components/PriorityList'
import Dashboard from './components/Dashboard'

function App() {
  const [studentId, setStudentId] = useState(() => {
    // Try to load from localStorage first
    return localStorage.getItem('studentId') || 'STUDENT001';
  });
  const [view, setView] = useState<'upload' | 'priority' | 'dashboard'>('dashboard');

  // Save studentId to localStorage whenever it changes
  const handleStudentIdChange = (newId: string) => {
    setStudentId(newId);
    localStorage.setItem('studentId', newId);
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="app-nav">
        <h1>📚 Smart Timetable</h1>
        <div className="nav-buttons">
          <button 
            className={view === 'dashboard' ? 'active' : ''}
            onClick={() => setView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={view === 'upload' ? 'active' : ''}
            onClick={() => setView('upload')}
          >
            ⬆️ Upload Timetable
          </button>
          <button 
            className={view === 'priority' ? 'active' : ''}
            onClick={() => setView('priority')}
          >
            🎯 Priorities
          </button>
        </div>
        <div className="student-id-input">
          <label htmlFor="studentId">Student ID:</label>
          <input 
            id="studentId"
            type="text" 
            value={studentId} 
            onChange={(e) => handleStudentIdChange(e.target.value)}
            placeholder="Enter Student ID"
          />
        </div>
      </nav>

      {/* Content */}
      <div className="app-content">
        {view === 'upload' ? (
          <TimetableUpload studentId={studentId} />
        ) : view === 'priority' ? (
          <PriorityList studentId={studentId} />
        ) : (
          <Dashboard studentId={studentId} />
        )}
      </div>

      {/* AI Chatbot - Always visible */}
      <ChatBot studentId={studentId} />
    </div>
  )
}

export default App