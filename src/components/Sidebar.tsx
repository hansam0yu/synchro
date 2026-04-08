import type { Page, User } from '../Types.ts';
import Auth from './Auth.tsx';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  user: User | null;
  onSignInClick: () => void;
  onSignOut: () => void;
}

export default function Sidebar({ activePage, onNavigate, user, onSignInClick, onSignOut }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div>
        <div className="logo">
          <div className="logo-text">synchro</div>
          <div className="logo-sub">daily organiser</div>
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
      </div>

      <Auth user={user} onSignInClick={onSignInClick} onSignOut={onSignOut} />
    </nav>
  );
}