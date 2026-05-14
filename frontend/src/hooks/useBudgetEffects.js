import { useEffect } from 'react';
import {
  apiBaseUrl,
  authStorageKey,
  getConfirmedExpenseStorageKey,
  getConfirmedIncomeStorageKey,
  getGoalsStorageKey,
  getUnconfirmedExpenseStorageKey,
  getUnconfirmedIncomeStorageKey,
  normalizeBudgetCategory,
  normalizeExpenseSource,
  normalizeIncomeSource,
  readStoredGoals,
  readStoredList,
} from '../lib/budgetHelpers.js';

export function useBudgetEffects(state, derived) {
  const {
    budgetCategoryForm,
    budgetGoals,
    confirmedExpensePayments,
    confirmedIncomePayments,
    setBudgetCategories,
    setBudgetCategoryForm,
    setBudgetGoals,
    setBudgetMessage,
    setConfirmedExpensePayments,
    setConfirmedIncomePayments,
    setExpenseMessage,
    setExpenseSources,
    setIncomeMessage,
    setIncomeSources,
    setMessage,
    setProfileForm,
    setUnconfirmedExpensePayments,
    setUnconfirmedIncomePayments,
    setUser,
    unconfirmedExpensePayments,
    unconfirmedIncomePayments,
    user,
  } = state;
  const { budgetCategoryOptions, userId } = derived;

  useEffect(() => {
    async function loadIncomeSources() {
      if (!userId) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/users/${userId}/income-sources`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load income sources.');
        }

        setIncomeSources(data.map(normalizeIncomeSource));
      } catch (error) {
        setIncomeMessage(error.message);
      }
    }

    loadIncomeSources();
  }, [setIncomeMessage, setIncomeSources, userId]);

  useEffect(() => {
    async function loadExpenseSources() {
      if (!userId) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/users/${userId}/expense-sources`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load expense sources.');
        }

        setExpenseSources(data.map(normalizeExpenseSource));
      } catch (error) {
        setExpenseMessage(error.message);
      }
    }

    loadExpenseSources();
  }, [setExpenseMessage, setExpenseSources, userId]);

  useEffect(() => {
    async function loadBudgetCategories() {
      if (!userId) {
        setBudgetCategories([]);
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/users/${userId}/budget-categories`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load monthly budget limits.');
        }

        setBudgetCategories(data.map(normalizeBudgetCategory));
        setBudgetMessage('');
      } catch (error) {
        setBudgetMessage(error.message);
      }
    }

    loadBudgetCategories();
  }, [setBudgetCategories, setBudgetMessage, userId]);

  useEffect(() => {
    async function loadUserProfile() {
      if (!userId) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/users/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load your profile.');
        }

        setUser((currentUser) => ({
          ...currentUser,
          createdAt: data.createdAt,
          dateOfBirth: data.dateOfBirth,
          email: data.email,
          firstName: data.firstName,
          id: data.id,
          lastName: data.lastName,
        }));
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadUserProfile();
  }, [setMessage, setUser, userId]);

  useEffect(() => {
    setBudgetGoals(readStoredGoals(userId));
    setConfirmedExpensePayments(readStoredList(userId, getConfirmedExpenseStorageKey, []));
    setConfirmedIncomePayments(readStoredList(userId, getConfirmedIncomeStorageKey, []));
    setUnconfirmedExpensePayments(readStoredList(userId, getUnconfirmedExpenseStorageKey, []));
    setUnconfirmedIncomePayments(readStoredList(userId, getUnconfirmedIncomeStorageKey, []));
  }, [
    setBudgetGoals,
    setConfirmedExpensePayments,
    setConfirmedIncomePayments,
    setUnconfirmedExpensePayments,
    setUnconfirmedIncomePayments,
    userId,
  ]);

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return;
    }

    if (!user) {
      globalThis.localStorage.removeItem(authStorageKey);
      return;
    }

    globalThis.localStorage.setItem(
      authStorageKey,
      JSON.stringify({
        provider: 'local-api',
        user,
        version: 1,
      }),
    );
  }, [user]);

  useEffect(() => {
    setProfileForm({
      dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  }, [setProfileForm, user]);

  useEffect(() => {
    if (!userId || typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return;
    }

    globalThis.localStorage.setItem(getGoalsStorageKey(userId), JSON.stringify(budgetGoals));
  }, [budgetGoals, userId]);

  useEffect(() => {
    if (!userId || typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return;
    }

    globalThis.localStorage.setItem(getConfirmedIncomeStorageKey(userId), JSON.stringify(confirmedIncomePayments));
  }, [confirmedIncomePayments, userId]);

  useEffect(() => {
    if (!userId || typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return;
    }

    globalThis.localStorage.setItem(getUnconfirmedIncomeStorageKey(userId), JSON.stringify(unconfirmedIncomePayments));
  }, [unconfirmedIncomePayments, userId]);

  useEffect(() => {
    if (!userId || typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return;
    }

    globalThis.localStorage.setItem(getConfirmedExpenseStorageKey(userId), JSON.stringify(confirmedExpensePayments));
  }, [confirmedExpensePayments, userId]);

  useEffect(() => {
    if (!userId || typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return;
    }

    globalThis.localStorage.setItem(getUnconfirmedExpenseStorageKey(userId), JSON.stringify(unconfirmedExpensePayments));
  }, [unconfirmedExpensePayments, userId]);

  useEffect(() => {
    if (budgetCategoryOptions.length === 0 || budgetCategoryOptions.includes(budgetCategoryForm.name)) {
      return;
    }

    setBudgetCategoryForm((currentForm) => ({
      ...currentForm,
      name: budgetCategoryOptions[0],
    }));
  }, [budgetCategoryForm.name, budgetCategoryOptions, setBudgetCategoryForm]);
}
