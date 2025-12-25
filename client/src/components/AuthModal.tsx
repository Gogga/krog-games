import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Hook to detect mobile viewport
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        const result = await register(username, email, password);
        if (result.success) {
          onClose();
        } else {
          setError(result.message);
        }
      } else {
        const result = await login(username, password);
        if (result.success) {
          onClose();
        } else {
          setError(result.message);
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: isMobile ? 'flex-end' : 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: isMobile ? '16px 16px 0 0' : '12px',
        padding: isMobile ? '20px 16px 32px' : '24px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '400px',
        maxHeight: isMobile ? '90vh' : 'auto',
        overflowY: isMobile ? 'auto' : 'visible',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        WebkitOverflowScrolling: 'touch' as const
      }}>
        {isMobile && (
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#555',
            borderRadius: '2px',
            margin: '0 auto 16px'
          }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '16px' : '20px' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: isMobile ? '20px' : '24px' }}>{mode === 'login' ? 'Login' : 'Create Account'}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: isMobile ? '28px' : '24px',
              cursor: 'pointer',
              padding: isMobile ? '8px' : '0',
              minWidth: isMobile ? '44px' : 'auto',
              minHeight: isMobile ? '44px' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: isMobile ? '14px' : '16px' }}>
            <label style={{ display: 'block', color: '#aaa', marginBottom: '6px', fontSize: isMobile ? '13px' : '14px' }}>
              {mode === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: isMobile ? '14px 12px' : '10px 12px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: isMobile ? '8px' : '6px',
                color: '#fff',
                fontSize: isMobile ? '16px' : '14px',
                boxSizing: 'border-box'
              }}
              placeholder={mode === 'login' ? 'Enter username or email' : 'Choose a username'}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: isMobile ? '14px' : '16px' }}>
              <label style={{ display: 'block', color: '#aaa', marginBottom: '6px', fontSize: isMobile ? '13px' : '14px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 12px' : '10px 12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #444',
                  borderRadius: isMobile ? '8px' : '6px',
                  color: '#fff',
                  fontSize: isMobile ? '16px' : '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email"
              />
            </div>
          )}

          <div style={{ marginBottom: isMobile ? '14px' : '16px' }}>
            <label style={{ display: 'block', color: '#aaa', marginBottom: '6px', fontSize: isMobile ? '13px' : '14px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: isMobile ? '14px 12px' : '10px 12px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: isMobile ? '8px' : '6px',
                color: '#fff',
                fontSize: isMobile ? '16px' : '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: isMobile ? '14px' : '16px' }}>
              <label style={{ display: 'block', color: '#aaa', marginBottom: '6px', fontSize: isMobile ? '13px' : '14px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 12px' : '10px 12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #444',
                  borderRadius: isMobile ? '8px' : '6px',
                  color: '#fff',
                  fontSize: isMobile ? '16px' : '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Confirm your password"
              />
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 100, 100, 0.2)',
              border: '1px solid rgba(255, 100, 100, 0.5)',
              borderRadius: isMobile ? '8px' : '6px',
              padding: isMobile ? '12px' : '10px',
              marginBottom: isMobile ? '14px' : '16px',
              color: '#ff6464',
              fontSize: isMobile ? '13px' : '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: isMobile ? '16px' : '12px',
              minHeight: isMobile ? '50px' : 'auto',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: isMobile ? '10px' : '6px',
              color: '#fff',
              fontSize: isMobile ? '17px' : '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isLoading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: isMobile ? '20px' : '16px', paddingBottom: isMobile ? '8px' : '0' }}>
          <span style={{ color: '#888', fontSize: isMobile ? '14px' : '14px' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={switchMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#4CAF50',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '14px',
              fontWeight: isMobile ? '600' : 'normal',
              textDecoration: 'underline',
              padding: isMobile ? '8px 4px' : '0',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
