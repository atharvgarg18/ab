import React, { useState, useEffect } from 'react';
import { timetableAPI } from '../services/api';
import './TimetableViewer.css';

interface TimetableViewerProps {
  studentId: string;
}

const TimetableViewer: React.FC<TimetableViewerProps> = ({ studentId }) => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

  useEffect(() => {
    const loadTimetables = async () => {
      if (!studentId || !studentId.trim()) {
        console.warn('⚠️ StudentId is empty or undefined');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Fetching timetables for studentId:', studentId);
        const response = await timetableAPI.getStudentTimetables(studentId);
        console.log('📊 API Response:', response);
        console.log('📚 Timetables found:', response.timetables?.length || 0);
        setTimetables(response.timetables || []);
        if (response.timetables && response.timetables.length > 0) {
          setSelectedTimetable(response.timetables[0]);
        }
      } catch (error) {
        console.error('❌ Error fetching timetables:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimetables();
  }, [studentId]);

  const parseSchedule = (structuredData: any) => {
    // Handle different timetable formats
    const schedule: any = {};
    
    if (!structuredData) return schedule;

    // Check if it's a day-based structure (case-insensitive)
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const daysTitleCase = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (const key in structuredData) {
      const keyUpper = key.toUpperCase();
      const dayIndex = daysOfWeek.indexOf(keyUpper);
      
      if (dayIndex !== -1) {
        // Normalize to title case (Monday, Tuesday, etc.)
        schedule[daysTitleCase[dayIndex]] = structuredData[key];
      }
    }

    // If no day-based structure found, try to parse it differently
    if (Object.keys(schedule).length === 0) {
      // Return the raw data for custom rendering
      return structuredData;
    }

    return schedule;
  };

  const getTodaySchedule = () => {
    if (!selectedTimetable) return null;
    const schedule = parseSchedule(selectedTimetable.structuredData);
    return schedule[currentDay] || null;
  };

  const getNextClass = () => {
    const todaySchedule = getTodaySchedule();
    if (!todaySchedule || !Array.isArray(todaySchedule)) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const classItem of todaySchedule) {
      if (classItem.time) {
        // Handle different time formats: "4:00PM - 5:00PM", "4:00PM To 5:00PM", etc.
        const timeParts = classItem.time.split(/\s*(?:-|to)\s*/i);
        if (timeParts.length >= 1) {
          const startTime = parseTime(timeParts[0]);
          if (startTime > currentTime) {
            return classItem;
          }
        }
      }
    }
    return null;
  };

  const parseTime = (timeStr: string) => {
    // Parse time string like "09:00 AM", "9:00", "4:00PM" to minutes
    if (!timeStr) return 0;
    
    const cleaned = timeStr.trim().toUpperCase();
    const [time, period] = cleaned.split(' ');
    
    if (!time) return 0;
    
    const timeParts = time.split(':');
    if (timeParts.length < 2) return 0;
    
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    
    let totalHours = hours;
    
    // Check if period is in the time string itself (like "4:00PM")
    const hasPM = time.includes('PM') || period === 'PM';
    const hasAM = time.includes('AM') || period === 'AM';
    
    if (hasPM && hours !== 12) totalHours += 12;
    if (hasAM && hours === 12) totalHours = 0;
    
    return totalHours * 60 + minutes;
  };

  const getCurrentClass = () => {
    const todaySchedule = getTodaySchedule();
    if (!todaySchedule || !Array.isArray(todaySchedule)) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const classItem of todaySchedule) {
      if (classItem.time) {
        // Handle different time formats: "4:00PM - 5:00PM", "4:00PM To 5:00PM", etc.
        const timeParts = classItem.time.split(/\s*(?:-|to)\s*/i);
        if (timeParts.length >= 2) {
          const startTime = parseTime(timeParts[0]);
          const endTime = parseTime(timeParts[1]);
          
          if (currentTime >= startTime && currentTime <= endTime) {
            return classItem;
          }
        }
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="timetable-viewer loading">
        <div className="spinner"></div>
        <p>Loading your timetable...</p>
      </div>
    );
  }

  if (timetables.length === 0) {
    return (
      <div className="timetable-viewer empty">
        <h3>📚 No Timetables Found</h3>
        <p>Upload your first timetable to get started!</p>
      </div>
    );
  }

  const schedule = parseSchedule(selectedTimetable?.structuredData);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todaySchedule = getTodaySchedule();
  const currentClass = getCurrentClass();
  const nextClass = getNextClass();

  return (
    <div className="timetable-viewer">
      {/* Header with metadata */}
      <div className="timetable-header">
        <div className="header-info">
          <h2>📅 Your Timetable</h2>
          {selectedTimetable?.metadata && (
            <div className="metadata">
              {selectedTimetable.metadata.semester && (
                <span className="badge">{selectedTimetable.metadata.semester}</span>
              )}
              {selectedTimetable.metadata.academicYear && (
                <span className="badge">{selectedTimetable.metadata.academicYear}</span>
              )}
              {selectedTimetable.metadata.section && (
                <span className="badge">Section {selectedTimetable.metadata.section}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Today's Full Schedule */}
      <div className="today-quick-view">
        <h3>📅 Today's Schedule - {currentDay}</h3>
        
        {todaySchedule && Array.isArray(todaySchedule) && todaySchedule.length > 0 ? (
          <div className="today-classes-list">
            {todaySchedule.map((classItem: any, index: number) => {
              const isCurrentClass = currentClass && 
                classItem.time === currentClass.time && 
                classItem.subject === currentClass.subject;
              
              const isNextClass = !currentClass && nextClass && 
                classItem.time === nextClass.time && 
                classItem.subject === nextClass.subject;

              return (
                <div 
                  key={index} 
                  className={`today-class-item ${isCurrentClass ? 'current' : ''} ${isNextClass ? 'next' : ''}`}
                >
                  {isCurrentClass && <span className="status-badge current">Now</span>}
                  {isNextClass && <span className="status-badge next">Next</span>}
                  
                  <div className="class-info">
                    <div className="class-main">
                      <h4>{classItem.subject || classItem.title || 'Class'}</h4>
                      <span className="class-time">⏰ {classItem.time}</span>
                    </div>
                    <div className="class-details">
                      {classItem.room && <span className="detail">📍 {classItem.room}</span>}
                      {classItem.teacher && <span className="detail">👨‍🏫 {classItem.teacher}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-classes-today">
            <p>🎉 No classes scheduled for today!</p>
          </div>
        )}
      </div>

      {/* Weekly Schedule */}
      <div className="weekly-schedule">
        <h3>📆 Weekly Schedule</h3>
        
        <div className="days-grid">
          {daysOfWeek.map((day) => {
            const daySchedule = schedule[day];
            const isToday = day === currentDay;
            
            return (
              <div key={day} className={`day-card ${isToday ? 'today' : ''}`}>
                <div className="day-header">
                  <h4>{day}</h4>
                  {isToday && <span className="today-badge">Today</span>}
                </div>
                
                <div className="day-schedule">
                  {daySchedule && Array.isArray(daySchedule) && daySchedule.length > 0 ? (
                    daySchedule.map((classItem: any, index: number) => (
                      <div key={index} className="class-slot">
                        <div className="time">{classItem.time}</div>
                        <div className="subject">{classItem.subject || classItem.title || 'Class'}</div>
                        {classItem.room && <div className="room">📍 {classItem.room}</div>}
                        {classItem.teacher && <div className="teacher">👨‍🏫 {classItem.teacher}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="no-classes">No classes</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Data Viewer (for debugging/custom formats) */}
      {selectedTimetable && (
        <details className="raw-data">
          <summary>View Raw Data</summary>
          <pre>{JSON.stringify(selectedTimetable.structuredData, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

export default TimetableViewer;
