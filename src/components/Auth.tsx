import type { User } from '../Types';

interface AuthProps {
  user: User | null;
  onSignInClick: () => void;
  onSignOut: () => void;
}

function getInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function truncateEmail(email: string, maxLength = 22): string {
  if (email.length <= maxLength) return email;
  return email.slice(0, maxLength - 3) + '...';
}

export default function Auth({ user, onSignInClick, onSignOut }: AuthProps) {
  if (!user) {
    // Guest state
    return (
      <div className="auth-section">
        <div className="auth-guest-msg">
          Changes won't be saved across sessions
        </div>
        <button className="btn btn-primary" onClick={onSignInClick} style={{ width: '100%' }}>
          Sign in
        </button>
      </div>
    );
  }

  // Logged in state
  return (
    <div className="auth-section">
      <div className="auth-user">
        <div className="auth-avatar">{getInitials(user.email)}</div>
        <div className="auth-email" title={user.email}>
          {truncateEmail(user.email)}
        </div>
      </div>
      <button className="btn btn-ghost" onClick={onSignOut} style={{ width: '100%' }}>
        Sign out
      </button>
    </div>
  );
}
