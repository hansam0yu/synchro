import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Task } from '../Types.ts';

interface TasksProps {
  tasks: Task[];
  onAdd: (title: string, due: string) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function formatDate(str: string): string {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Tasks({ tasks, onAdd, onToggle, onDelete }: TasksProps) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), due);
    setTitle('');
    setDue('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Tasks</div>
        <div className="page-sub">Track what needs to get done</div>
      </div>

      <div className="card">
        <div className="form-row">
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">Task name</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Add a task…"
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Due date</label>
            <input
              type="date"
              value={due}
              onChange={e => setDue(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            Add task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state">No tasks yet — add one above</div>
        ) : (
          <div>
            {tasks.map(task => {
              const overdue = task.due && task.due < todayStr && !task.done;
              return (
                <div className="task-item" key={task.id}>
                  <div
                    className={`task-check ${task.done ? 'checked' : ''}`}
                    onClick={() => onToggle(task.id)}
                  >
                    {task.done && '✓'}
                  </div>
                  <div className="task-info">
                    <div className={`task-title ${task.done ? 'done' : ''}`}>
                      {task.title}
                    </div>
                    {task.due && (
                      <div className={`task-due ${overdue ? 'overdue' : ''}`}>
                        {overdue ? 'Overdue · ' : 'Due '}
                        {formatDate(task.due)}
                      </div>
                    )}
                  </div>
                  <button className="btn-danger" onClick={() => onDelete(task.id)}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}