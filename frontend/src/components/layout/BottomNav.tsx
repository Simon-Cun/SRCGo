import { NavLink } from 'react-router-dom';

const BarcodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9V6a2 2 0 0 1 2-2h1M3 15v3a2 2 0 0 0 2 2h1M15 4h1a2 2 0 0 1 2 2v3M15 20h1a2 2 0 0 0 2-2v-3" />
    <line x1="7" y1="7" x2="7" y2="17" strokeWidth="2" />
    <line x1="9.5" y1="7" x2="9.5" y2="17" strokeWidth="1" />
    <line x1="11.5" y1="7" x2="11.5" y2="17" strokeWidth="1" />
    <line x1="14" y1="7" x2="14" y2="17" strokeWidth="2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const BottomNav = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex flex-col items-center gap-1 py-2 px-4 text-xs font-medium transition-colors',
      isActive ? 'text-primary-blue' : 'text-neutral-gray500',
    ].join(' ');

  return (
    <nav className="bg-white border-t border-neutral-gray200 shadow-sm flex justify-center">
      <NavLink to="/" end className={linkClass}>
        <BarcodeIcon />
        Barcode
      </NavLink>
      <NavLink to="/settings" className={linkClass}>
        <SettingsIcon />
        Settings
      </NavLink>
    </nav>
  );
};

export default BottomNav;
