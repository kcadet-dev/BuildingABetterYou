import { useMemo, useState } from 'react';
import {
  createDefaultBudgetForm,
  createDefaultExpenseForm,
  createDefaultGoalForm,
  createDefaultIncomeForm,
  emptyAuthForm,
  readStoredAuthSession,
} from '../lib/budgetHelpers.js';

export function useBudgetAppState() {
  const today = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const currentMonthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  const yearEnd = useMemo(() => new Date(today.getFullYear(), 11, 31), [today]);
  const finalMonthStart = useMemo(() => new Date(today.getFullYear(), 11, 1), [today]);

  const [authMode, setAuthMode] = useState('login');
  const [budgetCategoryForm, setBudgetCategoryForm] = useState(createDefaultBudgetForm());
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [formData, setFormData] = useState(emptyAuthForm);
  const [budgetGoalForm, setBudgetGoalForm] = useState(createDefaultGoalForm(today));
  const [budgetGoals, setBudgetGoals] = useState([]);
  const [confirmedExpensePayments, setConfirmedExpensePayments] = useState([]);
  const [confirmedIncomePayments, setConfirmedIncomePayments] = useState([]);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [expenseForm, setExpenseForm] = useState(createDefaultExpenseForm(today));
  const [expenseSources, setExpenseSources] = useState([]);
  const [incomeForm, setIncomeForm] = useState(createDefaultIncomeForm(today));
  const [incomeSources, setIncomeSources] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStart);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMonthRange, setSelectedMonthRange] = useState(null);
  const [selectedWeekRange, setSelectedWeekRange] = useState(null);
  const [editingExpenseSourceId, setEditingExpenseSourceId] = useState(null);
  const [editingIncomeSourceId, setEditingIncomeSourceId] = useState(null);
  const [activePlannerTab, setActivePlannerTab] = useState('income');
  const [activePage, setActivePage] = useState('planner');
  const [expenseChartPeriod, setExpenseChartPeriod] = useState('monthly');
  const [incomeChartPeriod, setIncomeChartPeriod] = useState('monthly');
  const [netSnapshotPeriod, setNetSnapshotPeriod] = useState('monthly');
  const [isExpenseHistoryOpen, setIsExpenseHistoryOpen] = useState(false);
  const [isIncomeHistoryOpen, setIsIncomeHistoryOpen] = useState(false);
  const [user, setUser] = useState(() => readStoredAuthSession());
  const [message, setMessage] = useState('');
  const [budgetMessage, setBudgetMessage] = useState('');
  const [expenseMessage, setExpenseMessage] = useState('');
  const [goalMessage, setGoalMessage] = useState('');
  const [incomeMessage, setIncomeMessage] = useState('');
  const [profileForm, setProfileForm] = useState({
    dateOfBirth: '',
    email: '',
    firstName: '',
    lastName: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [isSavingBudgetLimit, setIsSavingBudgetLimit] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hasAppliedEstimate, setHasAppliedEstimate] = useState(false);
  const [unconfirmedExpensePayments, setUnconfirmedExpensePayments] = useState([]);
  const [unconfirmedIncomePayments, setUnconfirmedIncomePayments] = useState([]);

  return {
    activePage,
    activePlannerTab,
    authMode,
    budgetCategories,
    budgetCategoryForm,
    budgetGoalForm,
    budgetGoals,
    budgetMessage,
    confirmedExpensePayments,
    confirmedIncomePayments,
    currentMonthEnd,
    currentMonthStart,
    editingExpenseSourceId,
    editingGoalId,
    editingIncomeSourceId,
    expenseChartPeriod,
    expenseForm,
    expenseMessage,
    expenseSources,
    finalMonthStart,
    formData,
    goalMessage,
    hasAppliedEstimate,
    incomeChartPeriod,
    incomeForm,
    incomeMessage,
    incomeSources,
    isEditingProfile,
    isExpenseHistoryOpen,
    isIncomeHistoryOpen,
    isSavingBudgetLimit,
    isSavingExpense,
    isSavingIncome,
    isSavingProfile,
    isSubmitting,
    message,
    netSnapshotPeriod,
    profileForm,
    profileMessage,
    selectedDay,
    selectedMonth,
    selectedMonthRange,
    selectedWeekRange,
    setActivePage,
    setActivePlannerTab,
    setAuthMode,
    setBudgetCategories,
    setBudgetCategoryForm,
    setBudgetGoalForm,
    setBudgetGoals,
    setBudgetMessage,
    setConfirmedExpensePayments,
    setConfirmedIncomePayments,
    setEditingExpenseSourceId,
    setEditingGoalId,
    setEditingIncomeSourceId,
    setExpenseChartPeriod,
    setExpenseForm,
    setExpenseMessage,
    setExpenseSources,
    setFormData,
    setGoalMessage,
    setHasAppliedEstimate,
    setIncomeChartPeriod,
    setIncomeForm,
    setIncomeMessage,
    setIncomeSources,
    setIsEditingProfile,
    setIsExpenseHistoryOpen,
    setIsIncomeHistoryOpen,
    setIsSavingBudgetLimit,
    setIsSavingExpense,
    setIsSavingIncome,
    setIsSavingProfile,
    setIsSubmitting,
    setMessage,
    setNetSnapshotPeriod,
    setProfileForm,
    setProfileMessage,
    setSelectedDay,
    setSelectedMonth,
    setSelectedMonthRange,
    setSelectedWeekRange,
    setUnconfirmedExpensePayments,
    setUnconfirmedIncomePayments,
    setUser,
    today,
    unconfirmedExpensePayments,
    unconfirmedIncomePayments,
    user,
    yearEnd,
  };
}
