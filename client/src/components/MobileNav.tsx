import { useMediaQuery } from '../hooks/useMediaQuery';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠', path: '/' },
  { id: 'play', label: 'Play', icon: '♟️', path: '/play' },
  { id: 'daily', label: 'Daily', icon: '🧩', path: '/daily' },
  { id: 'krog', label: 'KROG', icon: '🏆', path: '/leaderboard' },
  { id: 'profile', label: 'You', icon: '👤', path: '/profile' }
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const { isMobile } = useMediaQuery();

  if (!isMobile) return null;

  return (
    <nav className="mobile-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onTabChange(item.id)}
          aria-label={item.label}
        >
          <span className="mobile-nav-icon">{item.icon}</span>
          <span className="mobile-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
