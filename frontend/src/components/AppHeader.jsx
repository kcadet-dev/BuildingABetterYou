import { useBudgetApp } from '../context/BudgetAppContext.jsx';

export function AppHeader() {
  const { handleLogout, setActivePage, user } = useBudgetApp();

  return (
    <header className="home-header">
      <div className="home-header-copy">
        <div className="brand-mark-row">
          <span className="money-badge" aria-hidden="true">
            $
          </span>
          <p className="eyebrow">BABY Finance</p>
        </div>
        <h1>Welcome, {user.firstName || user.email || 'there'}</h1>
      </div>
      <div className="header-actions">
        <button type="button" className="secondary-button" onClick={() => setActivePage('profile')}>
          Profile
        </button>
        <button type="button" className="secondary-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
