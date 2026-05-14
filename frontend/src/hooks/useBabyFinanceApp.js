import { useEffect, useMemo, useState } from 'react';
import {
  apiBaseUrl,
  addMonths,
  authStorageKey,
  buildBreakdown,
  buildCalendarDays,
  buildCalendarWeeks,
  buildDiscretionarySavingsItems,
  buildExpenseBreakdown,
  buildNetSnapshotItems,
  buildPieGradient,
  buildSpendingTypeSnapshotItems,
  createDefaultBudgetForm,
  createDefaultExpenseForm,
  createDefaultGoalForm,
  createDefaultIncomeForm,
  emptyAuthForm,
  expenseCategoryOptions,
  formatChartTooltip,
  formatDateInput,
  formatLongDate,
  getConfirmedExpenseStorageKey,
  getConfirmedIncomeStorageKey,
  getExpensePaymentKey,
  getGoalCalendarItems,
  getGoalPaymentKey,
  getGoalsStorageKey,
  getIncomePaymentKey,
  getMonthStart,
  getOccurrencesForExpenseSource,
  getOccurrencesForIncomeSource,
  getUnconfirmedExpenseStorageKey,
  getUnconfirmedIncomeStorageKey,
  getWorkWeekRange,
  isDateInRange,
  isGoalCashEvent,
  isGoalPaidOff,
  isPaymentConfirmed,
  isSameDay,
  normalizeBudgetCategory,
  normalizeExpenseSource,
  normalizeIncomeSource,
  parseLocalDate,
  readStoredAuthSession,
  readStoredGoals,
  readStoredList,
  starterGoals,
} from '../lib/budgetHelpers.js';

export function useBabyFinanceApp() {
  const today = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const currentMonthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  const yearEnd = useMemo(() => new Date(today.getFullYear(), 11, 31), [today]);
  const finalMonthStart = useMemo(() => new Date(today.getFullYear(), 11, 1), [today]);
  const workWeek = useMemo(() => getWorkWeekRange(today), [today]);

  const [authMode, setAuthMode] = useState('login');
  const [budgetCategoryForm, setBudgetCategoryForm] = useState(createDefaultBudgetForm());
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [formData, setFormData] = useState(emptyAuthForm);
  const [budgetGoalForm, setBudgetGoalForm] = useState(createDefaultGoalForm(today));
  const [budgetGoals, setBudgetGoals] = useState(starterGoals);
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
  const [isExpenseHistoryOpen, setIsExpenseHistoryOpen] = useState(false);
  const [isIncomeHistoryOpen, setIsIncomeHistoryOpen] = useState(false);
  const [user, setUser] = useState(() => readStoredAuthSession());
  const [message, setMessage] = useState('');
  const [budgetMessage, setBudgetMessage] = useState('');
  const [expenseMessage, setExpenseMessage] = useState('');
  const [goalMessage, setGoalMessage] = useState('');
  const [incomeMessage, setIncomeMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [isSavingBudgetLimit, setIsSavingBudgetLimit] = useState(false);
  const [hasAppliedEstimate, setHasAppliedEstimate] = useState(false);
  const [unconfirmedExpensePayments, setUnconfirmedExpensePayments] = useState([]);
  const [unconfirmedIncomePayments, setUnconfirmedIncomePayments] = useState([]);

  const accountStartMonth = useMemo(
    () => (user?.createdAt ? getMonthStart(user.createdAt) : currentMonthStart),
    [currentMonthStart, user],
  );

  const displayedMonthEnd = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0),
    [selectedMonth],
  );
  const displayedMonthLabel = selectedMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const currentMonthLabel = today.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const canGoToPreviousMonth = selectedMonth > accountStartMonth;
  const canGoToNextMonth = selectedMonth < finalMonthStart;

  const currentMonthIncome = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getOccurrencesForIncomeSource(incomeSource, today, currentMonthEnd),
      ),
    [currentMonthEnd, incomeSources, today],
  );
  const currentMonthExpenses = useMemo(
    () =>
      expenseSources.flatMap((expenseSource) =>
        getOccurrencesForExpenseSource(expenseSource, today, currentMonthEnd),
      ),
    [currentMonthEnd, expenseSources, today],
  );
  const workWeekIncome = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getOccurrencesForIncomeSource(incomeSource, workWeek.start, workWeek.end),
      ),
    [incomeSources, workWeek.end, workWeek.start],
  );
  const workWeekExpenses = useMemo(
    () =>
      expenseSources.flatMap((expenseSource) =>
        getOccurrencesForExpenseSource(expenseSource, workWeek.start, workWeek.end),
      ),
    [expenseSources, workWeek.end, workWeek.start],
  );
  const yearIncome = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getOccurrencesForIncomeSource(incomeSource, today, yearEnd),
      ),
    [incomeSources, today, yearEnd],
  );
  const yearExpenses = useMemo(
    () =>
      expenseSources.flatMap((expenseSource) =>
        getOccurrencesForExpenseSource(expenseSource, today, yearEnd),
      ),
    [expenseSources, today, yearEnd],
  );
  const displayedMonthIncome = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getOccurrencesForIncomeSource(incomeSource, selectedMonth, displayedMonthEnd),
      ),
    [displayedMonthEnd, incomeSources, selectedMonth],
  );
  const displayedMonthExpenses = useMemo(
    () =>
      expenseSources.flatMap((expenseSource) =>
        getOccurrencesForExpenseSource(expenseSource, selectedMonth, displayedMonthEnd),
      ),
    [displayedMonthEnd, expenseSources, selectedMonth],
  );
  const selectedDayIncome = useMemo(
    () =>
      selectedDay ? displayedMonthIncome.filter((income) => isSameDay(income.date, selectedDay)) : [],
    [displayedMonthIncome, selectedDay],
  );
  const selectedDayExpenses = useMemo(
    () =>
      selectedDay ? displayedMonthExpenses.filter((expense) => isSameDay(expense.date, selectedDay)) : [],
    [displayedMonthExpenses, selectedDay],
  );
  const displayedMonthGoals = useMemo(
    () => getGoalCalendarItems(budgetGoals, selectedMonth, displayedMonthEnd, today),
    [budgetGoals, displayedMonthEnd, selectedMonth, today],
  );
  const selectedDayGoals = useMemo(
    () => selectedDay ? displayedMonthGoals.filter((goal) => isSameDay(goal.date, selectedDay)) : [],
    [displayedMonthGoals, selectedDay],
  );
  const currentMonthGoals = useMemo(
    () => getGoalCalendarItems(budgetGoals, today, currentMonthEnd, today),
    [budgetGoals, currentMonthEnd, today],
  );
  const workWeekGoals = useMemo(
    () => getGoalCalendarItems(budgetGoals, workWeek.start, workWeek.end, today),
    [budgetGoals, today, workWeek.end, workWeek.start],
  );
  const yearGoals = useMemo(
    () => getGoalCalendarItems(budgetGoals, today, yearEnd, today),
    [budgetGoals, today, yearEnd],
  );
  const workWeekTotal = workWeekIncome.reduce((total, income) => total + income.amount, 0);
  const workWeekExpenseTotal = workWeekExpenses.reduce((total, expense) => total + expense.amount, 0);
  const selectedDayTotal = selectedDayIncome.reduce((total, income) => total + income.amount, 0);
  const selectedDayExpenseTotal = selectedDayExpenses.reduce((total, expense) => total + expense.amount, 0);
  const currentMonthTotal = currentMonthIncome.reduce((total, income) => total + income.amount, 0);
  const currentMonthExpenseTotal = currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  const yearTotal = yearIncome.reduce((total, income) => total + income.amount, 0);
  const yearExpenseTotal = yearExpenses.reduce((total, expense) => total + expense.amount, 0);
  const displayedMonthTotal = displayedMonthIncome.reduce((total, income) => total + income.amount, 0);
  const displayedMonthExpenseTotal = displayedMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  const workWeekGoalTotal = workWeekGoals.reduce((total, goal) => total + (isGoalCashEvent(goal) ? goal.amount : 0), 0);
  const currentMonthGoalTotal = currentMonthGoals.reduce((total, goal) => total + (isGoalCashEvent(goal) ? goal.amount : 0), 0);
  const yearGoalTotal = yearGoals.reduce((total, goal) => total + (isGoalCashEvent(goal) ? goal.amount : 0), 0);
  const displayedMonthGoalTotal = displayedMonthGoals.reduce((total, goal) => total + (isGoalCashEvent(goal) ? goal.amount : 0), 0);
  const workWeekNetTotal = workWeekTotal - workWeekExpenseTotal - workWeekGoalTotal;
  const currentMonthNetTotal = currentMonthTotal - currentMonthExpenseTotal - currentMonthGoalTotal;
  const yearNetTotal = yearTotal - yearExpenseTotal - yearGoalTotal;
  const displayedMonthNetTotal = displayedMonthTotal - displayedMonthExpenseTotal - displayedMonthGoalTotal;
  const getActualIncomeTotal = (incomeItems) =>
    incomeItems
      .filter((income) =>
        isPaymentConfirmed(getIncomePaymentKey(income), income.date, confirmedIncomePayments, unconfirmedIncomePayments, today),
      )
      .reduce((total, income) => total + income.amount, 0);
  const getActualExpenseTotal = (expenseItems) =>
    expenseItems
      .filter((expense) =>
        isPaymentConfirmed(getExpensePaymentKey(expense), expense.date, confirmedExpensePayments, unconfirmedExpensePayments, today),
      )
      .reduce((total, expense) => total + expense.amount, 0);
  const getActualGoalTotal = (goalItems) =>
    goalItems
      .filter((goal) => goal.type === 'payment')
      .reduce((total, goal) => total + goal.amount, 0);
  const workWeekActualIncomeTotal = getActualIncomeTotal(workWeekIncome);
  const workWeekActualExpenseTotal = getActualExpenseTotal(workWeekExpenses);
  const workWeekActualGoalTotal = getActualGoalTotal(workWeekGoals);
  const workWeekActualNetTotal = workWeekActualIncomeTotal - workWeekActualExpenseTotal - workWeekActualGoalTotal;
  const currentMonthActualIncomeTotal = getActualIncomeTotal(currentMonthIncome);
  const currentMonthActualExpenseTotal = getActualExpenseTotal(currentMonthExpenses);
  const currentMonthActualGoalTotal = getActualGoalTotal(currentMonthGoals);
  const currentMonthActualNetTotal = currentMonthActualIncomeTotal - currentMonthActualExpenseTotal - currentMonthActualGoalTotal;
  const yearActualIncomeTotal = getActualIncomeTotal(yearIncome);
  const yearActualExpenseTotal = getActualExpenseTotal(yearExpenses);
  const yearActualGoalTotal = getActualGoalTotal(yearGoals);
  const yearActualNetTotal = yearActualIncomeTotal - yearActualExpenseTotal - yearActualGoalTotal;
  const displayedMonthActualIncomeTotal = getActualIncomeTotal(displayedMonthIncome);
  const displayedMonthActualExpenseTotal = getActualExpenseTotal(displayedMonthExpenses);
  const displayedMonthActualGoalTotal = getActualGoalTotal(displayedMonthGoals);
  const displayedMonthActualNetTotal = displayedMonthActualIncomeTotal - displayedMonthActualExpenseTotal - displayedMonthActualGoalTotal;
  const currentMonthAvailableToBudget = currentMonthTotal - currentMonthExpenseTotal - currentMonthGoalTotal;
  const displayedMonthEssentialExpenseTotal = displayedMonthExpenses
    .filter((expense) => expense.spendingType === 'essential' || expense.spendingType === 'priority')
    .reduce((total, expense) => total + expense.amount, 0);
  const displayedMonthDiscretionaryExpenseTotal = displayedMonthExpenses
    .filter((expense) => expense.spendingType === 'discretionary')
    .reduce((total, expense) => total + expense.amount, 0);
  const displayedMonthSpendingTypeTotal = displayedMonthExpenseTotal + displayedMonthGoalTotal;
  const discretionarySavingsItems = useMemo(
    () => buildDiscretionarySavingsItems(displayedMonthExpenses),
    [displayedMonthExpenses],
  );
  const displayedMonthExpenseByCategory = useMemo(() => {
    const totals = new Map();

    displayedMonthExpenses.forEach((expense) => {
      totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
    });

    return totals;
  }, [displayedMonthExpenses]);
  const budgetCategoryOptions = useMemo(() => {
    const categoryNames = new Set(
      expenseCategoryOptions
        .filter((option) => option.value !== 'custom')
        .map((option) => option.value),
    );

    expenseSources.forEach((expenseSource) => {
      if (expenseSource.category) {
        categoryNames.add(expenseSource.category);
      }
    });

    budgetCategories.forEach((category) => {
      if (category.name) {
        categoryNames.add(category.name);
      }
    });

    return Array.from(categoryNames).sort((firstName, secondName) =>
      firstName.localeCompare(secondName),
    );
  }, [budgetCategories, expenseSources]);
  const budgetCategorySummaries = budgetCategories.map((category) => {
    const spent = displayedMonthExpenseByCategory.get(category.name) || 0;
    const limit = Number(category.limit);

    return {
      ...category,
      isOverBudget: spent > limit,
      limit,
      remaining: limit - spent,
      spent,
    };
  });
  const overBudgetCategories = budgetCategorySummaries.filter((category) => category.isOverBudget);
  const activeGoals = budgetGoals.filter((goal) => !isGoalPaidOff(goal));
  const completedGoals = budgetGoals.filter(isGoalPaidOff);
  const nextPayday = currentMonthIncome[0] || yearIncome[0] || null;
  const nextBillDue = currentMonthExpenses[0] || yearExpenses[0] || null;
  const closestActiveGoal = activeGoals
    .sort((firstGoal, secondGoal) => parseLocalDate(firstGoal.targetDate) - parseLocalDate(secondGoal.targetDate))[0] || null;
  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonth, displayedMonthIncome, displayedMonthExpenses, displayedMonthGoals, today),
    [displayedMonthExpenses, displayedMonthGoals, displayedMonthIncome, selectedMonth, today],
  );
  const calendarWeeks = useMemo(() => buildCalendarWeeks(calendarDays), [calendarDays]);
  const selectedWeekIncome = useMemo(
    () =>
      selectedWeekRange
        ? displayedMonthIncome.filter((income) =>
            isDateInRange(income.date, selectedWeekRange.start, selectedWeekRange.end),
          )
        : [],
    [displayedMonthIncome, selectedWeekRange],
  );
  const selectedWeekExpenses = useMemo(
    () =>
      selectedWeekRange
        ? displayedMonthExpenses.filter((expense) =>
            isDateInRange(expense.date, selectedWeekRange.start, selectedWeekRange.end),
          )
        : [],
    [displayedMonthExpenses, selectedWeekRange],
  );
  const selectedWeekGoals = useMemo(
    () =>
      selectedWeekRange
        ? displayedMonthGoals.filter((goal) =>
            isDateInRange(goal.date, selectedWeekRange.start, selectedWeekRange.end),
          )
        : [],
    [displayedMonthGoals, selectedWeekRange],
  );
  const detailIncome = selectedMonthRange
    ? displayedMonthIncome
    : selectedWeekRange
      ? selectedWeekIncome
      : selectedDayIncome;
  const detailExpenses = selectedMonthRange
    ? displayedMonthExpenses
    : selectedWeekRange
      ? selectedWeekExpenses
      : selectedDayExpenses;
  const detailGoals = selectedMonthRange
    ? displayedMonthGoals
    : selectedWeekRange
      ? selectedWeekGoals
      : selectedDayGoals;
  const detailSelectionLabel = selectedMonthRange
    ? displayedMonthLabel
    : selectedWeekRange
    ? `${formatLongDate(selectedWeekRange.start)} to ${formatLongDate(selectedWeekRange.end)}`
    : selectedDay
      ? formatLongDate(selectedDay)
      : 'No Day Selected';
  const hasDetailSelection = Boolean(selectedDay || selectedWeekRange || selectedMonthRange);
  const detailGoalTotal = detailGoals.reduce((total, goal) => total + (isGoalCashEvent(goal) ? goal.amount : 0), 0);
  const detailNetTotal = detailIncome.reduce((total, income) => total + income.amount, 0)
    - detailExpenses.reduce((total, expense) => total + expense.amount, 0)
    - detailGoalTotal;
  const detailActualIncomeTotal = detailIncome
    .filter((income) =>
      isPaymentConfirmed(getIncomePaymentKey(income), income.date, confirmedIncomePayments, unconfirmedIncomePayments, today),
    )
    .reduce((total, income) => total + income.amount, 0);
  const detailActualExpenseTotal = detailExpenses
    .filter((expense) =>
      isPaymentConfirmed(getExpensePaymentKey(expense), expense.date, confirmedExpensePayments, unconfirmedExpensePayments, today),
    )
    .reduce((total, expense) => total + expense.amount, 0);
  const detailActualGoalTotal = detailGoals
    .filter((goal) => goal.type === 'payment')
    .reduce((total, goal) => total + goal.amount, 0);
  const detailActualNetTotal = detailActualIncomeTotal - detailActualExpenseTotal - detailActualGoalTotal;
  const canAllocateGoalNet = Boolean(selectedWeekRange || selectedMonthRange) && detailNetTotal > 0;
  const allocationLabel = selectedMonthRange ? 'month' : 'week';
  const chartIncome = incomeChartPeriod === 'weekly'
    ? workWeekIncome
    : incomeChartPeriod === 'yearly'
      ? yearIncome
      : displayedMonthIncome;
  const chartExpenses = expenseChartPeriod === 'weekly'
    ? workWeekExpenses
    : expenseChartPeriod === 'yearly'
      ? yearExpenses
      : displayedMonthExpenses;
  const chartGoalPayments = expenseChartPeriod === 'weekly'
    ? workWeekGoals
    : expenseChartPeriod === 'yearly'
      ? yearGoals
      : displayedMonthGoals;
  const chartExpenseItems = useMemo(
    () => [
      ...chartExpenses,
      ...chartGoalPayments
        .filter(isGoalCashEvent)
        .map((goal) => ({
          amount: goal.amount,
          category: 'Goals',
          date: goal.date,
          name: goal.name,
          spendingType: 'goal',
          type: goal.type,
        })),
    ],
    [chartExpenses, chartGoalPayments],
  );
  const chartIncomeTotal = chartIncome.reduce((total, income) => total + income.amount, 0);
  const chartExpenseTotal = chartExpenseItems.reduce((total, expense) => total + expense.amount, 0);
  const chartConfirmedIncomeTotal = chartIncome
    .filter((income) =>
      isPaymentConfirmed(getIncomePaymentKey(income), income.date, confirmedIncomePayments, unconfirmedIncomePayments, today),
    )
    .reduce((total, income) => total + income.amount, 0);
  const chartConfirmedExpenseTotal = chartExpenseItems
    .filter((expense) =>
      expense.spendingType === 'goal'
        ? expense.type === 'payment'
        : isPaymentConfirmed(getExpensePaymentKey(expense), expense.date, confirmedExpensePayments, unconfirmedExpensePayments, today),
    )
    .reduce((total, expense) => total + expense.amount, 0);
  const chartEssentialExpenseTotal = chartExpenses
    .filter((expense) => expense.spendingType === 'essential' || expense.spendingType === 'priority')
    .reduce((total, expense) => total + expense.amount, 0);
  const chartDiscretionaryExpenseTotal = chartExpenseItems
    .filter((expense) => expense.spendingType === 'discretionary' || expense.spendingType === 'goal')
    .reduce((total, expense) => total + expense.amount, 0);
  const chartPeriodLabels = {
    monthly: displayedMonthLabel,
    weekly: `${formatLongDate(workWeek.start)} to ${formatLongDate(workWeek.end)}`,
    yearly: `through ${formatLongDate(yearEnd)}`,
  };
  const selectedIncomeBreakdown = useMemo(
    () => buildBreakdown(chartIncome),
    [chartIncome],
  );
  const selectedExpenseBreakdown = useMemo(
    () => buildExpenseBreakdown(chartExpenseItems),
    [chartExpenseItems],
  );
  const selectedMonthPie = useMemo(
    () => buildPieGradient(selectedIncomeBreakdown),
    [selectedIncomeBreakdown],
  );
  const expensePie = useMemo(
    () => buildPieGradient(selectedExpenseBreakdown, '#edf2f7'),
    [selectedExpenseBreakdown],
  );
  const expenseTypePie = useMemo(
    () =>
      buildPieGradient(
        buildSpendingTypeSnapshotItems(chartEssentialExpenseTotal, chartDiscretionaryExpenseTotal),
        '#edf2f7',
      ),
    [chartDiscretionaryExpenseTotal, chartEssentialExpenseTotal],
  );
  const incomePieTooltip = useMemo(
    () => formatChartTooltip(selectedIncomeBreakdown),
    [selectedIncomeBreakdown],
  );
  const expensePieTooltip = useMemo(
    () => formatChartTooltip(selectedExpenseBreakdown),
    [selectedExpenseBreakdown],
  );
  const netSnapshotItems = useMemo(
    () => buildNetSnapshotItems(displayedMonthTotal, displayedMonthExpenseTotal, displayedMonthGoalTotal),
    [displayedMonthExpenseTotal, displayedMonthGoalTotal, displayedMonthTotal],
  );
  const netSnapshotTooltip = useMemo(
    () => formatChartTooltip(netSnapshotItems),
    [netSnapshotItems],
  );
  const netSnapshotPie = useMemo(
    () => buildPieGradient(netSnapshotItems, '#edf2f7'),
    [netSnapshotItems],
  );
  const spendingTypeSnapshotItems = useMemo(
    () =>
      buildSpendingTypeSnapshotItems(
        displayedMonthEssentialExpenseTotal,
        displayedMonthDiscretionaryExpenseTotal + displayedMonthGoalTotal,
      ),
    [displayedMonthDiscretionaryExpenseTotal, displayedMonthEssentialExpenseTotal, displayedMonthGoalTotal],
  );
  const spendingTypeSnapshotPie = useMemo(
    () => buildPieGradient(spendingTypeSnapshotItems, '#edf2f7'),
    [spendingTypeSnapshotItems],
  );
  const spendingTypeTooltip = useMemo(
    () => formatChartTooltip(spendingTypeSnapshotItems),
    [spendingTypeSnapshotItems],
  );

  const isEstimateVisible = incomeForm.useTaxEstimate;
  const estimatedGrossPay = !incomeForm.useTaxEstimate
    ? 0
    : incomeForm.compensationType === 'salaried'
      ? Number(incomeForm.grossAmount || 0)
      : Number(incomeForm.hourlyRate || 0) * Number(incomeForm.hoursPerPeriod || 0);
  const estimatedNetPay = estimatedGrossPay * (1 - Number(incomeForm.estimatedTaxRate || 0) / 100);
  const userId = user?.id;

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
  }, [userId]);

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
  }, [userId]);

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
  }, [userId]);

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
  }, [userId]);

  useEffect(() => {
    setBudgetGoals(readStoredGoals(userId));
    setConfirmedExpensePayments(readStoredList(userId, getConfirmedExpenseStorageKey, []));
    setConfirmedIncomePayments(readStoredList(userId, getConfirmedIncomeStorageKey, []));
    setUnconfirmedExpensePayments(readStoredList(userId, getUnconfirmedExpenseStorageKey, []));
    setUnconfirmedIncomePayments(readStoredList(userId, getUnconfirmedIncomeStorageKey, []));
  }, [userId]);

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
  }, [budgetCategoryForm.name, budgetCategoryOptions]);

  const handleChange = (event) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleBudgetGoalChange = (event) => {
    setBudgetGoalForm((currentGoalForm) => ({
      ...currentGoalForm,
      [event.target.name]: event.target.value,
      ...(event.target.name === 'contributionFrequency' && event.target.value === 'one_time'
        ? {
            firstContributionDate: currentGoalForm.firstContributionDate || currentGoalForm.targetDate,
          }
        : {}),
    }));
  };

  const handleBudgetCategoryChange = (event) => {
    setBudgetCategoryForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const handleBudgetCategorySubmit = async (event) => {
    event.preventDefault();
    setBudgetMessage('');

    if (!user?.id) {
      setBudgetMessage('Log in before saving a monthly limit.');
      return;
    }

    if (!budgetCategoryForm.name) {
      setBudgetMessage('Choose a category before saving a monthly limit.');
      return;
    }

    if (Number(budgetCategoryForm.limit) <= 0) {
      setBudgetMessage('Monthly limit must be greater than 0.');
      return;
    }

    setIsSavingBudgetLimit(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${user.id}/budget-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: budgetCategoryForm.limit,
          name: budgetCategoryForm.name,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save monthly limit.');
      }

      const savedCategory = normalizeBudgetCategory(data);

      setBudgetCategories((currentCategories) =>
        [
          ...currentCategories.filter(
            (category) => category.id !== savedCategory.id && category.name !== savedCategory.name,
          ),
          savedCategory,
        ].sort((firstCategory, secondCategory) => firstCategory.name.localeCompare(secondCategory.name)),
      );
      setBudgetCategoryForm(createDefaultBudgetForm());
    } catch (error) {
      setBudgetMessage(error.message);
    } finally {
      setIsSavingBudgetLimit(false);
    }
  };

  const handleDeleteBudgetCategory = async (categoryId) => {
    if (!user?.id) {
      setBudgetMessage('Log in before deleting a monthly limit.');
      return;
    }

    setBudgetMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${user.id}/budget-categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Could not delete monthly limit.');
      }

      setBudgetCategories((currentCategories) =>
        currentCategories.filter((category) => category.id !== categoryId),
      );
    } catch (error) {
      setBudgetMessage(error.message);
    }
  };

  const toggleIncomeConfirmation = (income) => {
    const paymentKey = getIncomePaymentKey(income);
    const isConfirmed = isPaymentConfirmed(
      paymentKey,
      income.date,
      confirmedIncomePayments,
      unconfirmedIncomePayments,
      today,
    );

    if (isConfirmed) {
      setConfirmedIncomePayments((currentPayments) =>
        currentPayments.filter((currentPayment) => currentPayment !== paymentKey),
      );
      setUnconfirmedIncomePayments((currentPayments) =>
        currentPayments.includes(paymentKey) ? currentPayments : [...currentPayments, paymentKey],
      );
    } else {
      setUnconfirmedIncomePayments((currentPayments) =>
        currentPayments.filter((currentPayment) => currentPayment !== paymentKey),
      );
      setConfirmedIncomePayments((currentPayments) =>
        currentPayments.includes(paymentKey) ? currentPayments : [...currentPayments, paymentKey],
      );
    }
  };

  const toggleExpenseConfirmation = (expense) => {
    const paymentKey = getExpensePaymentKey(expense);
    const isConfirmed = isPaymentConfirmed(
      paymentKey,
      expense.date,
      confirmedExpensePayments,
      unconfirmedExpensePayments,
      today,
    );

    if (isConfirmed) {
      setConfirmedExpensePayments((currentPayments) =>
        currentPayments.filter((currentPayment) => currentPayment !== paymentKey),
      );
      setUnconfirmedExpensePayments((currentPayments) =>
        currentPayments.includes(paymentKey) ? currentPayments : [...currentPayments, paymentKey],
      );
    } else {
      setUnconfirmedExpensePayments((currentPayments) =>
        currentPayments.filter((currentPayment) => currentPayment !== paymentKey),
      );
      setConfirmedExpensePayments((currentPayments) =>
        currentPayments.includes(paymentKey) ? currentPayments : [...currentPayments, paymentKey],
      );
    }
  };

  const handleBudgetGoalSubmit = (event) => {
    event.preventDefault();
    setGoalMessage('');

    if (!budgetGoalForm.name.trim()) {
      setGoalMessage('Give the goal a name before saving it.');
      return;
    }

    if (Number(budgetGoalForm.targetAmount) <= 0) {
      setGoalMessage('Goal target must be greater than 0.');
      return;
    }

    if (Number(budgetGoalForm.currentAmount || 0) < 0) {
      setGoalMessage('Already saved cannot be negative.');
      return;
    }

    if (Number(budgetGoalForm.currentAmount || 0) > Number(budgetGoalForm.targetAmount)) {
      setGoalMessage('Already saved should not be higher than the goal target.');
      return;
    }

    if (!budgetGoalForm.targetDate || !budgetGoalForm.firstContributionDate) {
      setGoalMessage('Choose the goal date and the payment date before saving.');
      return;
    }

    if (Number(budgetGoalForm.contributionAmount || 0) < 0) {
      setGoalMessage('Planned payment cannot be negative.');
      return;
    }

    if (
      budgetGoalForm.contributionFrequency === 'one_time' &&
      Number(budgetGoalForm.contributionAmount || 0) > 0 &&
      Number(budgetGoalForm.contributionAmount || 0) < Number(budgetGoalForm.targetAmount) - Number(budgetGoalForm.currentAmount || 0)
    ) {
      setGoalMessage('For a one-time goal payment, plan enough to cover the remaining amount or leave planned payment blank.');
      return;
    }

    const goalData = {
      contributionAmount: Number(budgetGoalForm.contributionAmount || 0),
      contributionFrequency: budgetGoalForm.contributionFrequency,
      currentAmount: Number(budgetGoalForm.currentAmount || 0),
      firstContributionDate: budgetGoalForm.firstContributionDate,
      name: budgetGoalForm.name.trim(),
      targetAmount: Number(budgetGoalForm.targetAmount),
      targetDate: budgetGoalForm.targetDate,
    };
    const submittedGoalIsPaidOff = goalData.currentAmount >= goalData.targetAmount;

    if (editingGoalId) {
      setBudgetGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === editingGoalId
            ? {
                ...goal,
                ...goalData,
                completedAt: submittedGoalIsPaidOff ? goal.completedAt || formatDateInput(today) : '',
              }
            : goal,
        ),
      );
      setEditingGoalId(null);
    } else {
      setBudgetGoals((currentGoals) => [
        ...currentGoals,
        {
          ...goalData,
          completedAt: submittedGoalIsPaidOff ? formatDateInput(today) : '',
          id: Date.now(),
          payments: [],
        },
      ]);
    }

    setBudgetGoalForm(createDefaultGoalForm(today));
  };

  const resetGoalEditor = () => {
    setEditingGoalId(null);
    setBudgetGoalForm(createDefaultGoalForm(today));
    setGoalMessage('');
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setBudgetGoalForm(
      createDefaultGoalForm(today, {
        contributionAmount: String(goal.contributionAmount || ''),
        contributionFrequency: goal.contributionFrequency || 'weekly',
        currentAmount: String(goal.currentAmount || ''),
        firstContributionDate: goal.firstContributionDate || formatDateInput(today),
        name: goal.name,
        targetAmount: String(goal.targetAmount || ''),
        targetDate: goal.targetDate,
      }),
    );
  };

  const addGoalPayment = (goalId, amount, date, note) => {
    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      return;
    }

    setBudgetGoals((currentGoals) =>
      currentGoals.map((goal) => {
        if (goal.id !== goalId) {
          return goal;
        }

        const remainingAmount = Math.max(Number(goal.targetAmount) - Number(goal.currentAmount || 0), 0);
        const appliedAmount = Math.min(paymentAmount, remainingAmount);
        const nextCurrentAmount = Number(goal.currentAmount || 0) + appliedAmount;
        const isNowPaidOff = nextCurrentAmount >= Number(goal.targetAmount || 0);

        if (appliedAmount <= 0) {
          return goal;
        }

        return {
          ...goal,
          completedAt: isNowPaidOff && !goal.completedAt ? formatDateInput(date) : goal.completedAt,
          currentAmount: nextCurrentAmount,
          payments: [
            ...(goal.payments || []),
            {
              amount: appliedAmount,
              date: formatDateInput(date),
              id: Date.now(),
              note,
              paymentKey: getGoalPaymentKey(goal.id, date),
            },
          ],
        };
      }),
    );
  };

  const handleConfirmGoalPayment = (goalEvent) => {
    addGoalPayment(goalEvent.id, goalEvent.amount, goalEvent.date, 'Scheduled contribution');
  };

  const handleUnconfirmGoalPayment = (goalEvent) => {
    setBudgetGoals((currentGoals) =>
      currentGoals.map((goal) => {
        if (goal.id !== goalEvent.id) {
          return goal;
        }

        const payment = (goal.payments || []).find((goalPayment) => goalPayment.id === goalEvent.paymentId);

        if (!payment) {
          return goal;
        }

        const nextCurrentAmount = Math.max(Number(goal.currentAmount || 0) - Number(payment.amount), 0);

        return {
          ...goal,
          completedAt: nextCurrentAmount >= Number(goal.targetAmount || 0) ? goal.completedAt : '',
          currentAmount: nextCurrentAmount,
          payments: (goal.payments || []).filter((goalPayment) => goalPayment.id !== goalEvent.paymentId),
        };
      }),
    );
  };

  const handleAllocateGoalNet = (goal) => {
    addGoalPayment(goal.id, detailNetTotal, selectedMonthRange ? selectedMonthRange.end : selectedWeekRange.end, `Allocated ${allocationLabel} net pay`);
  };

  const handleDeleteGoal = (goal) => {
    const shouldDelete = globalThis.confirm(`Delete ${goal.name}?`);

    if (!shouldDelete) {
      return;
    }

    setBudgetGoals((currentGoals) => currentGoals.filter((currentGoal) => currentGoal.id !== goal.id));
  };

  const handleIncomeChange = (event) => {
    const nextValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setHasAppliedEstimate(false);

    setIncomeForm((currentIncomeForm) => {
      const nextIncomeForm = {
        ...currentIncomeForm,
        [event.target.name]: nextValue,
      };

      if (event.target.name === 'useTaxEstimate' && !nextValue) {
        nextIncomeForm.amount =
          estimatedNetPay > 0 ? estimatedNetPay.toFixed(2) : currentIncomeForm.amount;
        nextIncomeForm.grossAmount = '';
        nextIncomeForm.hourlyRate = '';
        nextIncomeForm.hoursPerPeriod = '';
        nextIncomeForm.estimatedTaxRate = '18';
      }

      if (event.target.name === 'compensationType' && nextValue === 'salaried') {
        nextIncomeForm.hourlyRate = '';
        nextIncomeForm.hoursPerPeriod = '';
      }

      if (event.target.name === 'compensationType' && nextValue === 'hourly') {
        nextIncomeForm.grossAmount = '';
      }

      return nextIncomeForm;
    });
  };

  const handleExpenseChange = (event) => {
    setExpenseForm((currentExpenseForm) => {
      const nextExpenseForm = {
        ...currentExpenseForm,
        [event.target.name]: event.target.value,
      };

      if (event.target.name === 'category') {
        const selectedCategory = expenseCategoryOptions.find((option) => option.value === event.target.value);

        if (selectedCategory && selectedCategory.value !== 'custom') {
          nextExpenseForm.customCategory = '';
          nextExpenseForm.spendingType = selectedCategory.type;
        }
      }

      return nextExpenseForm;
    });
  };

  const handleEstimateToggle = () => {
    setHasAppliedEstimate(false);
    setIncomeForm((currentIncomeForm) => {
      if (currentIncomeForm.useTaxEstimate) {
        return {
          ...currentIncomeForm,
          amount: estimatedNetPay > 0 ? estimatedNetPay.toFixed(2) : currentIncomeForm.amount,
          grossAmount: '',
          estimatedTaxRate: '18',
          hourlyRate: '',
          hoursPerPeriod: '',
          useTaxEstimate: false,
        };
      }

      return {
        ...currentIncomeForm,
        useTaxEstimate: true,
      };
    });
  };

  const resetIncomeEditor = () => {
    setEditingIncomeSourceId(null);
    setIncomeForm(createDefaultIncomeForm(today));
    setIncomeMessage('');
    setHasAppliedEstimate(false);
  };

  const resetExpenseEditor = () => {
    setEditingExpenseSourceId(null);
    setExpenseForm(createDefaultExpenseForm(today));
    setExpenseMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (!formData.email.trim() || !formData.password) {
      setMessage('Email and password are required.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setMessage('Enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    if (authMode === 'register') {
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.dateOfBirth) {
        setMessage('First name, last name, and date of birth are required.');
        setIsSubmitting(false);
        return;
      }

      if (formData.password.length < 6) {
        setMessage('Password must be at least 6 characters.');
        setIsSubmitting(false);
        return;
      }
    }

    const endpoint = authMode === 'login' ? 'login' : 'register';
    const payload =
      authMode === 'login'
        ? {
            email: formData.email,
            password: formData.password,
          }
        : formData;

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.');
      }

      setUser({
        createdAt: data.createdAt,
        dateOfBirth: data.dateOfBirth,
        email: data.email,
        firstName: data.firstName,
        id: data.id,
        lastName: data.lastName,
      });
      setActivePage('planner');
      setSelectedMonth(currentMonthStart);
      setSelectedDay(null);
      setSelectedMonthRange(null);
      setSelectedWeekRange(null);
      setFormData(emptyAuthForm);
      setExpenseMessage('');
      setIncomeMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncomeSubmit = async (event) => {
    event.preventDefault();
    setIsSavingIncome(true);
    setIncomeMessage('');

    if (!incomeForm.name.trim()) {
      setIncomeMessage('Add an income source name before saving.');
      setIsSavingIncome(false);
      return;
    }

    if (Number(incomeForm.amount) <= 0 && !incomeForm.useTaxEstimate) {
      setIncomeMessage('Expected amount must be greater than 0.');
      setIsSavingIncome(false);
      return;
    }

    if (!incomeForm.nextPayDate) {
      setIncomeMessage('Choose the first payday to track.');
      setIsSavingIncome(false);
      return;
    }

    if (incomeForm.useTaxEstimate && estimatedNetPay <= 0) {
      setIncomeMessage('Enter valid pay details so we can estimate take-home pay.');
      setIsSavingIncome(false);
      return;
    }

    const payload = {
      amount: incomeForm.useTaxEstimate ? estimatedNetPay.toFixed(2) : incomeForm.amount,
      compensationType: incomeForm.useTaxEstimate ? incomeForm.compensationType : '',
      estimatedTaxRate: incomeForm.useTaxEstimate ? incomeForm.estimatedTaxRate : '',
      grossAmount:
        incomeForm.useTaxEstimate && incomeForm.compensationType === 'salaried'
          ? incomeForm.grossAmount
          : '',
      frequency: incomeForm.frequency,
      hourlyRate:
        incomeForm.useTaxEstimate && incomeForm.compensationType === 'hourly'
          ? incomeForm.hourlyRate
          : '',
      hoursPerPeriod:
        incomeForm.useTaxEstimate && incomeForm.compensationType === 'hourly'
          ? incomeForm.hoursPerPeriod
          : '',
      name: incomeForm.name,
      nextPayDate: incomeForm.nextPayDate,
    };
    const method = editingIncomeSourceId ? 'PUT' : 'POST';
    const route = editingIncomeSourceId
      ? `${apiBaseUrl}/api/users/${user.id}/income-sources/${editingIncomeSourceId}`
      : `${apiBaseUrl}/api/users/${user.id}/income-sources`;

    try {
      const response = await fetch(route, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save income source.');
      }

      const normalizedIncomeSource = normalizeIncomeSource(data);

      if (editingIncomeSourceId) {
        setIncomeSources((currentIncomeSources) =>
          currentIncomeSources.map((incomeSource) =>
            incomeSource.id === normalizedIncomeSource.id ? normalizedIncomeSource : incomeSource,
          ),
        );
      } else {
        setIncomeSources((currentIncomeSources) => [...currentIncomeSources, normalizedIncomeSource]);
      }

      resetIncomeEditor();
    } catch (error) {
      setIncomeMessage(error.message);
    } finally {
      setIsSavingIncome(false);
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    setIsSavingExpense(true);
    setExpenseMessage('');

    if (!expenseForm.name.trim()) {
      setExpenseMessage('Add an expense name before saving.');
      setIsSavingExpense(false);
      return;
    }

    if (Number(expenseForm.amount) <= 0) {
      setExpenseMessage('Expense amount must be greater than 0.');
      setIsSavingExpense(false);
      return;
    }

    if (!expenseForm.nextDueDate) {
      setExpenseMessage('Choose the first due date to track.');
      setIsSavingExpense(false);
      return;
    }

    if (expenseForm.category === 'custom' && !expenseForm.customCategory.trim()) {
      setExpenseMessage('Name your custom expense category.');
      setIsSavingExpense(false);
      return;
    }

    const payload = {
      amount: expenseForm.amount,
      category:
        expenseForm.category === 'custom'
          ? expenseForm.customCategory.trim()
          : expenseForm.category,
      frequency: expenseForm.frequency,
      name: expenseForm.name,
      nextDueDate: expenseForm.nextDueDate,
      spendingType: expenseForm.spendingType,
    };
    const method = editingExpenseSourceId ? 'PUT' : 'POST';
    const route = editingExpenseSourceId
      ? `${apiBaseUrl}/api/users/${user.id}/expense-sources/${editingExpenseSourceId}`
      : `${apiBaseUrl}/api/users/${user.id}/expense-sources`;

    try {
      const response = await fetch(route, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save expense source.');
      }

      const normalizedExpenseSource = normalizeExpenseSource(data);

      if (editingExpenseSourceId) {
        setExpenseSources((currentExpenseSources) =>
          currentExpenseSources.map((expenseSource) =>
            expenseSource.id === normalizedExpenseSource.id ? normalizedExpenseSource : expenseSource,
          ),
        );
      } else {
        setExpenseSources((currentExpenseSources) => [...currentExpenseSources, normalizedExpenseSource]);
      }

      resetExpenseEditor();
    } catch (error) {
      setExpenseMessage(error.message);
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleEditIncomeSource = (incomeSource) => {
    setEditingIncomeSourceId(incomeSource.id);
    setIncomeForm(
      createDefaultIncomeForm(today, {
        amount: String(incomeSource.amount),
        compensationType: incomeSource.compensationType || 'hourly',
        estimatedTaxRate: incomeSource.estimatedTaxRate || '18',
        frequency: incomeSource.frequency,
        grossAmount: incomeSource.grossAmount,
        hourlyRate: incomeSource.hourlyRate,
        hoursPerPeriod: incomeSource.hoursPerPeriod,
        name: incomeSource.name,
        nextPayDate: incomeSource.nextPayDate.slice(0, 10),
        useTaxEstimate:
          incomeSource.compensationType === 'hourly' || incomeSource.compensationType === 'salaried',
      }),
    );
  };

  const handleDeleteIncomeSource = async (incomeSource) => {
    const shouldDelete = globalThis.confirm(`Delete ${incomeSource.name}?`);

    if (!shouldDelete) {
      return;
    }

    setIncomeMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${user.id}/income-sources/${incomeSource.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Could not delete income source.');
      }

      setIncomeSources((currentIncomeSources) =>
        currentIncomeSources.filter((currentIncomeSource) => currentIncomeSource.id !== incomeSource.id),
      );

      if (editingIncomeSourceId === incomeSource.id) {
        resetIncomeEditor();
      }
    } catch (error) {
      setIncomeMessage(error.message);
    }
  };

  const handleEditExpenseSource = (expenseSource) => {
    setEditingExpenseSourceId(expenseSource.id);
    setExpenseForm(
      createDefaultExpenseForm(today, {
        amount: String(expenseSource.amount),
        category: expenseCategoryOptions.some((option) => option.value === expenseSource.category)
          ? expenseSource.category
          : 'custom',
        customCategory: expenseCategoryOptions.some((option) => option.value === expenseSource.category)
          ? ''
          : expenseSource.category,
        frequency: expenseSource.frequency,
        name: expenseSource.name,
        nextDueDate: expenseSource.nextDueDate.slice(0, 10),
        spendingType: expenseSource.spendingType || 'essential',
      }),
    );
  };

  const handleDeleteExpenseSource = async (expenseSource) => {
    const shouldDelete = globalThis.confirm(`Delete ${expenseSource.name}?`);

    if (!shouldDelete) {
      return;
    }

    setExpenseMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${user.id}/expense-sources/${expenseSource.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Could not delete expense.');
      }

      setExpenseSources((currentExpenseSources) =>
        currentExpenseSources.filter((currentExpenseSource) => currentExpenseSource.id !== expenseSource.id),
      );

      if (editingExpenseSourceId === expenseSource.id) {
        resetExpenseEditor();
      }
    } catch (error) {
      setExpenseMessage(error.message);
    }
  };

  const navigateMonth = (offset) => {
    const nextMonth = addMonths(selectedMonth, offset);

    if (nextMonth > finalMonthStart) {
      return;
    }

    if (nextMonth < accountStartMonth) {
      return;
    }

    setSelectedMonth(nextMonth);
    setSelectedDay(null);
    setSelectedMonthRange(null);
    setSelectedWeekRange(null);
  };

  const handleLogout = () => {
    setUser(null);
    setExpenseSources([]);
    setIncomeSources([]);
    resetExpenseEditor();
    resetIncomeEditor();
  };

  return {
    accountStartMonth,
    activeGoals,
    activePage,
    activePlannerTab,
    allocationLabel,
    authMode,
    budgetCategories,
    budgetCategoryForm,
    budgetCategoryOptions,
    budgetCategorySummaries,
    budgetGoalForm,
    budgetGoals,
    budgetMessage,
    calendarWeeks,
    canAllocateGoalNet,
    canGoToNextMonth,
    canGoToPreviousMonth,
    chartConfirmedExpenseTotal,
    chartConfirmedIncomeTotal,
    chartDiscretionaryExpenseTotal,
    chartEssentialExpenseTotal,
    chartExpenseTotal,
    chartIncomeTotal,
    chartPeriodLabels,
    closestActiveGoal,
    completedGoals,
    confirmedExpensePayments,
    confirmedIncomePayments,
    currentMonthAvailableToBudget,
    currentMonthActualNetTotal,
    currentMonthExpenseTotal,
    currentMonthLabel,
    currentMonthNetTotal,
    currentMonthTotal,
    detailActualExpenseTotal,
    detailActualGoalTotal,
    detailActualIncomeTotal,
    detailActualNetTotal,
    detailExpenses,
    detailGoalTotal,
    detailGoals,
    detailIncome,
    detailNetTotal,
    detailSelectionLabel,
    discretionarySavingsItems,
    displayedMonthActualExpenseTotal,
    displayedMonthActualGoalTotal,
    displayedMonthActualIncomeTotal,
    displayedMonthActualNetTotal,
    displayedMonthDiscretionaryExpenseTotal,
    displayedMonthEnd,
    displayedMonthEssentialExpenseTotal,
    displayedMonthExpenseTotal,
    displayedMonthGoalTotal,
    displayedMonthLabel,
    displayedMonthNetTotal,
    displayedMonthSpendingTypeTotal,
    displayedMonthTotal,
    editingExpenseSourceId,
    editingGoalId,
    editingIncomeSourceId,
    estimatedGrossPay,
    estimatedNetPay,
    expenseChartPeriod,
    expenseForm,
    expenseMessage,
    expensePie,
    expensePieTooltip,
    expenseSources,
    expenseTypePie,
    formData,
    goalMessage,
    handleAllocateGoalNet,
    handleBudgetCategoryChange,
    handleBudgetCategorySubmit,
    handleBudgetGoalChange,
    handleBudgetGoalSubmit,
    handleChange,
    handleConfirmGoalPayment,
    handleDeleteBudgetCategory,
    handleDeleteExpenseSource,
    handleDeleteGoal,
    handleDeleteIncomeSource,
    handleEditExpenseSource,
    handleEditGoal,
    handleEditIncomeSource,
    handleEstimateToggle,
    handleExpenseChange,
    handleExpenseSubmit,
    handleIncomeChange,
    handleIncomeSubmit,
    handleLogout,
    handleSubmit,
    handleUnconfirmGoalPayment,
    hasAppliedEstimate,
    hasDetailSelection,
    incomeChartPeriod,
    incomeForm,
    incomeMessage,
    incomePieTooltip,
    incomeSources,
    isEstimateVisible,
    isExpenseHistoryOpen,
    isIncomeHistoryOpen,
    isSavingBudgetLimit,
    isSavingExpense,
    isSavingIncome,
    isSubmitting,
    message,
    navigateMonth,
    netSnapshotPie,
    netSnapshotTooltip,
    nextBillDue,
    nextPayday,
    overBudgetCategories,
    resetExpenseEditor,
    resetGoalEditor,
    resetIncomeEditor,
    selectedDay,
    selectedDayExpenseTotal,
    selectedDayTotal,
    selectedExpenseBreakdown,
    selectedIncomeBreakdown,
    selectedMonth,
    selectedMonthPie,
    selectedMonthRange,
    selectedWeekRange,
    setActivePage,
    setActivePlannerTab,
    setAuthMode,
    setExpenseChartPeriod,
    setHasAppliedEstimate,
    setIncomeChartPeriod,
    setIncomeForm,
    setIsExpenseHistoryOpen,
    setIsIncomeHistoryOpen,
    setMessage,
    setSelectedDay,
    setSelectedMonthRange,
    setSelectedWeekRange,
    spendingTypeSnapshotPie,
    spendingTypeTooltip,
    today,
    toggleExpenseConfirmation,
    toggleIncomeConfirmation,
    unconfirmedExpensePayments,
    unconfirmedIncomePayments,
    user,
    workWeek,
    workWeekActualNetTotal,
    workWeekExpenseTotal,
    workWeekNetTotal,
    workWeekTotal,
    yearActualIncomeTotal,
    yearActualNetTotal,
    yearEnd,
    yearExpenseTotal,
    yearNetTotal,
    yearTotal,
  };
}
