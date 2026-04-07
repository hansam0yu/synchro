import type { Page } from '../Types.ts';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="logo">
        <div className="logo-text">synchro</div>
        <div className="logo-sub">your daily organiser</div>
      </div>
      <button
        className={`nav-item ${activePage === 'tasks' ? 'active' : ''}`}
        onClick={() => onNavigate('tasks')}
      >
        <span className="nav-icon">☑</span> Tasks
      </button>
      <button
        className={`nav-item ${activePage === 'calendar' ? 'active' : ''}`}
        onClick={() => onNavigate('calendar')}
      >
        <span className="nav-icon">◫</span> Calendar
      </button>
      <button
        className={`nav-item ${activePage === 'timetable' ? 'active' : ''}`}
        onClick={() => onNavigate('timetable')}
      >
        <span className="nav-icon">▤</span> Timetable
      </button>
    </nav>
  );
}