import { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export default function AuthModal({ isOpen, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password);
      }
      // Success - close modal and reset
      setEmail('');
      setPassword('');
      setMode('signin');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-bg open"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-title">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Email</label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            placeholder="you@example.com"
            style={{ width: '100%' }}
            autoFocus
          />
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            placeholder="••••••••"
            style={{ width: '100%' }}
          />
        </div>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        <div className="auth-switch">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button className="auth-switch-btn" onClick={switchMode} disabled={loading}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
