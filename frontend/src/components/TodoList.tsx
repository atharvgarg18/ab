import React, { useState, useEffect } from 'react';
import './TodoList.css';

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  category?: string;
  createdAt: string;
}

interface TodoListProps {
  studentId: string;
}

const TodoList: React.FC<TodoListProps> = ({ studentId }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: ''
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem(`todos_${studentId}`);
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, [studentId]);

  // Save todos to localStorage
  useEffect(() => {
    if (todos.length > 0 || localStorage.getItem(`todos_${studentId}`)) {
      localStorage.setItem(`todos_${studentId}`, JSON.stringify(todos));
    }
  }, [todos, studentId]);

  const handleAddTodo = () => {
    if (!newTodo.title.trim()) return;

    const todo: TodoItem = {
      id: Date.now().toString(),
      title: newTodo.title,
      description: newTodo.description,
      dueDate: newTodo.dueDate,
      dueTime: newTodo.dueTime,
      priority: newTodo.priority,
      completed: false,
      category: newTodo.category,
      createdAt: new Date().toISOString()
    };

    setTodos([todo, ...todos]);
    setNewTodo({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      priority: 'medium',
      category: ''
    });
    setShowAddForm(false);
  };

  const toggleComplete = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const exportToGoogleCalendar = (todo: TodoItem) => {
    const title = encodeURIComponent(todo.title);
    const details = encodeURIComponent(todo.description || '');
    
    let dates = '';
    if (todo.dueDate) {
      const date = new Date(todo.dueDate + (todo.dueTime ? `T${todo.dueTime}` : ''));
      const startDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      dates = `&dates=${startDate}/${endDate}`;
    }
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${dates}`;
    window.open(url, '_blank');
  };

  const exportToOutlook = (todo: TodoItem) => {
    const title = encodeURIComponent(todo.title);
    const body = encodeURIComponent(todo.description || '');
    
    let dateParams = '';
    if (todo.dueDate) {
      const date = new Date(todo.dueDate + (todo.dueTime ? `T${todo.dueTime}` : ''));
      const startDate = date.toISOString();
      const endDate = new Date(date.getTime() + 60 * 60 * 1000).toISOString();
      dateParams = `&startdt=${startDate}&enddt=${endDate}`;
    }
    
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${body}${dateParams}&path=/calendar/action/compose&rru=addevent`;
    window.open(url, '_blank');
  };

  const exportToICS = (todo: TodoItem) => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Student Timetable//EN\nBEGIN:VEVENT\n';
    
    if (todo.dueDate) {
      const date = new Date(todo.dueDate + (todo.dueTime ? `T${todo.dueTime}` : ''));
      const startDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent += `DTSTART:${startDate}\nDTEND:${endDate}\n`;
    }
    
    icsContent += `SUMMARY:${todo.title}\n`;
    if (todo.description) {
      icsContent += `DESCRIPTION:${todo.description}\n`;
    }
    icsContent += `PRIORITY:${todo.priority === 'high' ? '1' : todo.priority === 'medium' ? '5' : '9'}\n`;
    icsContent += 'END:VEVENT\nEND:VCALENDAR';
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${todo.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    link.click();
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#D2691E';
      case 'medium': return '#A68A6D';
      case 'low': return '#8B7355';
      default: return '#8B7355';
    }
  };

  return (
    <div className="todo-container">
      <header className="todo-header">
        <h1>📝 To-Do List</h1>
        <p>Manage your tasks and sync with your calendar</p>
        <div className="student-badge">Student: <strong>{studentId}</strong></div>
      </header>

      <div className="todo-content">
        {/* Add Button and Filters */}
        <div className="todo-controls">
          <button className="add-todo-btn" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '✕ Cancel' : '+ Add Task'}
          </button>
          
          <div className="todo-filters">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All ({todos.length})
            </button>
            <button 
              className={filter === 'active' ? 'active' : ''} 
              onClick={() => setFilter('active')}
            >
              Active ({todos.filter(t => !t.completed).length})
            </button>
            <button 
              className={filter === 'completed' ? 'active' : ''} 
              onClick={() => setFilter('completed')}
            >
              Completed ({todos.filter(t => t.completed).length})
            </button>
          </div>
        </div>

        {/* Add Todo Form */}
        {showAddForm && (
          <div className="add-todo-form">
            <input
              type="text"
              placeholder="Task title *"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="todo-input"
            />
            
            <textarea
              placeholder="Description (optional)"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              className="todo-textarea"
              rows={3}
            />
            
            <div className="todo-form-row">
              <input
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                className="todo-input-small"
              />
              
              <input
                type="time"
                value={newTodo.dueTime}
                onChange={(e) => setNewTodo({ ...newTodo, dueTime: e.target.value })}
                className="todo-input-small"
              />
              
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })}
                className="todo-select"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            
            <input
              type="text"
              placeholder="Category (optional)"
              value={newTodo.category}
              onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
              className="todo-input"
            />
            
            <button className="save-todo-btn" onClick={handleAddTodo}>
              Add Task
            </button>
          </div>
        )}

        {/* Todo List */}
        <div className="todo-list">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No tasks yet. Add your first task to get started!</p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <div className="todo-main">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleComplete(todo.id)}
                    className="todo-checkbox"
                  />
                  
                  <div className="todo-details">
                    <h3 className="todo-title">{todo.title}</h3>
                    {todo.description && (
                      <p className="todo-description">{todo.description}</p>
                    )}
                    <div className="todo-meta">
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(todo.priority) }}
                      >
                        {todo.priority}
                      </span>
                      {todo.category && (
                        <span className="category-badge">{todo.category}</span>
                      )}
                      {todo.dueDate && (
                        <span className="due-date">
                          📅 {new Date(todo.dueDate).toLocaleDateString()}
                          {todo.dueTime && ` at ${todo.dueTime}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="todo-actions">
                  <div className="calendar-export">
                    <button 
                      className="export-btn"
                      title="Add to Calendar"
                    >
                      📆
                    </button>
                    <div className="export-dropdown">
                      <button onClick={() => exportToGoogleCalendar(todo)}>
                        Google Calendar
                      </button>
                      <button onClick={() => exportToOutlook(todo)}>
                        Outlook Calendar
                      </button>
                      <button onClick={() => exportToICS(todo)}>
                        Download .ics
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    className="delete-btn"
                    onClick={() => deleteTodo(todo.id)}
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoList;
