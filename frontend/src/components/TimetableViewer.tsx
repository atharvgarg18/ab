import React, { useState, useEffect } from 'react';
import { timetableAPI } from '../services/api';
import './TimetableViewer.css';

interface Class {
  subject: string;
  time: string;
  room?: string;
  teacher?: string;
}

interface TimetableViewerProps {
  studentId: string;
}

const TimetableViewer: React.FC<TimetableViewerProps> = ({ studentId }) => {
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [studentId]);

  const loadTimetable = async () => {
    if (!studentId?.trim()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await timetableAPI.getStudentTimetables(studentId);
      
      if (response.timetables?.[0]) {
        setTimetable(response.timetables[0]);
      }
    } catch (err) {
      setError('Failed to load timetable');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseSchedule = (data: any): Record<string, Class[]> => {
    const schedule: Record<string, Class[]> = {};
    if (!data) return schedule;

    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const key in data) {
      const normalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      if (allDays.includes(normalized)) {
        schedule[normalized] = Array.isArray(data[key]) ? data[key] : [];
      }
    }

    return schedule;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return <div className="viewer-loading"><div className="spinner" /></div>;
  }

  if (error || !timetable) {
    return <div className="viewer-empty"><p>Upload your timetable to get started</p></div>;
  }

  const schedule = parseSchedule(timetable.structuredData);
  
  // Get today's classes
  const todayClasses = schedule[today] || [];
  
  // Get current and next class
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const getCurrentClass = () => {
    return todayClasses.find(cls => {
      const [start, end] = cls.time.split(/[-–to]+/i);
      if (!start) return false;
      const startMin = parseTimeToMinutes(start);
      const endMin = end ? parseTimeToMinutes(end) : startMin + 60;
      return currentMinutes >= startMin && currentMinutes < endMin;
    });
  };
  
  const getUpcomingClasses = () => {
    // Get all upcoming classes today
    const upcoming = todayClasses.filter(cls => {
      const start = cls.time.split(/[-–to]+/i)[0];
      return parseTimeToMinutes(start) > currentMinutes;
    });
    
    // If there are upcoming classes today, return all of them
    if (upcoming.length > 0) {
      return upcoming;
    }
    
    // If today's classes are done, find the next day with classes
    const todayIndex = days.indexOf(today);
    for (let i = 1; i <= days.length; i++) {
      const nextDayIndex = (todayIndex + i) % days.length;
      const nextDay = days[nextDayIndex];
      const nextDayClasses = schedule[nextDay] || [];
      
      // Return all classes from the first day that has classes
      if (nextDayClasses.length > 0) {
        return nextDayClasses;
      }
    }
    
    // If no upcoming classes found in the week, return empty
    return [];
  };
  
  const parseTimeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):?(\d*)\s*(am|pm)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2] || '0');
    const period = match[3]?.toLowerCase();
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const currentClass = getCurrentClass();
  const upcomingClasses = getUpcomingClasses();
  
  // Determine which day the upcoming classes are from
  let upcomingDayName = '';
  if (upcomingClasses.length > 0) {
    // Check if the first upcoming class is from today
    const isFromToday = todayClasses.some(tc => 
      tc.subject === upcomingClasses[0].subject && 
      tc.time === upcomingClasses[0].time
    );
    
    if (!isFromToday) {
      // Find which day these classes belong to
      const todayIndex = days.indexOf(today);
      for (let i = 1; i <= days.length; i++) {
        const nextDayIndex = (todayIndex + i) % days.length;
        const dayToCheck = days[nextDayIndex];
        const dayClasses = schedule[dayToCheck] || [];
        
        if (dayClasses.length > 0 && 
            dayClasses[0].subject === upcomingClasses[0].subject &&
            dayClasses[0].time === upcomingClasses[0].time) {
          upcomingDayName = dayToCheck;
          break;
        }
      }
    }
  }
  
  // Filter time slots to only show rows with classes
  const usedTimeSlots = timeSlots.filter(time => {
    return days.some(day => {
      const dayClasses = schedule[day] || [];
      return dayClasses.some((cls: Class) => {
        const classTime = cls.time.split(/[-–to]+/i)[0].trim();
        const hour = classTime.match(/\d+/)?.[0];
        return hour && time.includes(hour);
      });
    });
  });

  return (
    <div className="timetable-viewer-elegant">
      <div className="time-header">
        <div className="current-date">{formatDate(currentTime)}</div>
        <div className="current-time">{formatTime(currentTime)}</div>
      </div>

      {/* Today's Agenda */}
      {(currentClass || upcomingClasses.length > 0) && (
        <div className="today-agenda">
          {currentClass && (
            <div className="agenda-item current">
              <div className="agenda-badge">Now</div>
              <div className="agenda-details">
                <div className="agenda-subject">{currentClass.subject}</div>
                <div className="agenda-time">{currentClass.time}</div>
              </div>
            </div>
          )}
          {upcomingClasses.map((cls, idx) => {
            // Check if this class is from today
            const isFromToday = todayClasses.some(tc => 
              tc.subject === cls.subject && tc.time === cls.time
            );
            
            // Determine the label
            let label = '';
            if (isFromToday) {
              label = idx === 0 ? 'Next' : 'Later';
            } else {
              label = upcomingDayName || 'Upcoming';
            }
            
            return (
              <div key={idx} className="agenda-item">
                <div className="agenda-badge">{label}</div>
                <div className="agenda-details">
                  <div className="agenda-subject">{cls.subject}</div>
                  <div className="agenda-time">{cls.time}</div>
                  {cls.room && <div className="agenda-room">{cls.room}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="calendar-grid">
        <div className="calendar-header">
          <div className="time-column-header"></div>
          {days.map(day => (
            <div key={day} className={`day-column-header ${day === today ? 'today' : ''}`}>
              <div className="day-name">{day.substring(0, 3)}</div>
            </div>
          ))}
        </div>

        <div className="calendar-body">
          {usedTimeSlots.map((time) => (
            <div key={time} className="time-row">
              <div className="time-label">{time}</div>
              {days.map(day => {
                const dayClasses = schedule[day] || [];
                const classInSlot = dayClasses.find((cls: Class) => {
                  const classTime = cls.time.split(/[-–to]+/i)[0].trim();
                  const hour = classTime.match(/\d+/)?.[0];
                  return hour && time.includes(hour);
                });

                return (
                  <div 
                    key={`${day}-${time}`} 
                    className={`calendar-cell ${day === today ? 'today-column' : ''}`}
                  >
                    {classInSlot && (
                      <div className="class-block">
                        <div className="class-subject">{classInSlot.subject}</div>
                        <div className="class-time-small">{classInSlot.time}</div>
                        {classInSlot.room && <div className="class-room">{classInSlot.room}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimetableViewer;
