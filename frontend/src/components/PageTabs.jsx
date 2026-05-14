import { useBudgetApp } from '../context/BudgetAppContext.jsx';

export function PageTabs() {
  const { activePage, setActivePage } = useBudgetApp();

  return (
    <nav className="page-tabs" aria-label="Primary pages">
      <button
        type="button"
        className={activePage === 'planner' ? 'active' : ''}
        onClick={() => setActivePage('planner')}
      >
        Planner
      </button>
      <button
        type="button"
        className={activePage === 'summary' ? 'active' : ''}
        onClick={() => setActivePage('summary')}
      >
        Summary
      </button>
    </nav>
  );
}
