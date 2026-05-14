import { createContext, useContext } from 'react';

const BudgetAppContext = createContext(null);

export function BudgetAppProvider({ children, value }) {
  return (
    <BudgetAppContext.Provider value={value}>
      {children}
    </BudgetAppContext.Provider>
  );
}

export function useBudgetApp() {
  const context = useContext(BudgetAppContext);

  if (!context) {
    throw new Error('useBudgetApp must be used inside BudgetAppProvider.');
  }

  return context;
}
