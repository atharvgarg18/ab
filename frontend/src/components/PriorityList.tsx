import React, { useState, useEffect } from 'react';
import './PriorityList.css';

interface PriorityListProps {
  studentId: string;
}

const PriorityList: React.FC<PriorityListProps> = ({ studentId }) => {
  const defaultExams = ['Boards', 'IPMAT', 'CUET', 'SAT'];
  const [priorities, setPriorities] = useState<string[]>(defaultExams);
  const [isEditing, setIsEditing] = useState(false);
  const [tempPriorities, setTempPriorities] = useState<string[]>(defaultExams);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPriorities();
  }, [studentId]);

  const loadPriorities = () => {
    const stored = localStorage.getItem(`${studentId}-exam-priorities`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPriorities(parsed);
        setTempPriorities(parsed);
      } catch (error) {
        console.error('Failed to load priorities', error);
      }
    }
  };

  const savePriorities = () => {
    localStorage.setItem(`${studentId}-exam-priorities`, JSON.stringify(tempPriorities));
    setPriorities(tempPriorities);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPriorities = [...tempPriorities];
    const draggedItem = newPriorities[draggedIndex];
    newPriorities.splice(draggedIndex, 1);
    newPriorities.splice(index, 0, draggedItem);

    setTempPriorities(newPriorities);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const startEditing = () => {
    setTempPriorities([...priorities]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTempPriorities([...priorities]);
    setIsEditing(false);
  };

  const displayPriorities = isEditing ? tempPriorities : priorities;

  return (
    <div className="priority-container">
      <header className="priority-header">
        <h1>Exam Priorities</h1>
        <p>Arrange your exams in order of importance</p>
      </header>

      <div className="priority-card">
        {saved && (
          <div className="save-notification">
            ✓ Priorities saved successfully!
          </div>
        )}

        <div className="priority-list">
          {displayPriorities.map((exam, index) => (
            <div
              key={exam}
              className={`priority-item ${isEditing ? 'editable' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
              draggable={isEditing}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="priority-rank">
                <span className="rank-number">{index + 1}</span>
              </div>
              <div className="priority-content">
                <h3>{exam}</h3>
                <p>Priority Level {index + 1}</p>
              </div>
              {isEditing && (
                <div className="drag-handle">
                  <span>⋮⋮</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="priority-actions">
          {!isEditing ? (
            <button onClick={startEditing} className="edit-button">
              ✎ Edit Priorities
            </button>
          ) : (
            <div className="edit-actions">
              <button onClick={cancelEditing} className="cancel-button">
                Cancel
              </button>
              <button onClick={savePriorities} className="save-button">
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="priority-info">
          <div className="info-icon">💡</div>
          <p>
            Drag and drop to reorder your exam priorities. This helps us understand 
            what matters most to you and provide better support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriorityList;
