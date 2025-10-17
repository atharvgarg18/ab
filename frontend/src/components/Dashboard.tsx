import React, { useState, useEffect } from 'react';
// @ts-ignore
import { timetableAPI } from '../services/api.js';
import './Dashboard.css';

interface Class {
  subject: string;
  time: string;
  room?: string;
  teacher?: string;
}

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  category?: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  type: 'timetable' | 'todo';
  time: string;
  description?: string;
  room?: string;
  isLocked: boolean;
  todoId?: string;
}

interface DashboardProps {
  studentId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ studentId }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timetable, setTimetable] = useState<any>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [schedule, setSchedule] = useState<Record<string, Record<string, ScheduleItem[]>>>({});
  const [draggedTodo, setDraggedTodo] = useState<TodoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'general'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load timetable
  useEffect(() => {
    loadTimetable();
  }, [studentId]);

  // Load todos
  useEffect(() => {
    const savedTodos = localStorage.getItem(`todos_${studentId}`);
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, [studentId]);

  // Build schedule from timetable and todos
  useEffect(() => {
    buildSchedule();
  }, [timetable, todos]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const response = await timetableAPI.getStudentTimetables(studentId);
      if (response.timetables?.[0]) {
        setTimetable(response.timetables[0]);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildSchedule = () => {
    const newSchedule: Record<string, Record<string, ScheduleItem[]>> = {};

    // Initialize schedule structure
    days.forEach(day => {
      newSchedule[day] = {};
      timeSlots.forEach(time => {
        newSchedule[day][time] = [];
      });
    });

    // Add timetable classes (locked)
    if (timetable?.structuredData) {
      Object.entries(timetable.structuredData).forEach(([day, classes]: [string, any]) => {
        const normalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
        if (days.includes(normalizedDay) && Array.isArray(classes)) {
          classes.forEach((cls: Class) => {
            const startTime = extractStartTime(cls.time);
            if (startTime && newSchedule[normalizedDay]?.[startTime]) {
              newSchedule[normalizedDay][startTime].push({
                id: `timetable-${normalizedDay}-${startTime}-${cls.subject}`,
                title: cls.subject,
                type: 'timetable',
                time: cls.time,
                description: cls.teacher,
                room: cls.room,
                isLocked: true
              });
            }
          });
        }
      });
    }

    // Add todos that have been scheduled
    todos.forEach(todo => {
      if (todo.dueDate && todo.dueTime && !todo.completed) {
        const date = new Date(todo.dueDate);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        const hour = todo.dueTime.split(':')[0].padStart(2, '0');
        const timeSlot = `${hour}:00`;
        
        if (newSchedule[day]?.[timeSlot]) {
          newSchedule[day][timeSlot].push({
            id: `todo-${todo.id}`,
            title: todo.title,
            type: 'todo',
            time: todo.dueTime,
            description: todo.description,
            isLocked: false,
            todoId: todo.id
          });
        }
      }
    });

    setSchedule(newSchedule);
  };

  const extractStartTime = (timeStr: string): string | null => {
    const match = timeStr.match(/(\d+):?(\d*)[\s]*(am|pm)?/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const period = match[3]?.toLowerCase();
    
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:00`;
  };

  const handleDragStart = (todo: TodoItem) => {
    setDraggedTodo(todo);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: string, timeSlot: string) => {
    if (!draggedTodo) return;

    // Check if slot already has timetable class
    const slotItems = schedule[day]?.[timeSlot] || [];
    const hasTimetableClass = slotItems.some(item => item.type === 'timetable');
    
    if (hasTimetableClass) {
      alert('This time slot already has a timetable class!');
      setDraggedTodo(null);
      return;
    }

    // Calculate the date for this day
    const todayDate = new Date();
    const todayIndex = days.indexOf(today);
    const targetIndex = days.indexOf(day);
    const daysToAdd = targetIndex >= todayIndex 
      ? targetIndex - todayIndex 
      : 7 - (todayIndex - targetIndex);
    
    const targetDate = new Date(todayDate);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    
    // Update the todo with new date and time
    const updatedTodos = todos.map(todo => {
      if (todo.id === draggedTodo.id) {
        return {
          ...todo,
          dueDate: targetDate.toISOString().split('T')[0],
          dueTime: timeSlot
        };
      }
      return todo;
    });

    setTodos(updatedTodos);
    localStorage.setItem(`todos_${studentId}`, JSON.stringify(updatedTodos));
    setDraggedTodo(null);
  };

  const removeTodoFromSchedule = (todoId: string) => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          dueDate: undefined,
          dueTime: undefined
        };
      }
      return todo;
    });

    setTodos(updatedTodos);
    localStorage.setItem(`todos_${studentId}`, JSON.stringify(updatedTodos));
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      alert('Please enter a task title!');
      return;
    }

    const task: TodoItem = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description || undefined,
      priority: newTask.priority,
      completed: false,
      category: newTask.category
    };

    const updatedTodos = [...todos, task];
    setTodos(updatedTodos);
    localStorage.setItem(`todos_${studentId}`, JSON.stringify(updatedTodos));

    // Reset form
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      category: 'general'
    });
    setShowAddTask(false);
  };

  const handleCancelAddTask = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      category: 'general'
    });
    setShowAddTask(false);
  };

  const handleDeleteTask = (todoId: string) => {
    if (confirm('Delete this task?')) {
      const updatedTodos = todos.filter(todo => todo.id !== todoId);
      setTodos(updatedTodos);
      localStorage.setItem(`todos_${studentId}`, JSON.stringify(updatedTodos));
    }
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

  const unscheduledTodos = todos.filter(todo => 
    !todo.completed && (!todo.dueDate || !todo.dueTime)
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading your schedule...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header with Time */}
      <div className="dashboard-header">
        <div className="header-left">
          <div>
            <div className="current-date">{formatDate(currentTime)}</div>
            <div className="current-time">{formatTime(currentTime)}</div>
          </div>
        </div>
        
        {/* Today's Agenda - Compact */}
        <div className="header-agenda">
          <div className="agenda-title">Today's Agenda</div>
          <div className="agenda-items">
            {(() => {
              const todaySchedule = schedule[today] || {};
              const currentHour = currentTime.getHours();
              const upcomingItems: ScheduleItem[] = [];
              
              // Get upcoming items for today
              Object.entries(todaySchedule).forEach(([time, items]) => {
                const hour = parseInt(time.split(':')[0]);
                if (hour >= currentHour && items.length > 0) {
                  upcomingItems.push(...items);
                }
              });
              
              // Sort by time and take first 3
              let nextItems = upcomingItems
                .sort((a, b) => a.time.localeCompare(b.time))
                .slice(0, 3);
              
              // If no items for today, show tomorrow's agenda
              if (nextItems.length === 0) {
                const tomorrow = days[(days.indexOf(today) + 1) % days.length];
                const tomorrowSchedule = schedule[tomorrow] || {};
                const tomorrowItems: ScheduleItem[] = [];
                
                Object.entries(tomorrowSchedule).forEach(([, items]) => {
                  if (items.length > 0) {
                    tomorrowItems.push(...items);
                  }
                });
                
                nextItems = tomorrowItems
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .slice(0, 3);
                
                if (nextItems.length === 0) {
                  return (
                    <div className="agenda-empty">
                      <span>✓</span>
                      <span>All clear!</span>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="agenda-day-label">📅 Tomorrow ({tomorrow.substring(0, 3)})</div>
                    {nextItems.map((item, idx) => (
                      <div key={idx} className={`agenda-item ${item.type}`}>
                        <div className="agenda-time">{item.time}</div>
                        <div className="agenda-details">
                          <div className="agenda-item-title">{item.title}</div>
                          {item.room && <div className="agenda-room">{item.room}</div>}
                        </div>
                      </div>
                    ))}
                  </>
                );
              }
              
              return nextItems.map((item, idx) => (
                <div key={idx} className={`agenda-item ${item.type}`}>
                  <div className="agenda-time">{item.time}</div>
                  <div className="agenda-details">
                    <div className="agenda-item-title">{item.title}</div>
                    {item.room && <div className="agenda-room">{item.room}</div>}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* To-Do Sidebar */}
        <div className="todo-sidebar">
          <div className="sidebar-header">
            <h3>
              📋 Tasks
              <span className="task-count">{unscheduledTodos.length}</span>
            </h3>
            <button 
              className="add-task-btn"
              onClick={() => setShowAddTask(!showAddTask)}
              title="Add new task"
            >
              {showAddTask ? '✕' : '+'}
            </button>
          </div>
          
          {showAddTask && (
            <div className="add-task-form">
              <input
                type="text"
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="task-input"
              />
              <textarea
                placeholder="Description (optional)..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="task-textarea"
                rows={2}
              />
              <div className="task-options">
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="priority-select"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="category-select"
                >
                  <option value="general">General</option>
                  <option value="study">Study</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <div className="form-actions">
                <button onClick={handleCancelAddTask} className="cancel-btn">Cancel</button>
                <button onClick={handleAddTask} className="save-btn">Add Task</button>
              </div>
            </div>
          )}

          <p className="sidebar-hint">Drag tasks to schedule them</p>
          
          <div className="todo-items">
            {unscheduledTodos.length === 0 && !showAddTask && (
              <div className="empty-todos">
                <span>✓</span>
                <p>All tasks scheduled!</p>
              </div>
            )}
            {unscheduledTodos.map(todo => (
              <div
                key={todo.id}
                className={`draggable-todo priority-${todo.priority}`}
              >
                <div 
                  className="todo-drag-area"
                  draggable
                  onDragStart={() => handleDragStart(todo)}
                >
                  <div className="todo-drag-handle">⋮⋮</div>
                  <div className="todo-content">
                    <div className="todo-title">{todo.title}</div>
                    {todo.description && (
                      <div className="todo-desc">{todo.description}</div>
                    )}
                    <div className="todo-priority-badge">{todo.priority}</div>
                  </div>
                </div>
                <button
                  className="delete-todo-btn"
                  onClick={() => handleDeleteTask(todo.id)}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-container">
          <div className="calendar-grid">
            {/* Header Row */}
            <div className="calendar-header-row">
              <div className="time-column-header">Time</div>
              {days.map(day => (
                <div 
                  key={day} 
                  className={`day-column-header ${day === today ? 'today' : ''}`}
                >
                  <div className="day-name">{day.substring(0, 3)}</div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="calendar-body">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="time-row">
                  <div className="time-label">
                    {timeSlot}
                  </div>
                  
                  {days.map(day => {
                    const items = schedule[day]?.[timeSlot] || [];
                    const isToday = day === today;
                    
                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className={`calendar-cell ${isToday ? 'today-column' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day, timeSlot)}
                      >
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`schedule-item ${item.type} ${item.isLocked ? 'locked' : 'draggable'}`}
                          >
                            <div className="item-title">{item.title}</div>
                            {item.room && <div className="item-room">{item.room}</div>}
                            {item.description && <div className="item-desc">{item.description}</div>}
                            {!item.isLocked && (
                              <button
                                className="remove-item"
                                onClick={() => removeTodoFromSchedule(item.todoId!)}
                                title="Remove from schedule"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {items.length === 0 && (
                          <div className="empty-slot">
                            <span className="drop-hint">+</span>
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
      </div>
    </div>
  );
};

export default Dashboard;
