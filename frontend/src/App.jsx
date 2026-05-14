import { AppHeader } from './components/AppHeader.jsx';
import { PageTabs } from './components/PageTabs.jsx';
import { BudgetAppProvider } from './context/BudgetAppContext.jsx';
import { useBabyFinanceApp } from './hooks/useBabyFinanceApp.js';
import { AuthPage } from './pages/AuthPage.jsx';
import { PlannerPage } from './pages/PlannerPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { SummaryPage } from './pages/SummaryPage.jsx';

function App() {
  const app = useBabyFinanceApp();

  if (!app.user) {
    return (
      <BudgetAppProvider value={app}>
        <AuthPage />
      </BudgetAppProvider>
    );
  }

  return (
    <BudgetAppProvider value={app}>
      <main className="app-shell">
        <AppHeader />
        <PageTabs />

        {app.activePage === 'planner' && <PlannerPage />}
        {app.activePage === 'profile' && <ProfilePage />}
        {app.activePage === 'summary' && <SummaryPage />}
      </main>
    </BudgetAppProvider>
  );
}

export default App;
