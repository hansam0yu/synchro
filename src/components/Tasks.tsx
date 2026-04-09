import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Task, Category } from '../Types.ts';

const PRESET_COLORS = [
  '#4f8ef7', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899',
  '#14b8a6', '#22c55e', '#f97316', '#6b7280', '#a16207',
];

const GENERAL_CATEGORY: Category = { id: 'general', name: 'General', color: '#6b7280' };

interface TasksProps {
  tasks: Task[];
  categories: Category[];
  onAdd: (title: string, due: string, categoryId: string) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAddCategory: (name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDate(str: string): string {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Tasks({ tasks, categories, onAdd, onToggle, onDelete, onAddCategory, onDeleteCategory }: TasksProps) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('general');
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const todayStr = new Date().toISOString().slice(0, 10);
  const TASKS_PER_PAGE = 10;

  const allCategories: Category[] = [GENERAL_CATEGORY, ...categories];

  const getCategoryById = (id: string): Category =>
    allCategories.find((c) => c.id === id) ?? GENERAL_CATEGORY;

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), due, selectedCategoryId);
    setTitle('');
    setDue('');
    // Keep the selected category instead of resetting to general
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), newCatColor);
    setNewCatName('');
    setNewCatColor(PRESET_COLORS[0]);
    setShowNewCategory(false);
  };

  const handleNewCatKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddCategory();
    if (e.key === 'Escape') setShowNewCategory(false);
  };

  const filteredTasks = (filterCategoryId !== null
    ? tasks.filter((t) => (t.categoryId || 'general') === filterCategoryId)
    : tasks
  ).sort((a, b) => {
    // Tasks without due dates go to the end
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    // Sort by due date ascending (earliest first)
    return a.due.localeCompare(b.due);
  });

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);

  // Ensure current page is valid (in case tasks were deleted and we're on a page that no longer exists)
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  if (validCurrentPage !== currentPage && totalPages > 0) {
    setCurrentPage(validCurrentPage);
  }

  const startIndex = (validCurrentPage - 1) * TASKS_PER_PAGE;
  const endIndex = startIndex + TASKS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleFilterChange = (categoryId: string | null) => {
    setFilterCategoryId(categoryId);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Tasks</div>
        <div className="page-sub">Track what needs to get done</div>
      </div>

      <div className="tasks-layout">
        {/* Left column: input card + task list */}
        <div className="tasks-main">
          {/* Task input card */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Task name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  onChange={(e) => setDue(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  style={{ width: '160px' }}
                >
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.length > 20 ? cat.name.slice(0, 20) + '...' : cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleAdd}>
                Add task
              </button>
            </div>
          </div>

          {/* Task list */}
          <div className="card">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                {filterCategoryId !== null ? 'No tasks in this category' : 'No tasks yet — add one above'}
              </div>
            ) : (
              <div>
                {paginatedTasks.map((task) => {
                  const overdue = task.due && task.due < todayStr && !task.done;
                  const cat = getCategoryById(task.categoryId || 'general');
                  return (
                    <div className="task-item" key={task.id}>
                      <div
                        className={`task-check ${task.done ? 'checked' : ''}`}
                        onClick={() => onToggle(task.id)}
                      >
                        {task.done && '✓'}
                      </div>
                      <div className="task-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          <span className={`task-title ${task.done ? 'done' : ''}`}>
                            {task.title}
                          </span>
                          <span
                            className="task-cat-pill"
                            style={{
                              background: hexToRgba(cat.color, 0.13),
                              color: cat.color,
                              border: `1px solid ${hexToRgba(cat.color, 0.3)}`,
                            }}
                          >
                            {cat.name}
                          </span>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  style={{ padding: '6px 12px', opacity: validCurrentPage === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Page {validCurrentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  style={{ padding: '6px 12px', opacity: validCurrentPage === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: category panel */}
        <div className="tasks-cat-panel">
          <button
            className="btn-new-category"
            onClick={() => setShowNewCategory((v) => !v)}
          >
            + New category
          </button>

          {showNewCategory && (
            <div className="new-category-form">
              <input
                type="text"
                placeholder="Category name…"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={handleNewCatKey}
                style={{ width: '100%' }}
                autoFocus
              />
              <div className="color-picker" style={{ marginTop: 8 }}>
                {PRESET_COLORS.map((color) => (
                  <div
                    key={color}
                    className={`color-dot${newCatColor === color ? ' selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setNewCatColor(color)}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '7px 10px' }} onClick={handleAddCategory}>
                  Create
                </button>
                <button className="btn btn-ghost" style={{ flex: 1, padding: '7px 10px' }} onClick={() => setShowNewCategory(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="cat-filter-list">
            {/* All */}
            <div className="cat-filter-item-wrap">
              <button
                className={`cat-filter-item${filterCategoryId === null ? ' active' : ''}`}
                onClick={() => handleFilterChange(null)}
              >
                <span className="cat-filter-dot" style={{ background: 'var(--muted)' }} />
                <span className="cat-filter-name">All</span>
              </button>
              <span className="cat-filter-del-spacer" />
            </div>

            {allCategories.map((cat) => {
              const isActive = filterCategoryId === cat.id;
              return (
                <div key={cat.id} className="cat-filter-item-wrap">
                  <button
                    className={`cat-filter-item${isActive ? ' active' : ''}`}
                    style={isActive ? { color: cat.color } : {}}
                    onClick={() => handleFilterChange(isActive ? null : cat.id)}
                  >
                    <span className="cat-filter-dot" style={{ background: cat.color }} />
                    <span className="cat-filter-name">{cat.name}</span>
                  </button>
                  {cat.id !== 'general' ? (
                    <button
                      className="cat-filter-del"
                      title={`Delete ${cat.name}`}
                      onClick={() => {
                        if (filterCategoryId === cat.id) setFilterCategoryId(null);
                        onDeleteCategory(cat.id);
                      }}
                    >
                      ×
                    </button>
                  ) : (
                    <span className="cat-filter-del-spacer" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
