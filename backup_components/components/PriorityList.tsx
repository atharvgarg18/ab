import React, { useState, useEffect } from 'react';
import './PriorityList.css';

interface PriorityListProps {
  studentId: string;
}

const PriorityList: React.FC<PriorityListProps> = ({ studentId }) => {
  const [priorities, setPriorities] = useState<string[]>(['Boards', 'IPMAT', 'CUET', 'SAT']);
  const [isEditing, setIsEditing] = useState(false);
  const [tempPriorities, setTempPriorities] = useState<string[]>(priorities);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved priorities from localStorage
    const saved = localStorage.getItem(`${studentId}-exam-priorities`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPriorities(parsed);
      setTempPriorities(parsed);
    }
  }, [studentId]);

  const handleDragStart = (_index: number, e: React.DragEvent) => {
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/html', e.currentTarget as unknown as string);
    (e.currentTarget as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    const draggingElement = document.querySelector('.dragging') as HTMLElement;
    if (!draggingElement) return;

    const draggingIndex = Array.from(
      document.querySelectorAll('.priority-item')
    ).indexOf(draggingElement);

    if (draggingIndex !== index) {
      const newPriorities = [...tempPriorities];
      const [removed] = newPriorities.splice(draggingIndex, 1);
      newPriorities.splice(index, 0, removed);
      setTempPriorities(newPriorities);
    }
  };

  const handleSave = () => {
    setPriorities(tempPriorities);
    localStorage.setItem(`${studentId}-exam-priorities`, JSON.stringify(tempPriorities));
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setTempPriorities(priorities);
    setIsEditing(false);
  };

  return (
    <div className="priority-list-container">
      <div className="priority-header">
        <div className="header-content">
          <h2>🎯 Exam Priority List</h2>
          <p>Drag to reorder your exam priorities</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="edit-btn"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      <div className="priorities-display">
        {!isEditing ? (
          // Display Mode
          <div className="priority-list">
            {priorities.map((exam, index) => (
              <div key={index} className="priority-item-display">
                <div className="rank-badge">{index + 1}</div>
                <span className="exam-name">{exam}</span>
              </div>
            ))}
          </div>
        ) : (
          // Edit Mode
          <div className="priority-list editable">
            {tempPriorities.map((exam, index) => (
              <div
                key={index}
                className="priority-item"
                draggable
                onDragStart={(e) => handleDragStart(index, e)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(index, e)}
              >
                <span className="drag-handle">⋮⋮</span>
                <div className="rank-badge">{index + 1}</div>
                <span className="exam-name">{exam}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="priority-actions">
          <button onClick={handleSave} className="save-btn">
            ✓ Save
          </button>
          <button onClick={handleCancel} className="cancel-btn">
            ✕ Cancel
          </button>
        </div>
      )}

      {saved && (
        <div className="save-message">
          ✅ Priorities saved successfully!
        </div>
      )}

      <div className="priority-info">
        <div className="info-card">
          <span className="info-emoji">📋</span>
          <div>
            <h4>Your Current Focus</h4>
            <p>{priorities[0]} is your top priority</p>
          </div>
        </div>
        <div className="info-card">
          <span className="info-emoji">🔄</span>
          <div>
            <h4>Flexible Ordering</h4>
            <p>Reorder anytime based on your goals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityList;
