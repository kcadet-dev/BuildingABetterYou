import { useEffect, useMemo, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly', intervalDays: 7 },
  { value: 'biweekly', label: 'Bi-weekly', intervalDays: 14 },
  { value: 'semimonthly', label: 'Semi-monthly', intervalDays: 15 },
  { value: 'monthly', label: 'Monthly', intervalDays: null },
  { value: 'one_time', label: 'One-time', intervalDays: null },
];

const starterBudgets = [
  { id: 1, name: 'Groceries', limit: 300, spent: 120 },
  { id: 2, name: 'Savings', limit: 200, spent: 75 },
];
const starterGoals = [
  { currentAmount: 75, id: 1, name: 'Emergency Cushion', targetAmount: 500, targetDate: '2026-08-01' },
  { currentAmount: 25, id: 2, name: 'Textbooks', targetAmount: 250, targetDate: '2026-06-15' },
];
const chartColors = ['#64748b', '#94a3b8', '#cbd5e1', '#7c8da5', '#a8b3c5', '#d5dce7'];
const expenseChartColors = ['#8b9aaa', '#b4bfca', '#d6dde5', '#718096', '#a1adba', '#e2e8f0'];
const expenseCategoryOptions = [
  { label: 'Housing', type: 'essential', value: 'Housing' },
  { label: 'Utilities', type: 'essential', value: 'Utilities' },
  { label: 'Groceries', type: 'essential', value: 'Groceries' },
  { label: 'Transportation', type: 'essential', value: 'Transportation' },
  { label: 'Health', type: 'essential', value: 'Health' },
  { label: 'Debt Repayment', type: 'essential', value: 'Debt Repayment' },
  { label: 'Dining & Drinks', type: 'discretionary', value: 'Dining & Drinks' },
  { label: 'Entertainment', type: 'discretionary', value: 'Entertainment' },
  { label: 'Shopping', type: 'discretionary', value: 'Shopping' },
  { label: 'Personal Care', type: 'discretionary', value: 'Personal Care' },
  { label: 'Travel', type: 'discretionary', value: 'Travel' },
  { label: 'Custom Category', type: 'essential', value: 'custom' },
];
const authStorageKey = 'baby-finance-auth-session';
const emptyAuthForm = {
  dateOfBirth: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
};

function readStoredAuthSession() {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return null;
  }

  try {
    const rawSession = globalThis.localStorage.getItem(authStorageKey);

    if (!rawSession) {
      return null;
    }

    const parsedSession = JSON.parse(rawSession);

    if (parsedSession?.version !== 1 || !parsedSession?.user?.id) {
      return null;
    }

    return parsedSession.user;
  } catch {
    return null;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(value);
}

function formatSignedCurrency(value) {
  const amount = Number(value);
  const sign = amount >= 0 ? '+' : '-';

  return `${sign}${formatCurrency(Math.abs(amount))}`;
}

function formatExpenseCurrency(value) {
  return `-${formatCurrency(Math.abs(Number(value)))}`;
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatOptionalDate(dateValue) {
  if (!dateValue) {
    return 'Not added yet';
  }

  return formatLongDate(new Date(dateValue));
}

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);

  return nextDate;
}

function getFrequencyLabel(frequency) {
  return frequencyOptions.find((option) => option.value === frequency)?.label || frequency;
}

function createDefaultIncomeForm(today, overrides = {}) {
  return {
    amount: '',
    compensationType: 'hourly',
    estimatedTaxRate: '18',
    frequency: 'biweekly',
    grossAmount: '',
    hourlyRate: '',
    hoursPerPeriod: '',
    name: '',
    nextPayDate: formatDateInput(today),
    useTaxEstimate: false,
    ...overrides,
  };
}

function createDefaultExpenseForm(today, overrides = {}) {
  return {
    amount: '',
    category: 'Housing',
    customCategory: '',
    frequency: 'monthly',
    name: '',
    nextDueDate: formatDateInput(today),
    spendingType: 'essential',
    ...overrides,
  };
}

function createDefaultGoalForm(today, overrides = {}) {
  return {
    currentAmount: '',
    name: '',
    targetAmount: '',
    targetDate: formatDateInput(addMonths(today, 1)),
    ...overrides,
  };
}

function normalizeIncomeSource(incomeSource) {
  return {
    ...incomeSource,
    amount: Number(incomeSource.amount),
    compensationType: incomeSource.compensationType || 'hourly',
    estimatedTaxRate:
      incomeSource.estimatedTaxRate === null || incomeSource.estimatedTaxRate === undefined
        ? ''
        : String(incomeSource.estimatedTaxRate),
    grossAmount:
      incomeSource.grossAmount === null || incomeSource.grossAmount === undefined
        ? ''
        : String(incomeSource.grossAmount),
    hourlyRate:
      incomeSource.hourlyRate === null || incomeSource.hourlyRate === undefined
        ? ''
        : String(incomeSource.hourlyRate),
    hoursPerPeriod:
      incomeSource.hoursPerPeriod === null || incomeSource.hoursPerPeriod === undefined
        ? ''
        : String(incomeSource.hoursPerPeriod),
    name: incomeSource.name || incomeSource.jobName,
    useTaxEstimate:
      incomeSource.compensationType === 'hourly' || incomeSource.compensationType === 'salaried',
  };
}

function normalizeExpenseSource(expenseSource) {
  return {
    ...expenseSource,
    amount: Number(expenseSource.amount),
    category: expenseSource.category || 'Other',
    spendingType: expenseSource.spendingType || 'essential',
  };
}

function getOccurrencesForIncomeSource(incomeSource, startDate, endDate) {
  const occurrences = [];
  const frequency = frequencyOptions.find((option) => option.value === incomeSource.frequency);
  let occurrenceDate = parseLocalDate(incomeSource.nextPayDate.slice(0, 10));

  while (occurrenceDate <= endDate) {
    if (occurrenceDate >= startDate) {
      occurrences.push({
        amount: Number(incomeSource.amount),
        date: new Date(occurrenceDate),
        frequency: incomeSource.frequency,
        incomeSourceId: incomeSource.id,
        name: incomeSource.name,
      });
    }

    if (incomeSource.frequency === 'one_time') {
      break;
    }

    occurrenceDate =
      frequency?.value === 'monthly'
        ? addMonths(occurrenceDate, 1)
        : addDays(occurrenceDate, frequency?.intervalDays || 14);
  }

  return occurrences;
}

function getOccurrencesForExpenseSource(expenseSource, startDate, endDate) {
  const occurrences = [];
  const frequency = frequencyOptions.find((option) => option.value === expenseSource.frequency);
  let occurrenceDate = parseLocalDate(expenseSource.nextDueDate.slice(0, 10));

  while (occurrenceDate <= endDate) {
    if (occurrenceDate >= startDate) {
      occurrences.push({
        amount: Number(expenseSource.amount),
        category: expenseSource.category || 'Other',
        date: new Date(occurrenceDate),
        expenseSourceId: expenseSource.id,
        frequency: expenseSource.frequency,
        name: expenseSource.name,
        spendingType: expenseSource.spendingType || 'essential',
      });
    }

    if (expenseSource.frequency === 'one_time') {
      break;
    }

    occurrenceDate =
      frequency?.value === 'monthly'
        ? addMonths(occurrenceDate, 1)
        : addDays(occurrenceDate, frequency?.intervalDays || 14);
  }

  return occurrences;
}

function getGoalCalendarItems(goals, monthStart, monthEnd, monthlyNet, today) {
  return goals
    .map((goal) => {
      const targetDate = parseLocalDate(goal.targetDate);
      const remainingAmount = Math.max(Number(goal.targetAmount) - Number(goal.currentAmount || 0), 0);
      const estimatedDate = estimateGoalDate(remainingAmount, monthlyNet, today);

      return {
        ...goal,
        currentAmount: Number(goal.currentAmount || 0),
        date: targetDate,
        estimatedDate,
        remainingAmount,
        targetAmount: Number(goal.targetAmount),
      };
    })
    .filter((goal) => isDateInRange(goal.date, monthStart, monthEnd));
}

function buildCalendarDays(monthStart, paydays, expenses, goals, today) {
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const days = [];

  for (let index = 0; index < monthStart.getDay(); index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    days.push({
      date,
      expenses: expenses.filter((expense) => isSameDay(expense.date, date)),
      goals: goals.filter((goal) => isSameDay(goal.date, date)),
      isToday: isSameDay(date, today),
      paydays: paydays.filter((payday) => isSameDay(payday.date, date)),
    });
  }

  return days;
}

function getCalendarPreviewItems(calendarDay) {
  const hasIncome = calendarDay.paydays.length > 0;
  const hasExpenses = calendarDay.expenses.length > 0;
  const hasGoals = calendarDay.goals.length > 0;

  if (hasIncome && hasExpenses) {
    return [
      { item: calendarDay.paydays[0], type: 'income' },
      { item: calendarDay.expenses[0], type: 'expense' },
    ];
  }

  if (hasIncome) {
    return [
      { item: calendarDay.paydays[0], type: 'income' },
      ...(hasGoals
        ? [{ item: calendarDay.goals[0], type: 'goal' }]
        : calendarDay.paydays.slice(1, 2).map((payday) => ({ item: payday, type: 'income' }))),
    ];
  }

  if (hasExpenses) {
    return [
      { item: calendarDay.expenses[0], type: 'expense' },
      ...(hasGoals
        ? [{ item: calendarDay.goals[0], type: 'goal' }]
        : calendarDay.expenses.slice(1, 2).map((expense) => ({ item: expense, type: 'expense' }))),
    ];
  }

  return calendarDay.goals.slice(0, 2).map((goal) => ({
    item: goal,
    type: 'goal',
  }));
}

function buildCalendarWeeks(calendarDays) {
  const weeks = [];

  for (let index = 0; index < calendarDays.length; index += 7) {
    const week = calendarDays.slice(index, index + 7);

    while (week.length < 7) {
      week.push(null);
    }

    weeks.push(week);
  }

  return weeks;
}

function getCalendarWeekRange(calendarWeek) {
  const visibleDays = calendarWeek.filter(Boolean);

  if (visibleDays.length === 0) {
    return null;
  }

  return {
    start: visibleDays[0].date,
    end: visibleDays[visibleDays.length - 1].date,
  };
}

function getWorkWeekRange(today) {
  const dayOfWeek = today.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const start = addDays(today, -mondayOffset);

  return {
    start,
    end: addDays(start, 6),
  };
}

function getMonthStart(dateValue) {
  const date = new Date(dateValue);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildBreakdown(occurrences, colors = chartColors) {
  const totals = new Map();
  let grandTotal = 0;

  occurrences.forEach((occurrence) => {
    grandTotal += occurrence.amount;
    totals.set(occurrence.name, (totals.get(occurrence.name) || 0) + occurrence.amount);
  });

  return Array.from(totals.entries())
    .sort((firstItem, secondItem) => secondItem[1] - firstItem[1])
    .map(([name, amount], index) => ({
      amount,
      color: colors[index % colors.length],
      name,
      share: grandTotal === 0 ? 0 : amount / grandTotal,
    }));
}

function buildExpenseBreakdown(expenses) {
  const totals = new Map();
  let grandTotal = 0;

  expenses.forEach((expense) => {
    grandTotal += expense.amount;
    totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
  });

  return Array.from(totals.entries())
    .sort((firstItem, secondItem) => secondItem[1] - firstItem[1])
    .map(([name, amount], index) => ({
      amount,
      color: expenseChartColors[index % expenseChartColors.length],
      name,
      share: grandTotal === 0 ? 0 : amount / grandTotal,
    }));
}

function buildPieGradient(items, emptyColor = '#e5ece7') {
  if (items.length === 0) {
    return `conic-gradient(${emptyColor} 0deg 360deg)`;
  }

  let currentAngle = 0;
  const stops = items.map((item) => {
    const start = currentAngle;
    const end = currentAngle + item.share * 360;
    currentAngle = end;

    return `${item.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

function buildNetSnapshotItems(incomeTotal, expenseTotal) {
  const items = [
    {
      amount: Math.max(incomeTotal, 0),
      color: '#94a3b8',
      name: 'Income',
    },
    {
      amount: Math.max(expenseTotal, 0),
      color: '#d6dde5',
      name: 'Expenses',
    },
  ];
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return items.map((item) => ({
    ...item,
    share: total === 0 ? 0 : item.amount / total,
  }));
}

function buildSpendingTypeSnapshotItems(essentialTotal, discretionaryTotal) {
  const items = [
    {
      amount: Math.max(essentialTotal, 0),
      color: '#94a3b8',
      name: 'Essential',
    },
    {
      amount: Math.max(discretionaryTotal, 0),
      color: '#facc15',
      name: 'Discretionary',
    },
  ];
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return items.map((item) => ({
    ...item,
    share: total === 0 ? 0 : item.amount / total,
  }));
}

function estimateGoalDate(goalAmount, monthlyNet, today) {
  if (goalAmount <= 0) {
    return today;
  }

  const dailyNet = monthlyNet / 30;

  if (dailyNet <= 0) {
    return null;
  }

  return addDays(today, Math.ceil(goalAmount / dailyNet));
}

function App() {
  const today = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const currentMonthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  const yearEnd = useMemo(() => new Date(today.getFullYear(), 11, 31), [today]);
  const finalMonthStart = useMemo(() => new Date(today.getFullYear(), 11, 1), [today]);
  const workWeek = useMemo(() => getWorkWeekRange(today), [today]);

  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState(emptyAuthForm);
  const [budgetGoalForm, setBudgetGoalForm] = useState(createDefaultGoalForm(today));
  const [budgetGoals, setBudgetGoals] = useState(starterGoals);
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
  const [isExpenseHistoryOpen, setIsExpenseHistoryOpen] = useState(false);
  const [isIncomeHistoryOpen, setIsIncomeHistoryOpen] = useState(false);
  const [user, setUser] = useState(() => readStoredAuthSession());
  const [message, setMessage] = useState('');
  const [expenseMessage, setExpenseMessage] = useState('');
  const [incomeMessage, setIncomeMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [hasAppliedEstimate, setHasAppliedEstimate] = useState(false);

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
  const selectedDayNetTotal = selectedDayTotal - selectedDayExpenseTotal;
  const workWeekNetTotal = workWeekTotal - workWeekExpenseTotal;
  const currentMonthNetTotal = currentMonthTotal - currentMonthExpenseTotal;
  const yearNetTotal = yearTotal - yearExpenseTotal;
  const displayedMonthNetTotal = displayedMonthTotal - displayedMonthExpenseTotal;
  const displayedMonthEssentialExpenseTotal = displayedMonthExpenses
    .filter((expense) => expense.spendingType === 'essential')
    .reduce((total, expense) => total + expense.amount, 0);
  const displayedMonthDiscretionaryExpenseTotal = displayedMonthExpenses
    .filter((expense) => expense.spendingType === 'discretionary')
    .reduce((total, expense) => total + expense.amount, 0);
  const displayedMonthGoals = useMemo(
    () => getGoalCalendarItems(budgetGoals, selectedMonth, displayedMonthEnd, displayedMonthNetTotal, today),
    [budgetGoals, displayedMonthEnd, displayedMonthNetTotal, selectedMonth, today],
  );
  const selectedDayGoals = useMemo(
    () => selectedDay ? displayedMonthGoals.filter((goal) => isSameDay(goal.date, selectedDay)) : [],
    [displayedMonthGoals, selectedDay],
  );
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
  const selectedMonthBreakdown = useMemo(
    () => buildBreakdown(displayedMonthIncome),
    [displayedMonthIncome],
  );
  const selectedMonthExpenseBreakdown = useMemo(
    () => buildExpenseBreakdown(displayedMonthExpenses),
    [displayedMonthExpenses],
  );
  const selectedMonthPie = useMemo(
    () => buildPieGradient(selectedMonthBreakdown),
    [selectedMonthBreakdown],
  );
  const expensePie = useMemo(
    () => buildPieGradient(selectedMonthExpenseBreakdown, '#edf2f7'),
    [selectedMonthExpenseBreakdown],
  );
  const netSnapshotItems = useMemo(
    () => buildNetSnapshotItems(displayedMonthTotal, displayedMonthExpenseTotal),
    [displayedMonthExpenseTotal, displayedMonthTotal],
  );
  const netSnapshotPie = useMemo(
    () => buildPieGradient(netSnapshotItems, '#edf2f7'),
    [netSnapshotItems],
  );
  const spendingTypeSnapshotItems = useMemo(
    () =>
      buildSpendingTypeSnapshotItems(
        displayedMonthEssentialExpenseTotal,
        displayedMonthDiscretionaryExpenseTotal,
      ),
    [displayedMonthDiscretionaryExpenseTotal, displayedMonthEssentialExpenseTotal],
  );
  const spendingTypeSnapshotPie = useMemo(
    () => buildPieGradient(spendingTypeSnapshotItems, '#edf2f7'),
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
    }));
  };

  const handleBudgetGoalSubmit = (event) => {
    event.preventDefault();

    if (!budgetGoalForm.name.trim() || Number(budgetGoalForm.targetAmount) <= 0) {
      return;
    }

    setBudgetGoals((currentGoals) => [
      ...currentGoals,
      {
        currentAmount: Number(budgetGoalForm.currentAmount || 0),
        id: Date.now(),
        name: budgetGoalForm.name.trim(),
        targetAmount: Number(budgetGoalForm.targetAmount),
        targetDate: budgetGoalForm.targetDate,
      },
    ]);
    setBudgetGoalForm(createDefaultGoalForm(today));
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

  if (!user) {
    return (
      <main className="auth-page">
        <section className="brand-panel">
          <div className="brand-panel-copy">
            <p className="eyebrow">Building a Better You</p>
            <div className="brand-mark-row">
              <span className="money-badge" aria-hidden="true">
                $
              </span>
              <div>
                <h1>Baby Finance</h1>
              </div>
            </div>
            <p className="auth-intro">Your Money. Your Budget. Your Way.</p>
          </div>

          <div className="auth-highlights" aria-label="Money planning highlights">
            <article className="auth-highlight-card">
              <strong>Expected Income</strong>
              <small>Track paydays before they hit.</small>
            </article>
            <article className="auth-highlight-card">
              <strong>Planned Spending</strong>
              <small>See where your money is actually going.</small>
            </article>
            <article className="auth-highlight-card">
              <strong>B.A.B.Y. Snapshot</strong>
              <small>Take the guesswork out of finanical planning.</small>
            </article>
          </div>

          <p className="brand-note-small">(yes the name is corny)</p>
        </section>

        <section className="auth-card" aria-labelledby="auth-heading">
          <div className="mode-switch" aria-label="Account action">
            <button
              className={authMode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => {
                setAuthMode('login');
                setMessage('');
              }}
            >
              Login
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              type="button"
              onClick={() => {
                setAuthMode('register');
                setMessage('');
              }}
            >
              Sign up
            </button>
          </div>

          <div className="auth-copy">
            <h2 id="auth-heading">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {authMode === 'register' && (
              <div className="auth-name-grid">
                <label>
                  First Name
                  <input
                    autoComplete="given-name"
                    name="firstName"
                    onChange={handleChange}
                    required
                    type="text"
                    value={formData.firstName}
                  />
                </label>

                <label>
                  Last Name
                  <input
                    autoComplete="family-name"
                    name="lastName"
                    onChange={handleChange}
                    required
                    type="text"
                    value={formData.lastName}
                  />
                </label>
              </div>
            )}

            <label>
              Email
              <input
                autoComplete="email"
                name="email"
                onChange={handleChange}
                placeholder="you@example.com"
                required
                type="email"
                value={formData.email}
              />
            </label>

            {authMode === 'register' && (
              <label>
                Date of Birth
                <input
                  autoComplete="bday"
                  name="dateOfBirth"
                  onChange={handleChange}
                  required
                  type="date"
                  value={formData.dateOfBirth}
                />
              </label>
            )}

            <label>
              Password
              <input
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                minLength="6"
                name="password"
                onChange={handleChange}
                required
                type="password"
                value={formData.password}
              />
            </label>

            {message && <p className="form-message">{message}</p>}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Working...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
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
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setUser(null);
              setExpenseSources([]);
              setIncomeSources([]);
              resetExpenseEditor();
              resetIncomeEditor();
            }}
          >
            Logout
          </button>
        </div>
      </header>

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

      {activePage === 'planner' ? (
      <section className="workspace-grid">
        <section className="income-panel" aria-labelledby="income-heading">
          <div className="planner-tabs" aria-label="Planner sections">
            <button
              type="button"
              className={activePlannerTab === 'income' ? 'active' : ''}
              onClick={() => setActivePlannerTab('income')}
            >
              Income
            </button>
            <button
              type="button"
              className={activePlannerTab === 'expenses' ? 'active' : ''}
              onClick={() => setActivePlannerTab('expenses')}
            >
              Expenses
            </button>
          </div>

          {activePlannerTab === 'income' ? (
            <>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Income Sources</p>
                <h2 id="income-heading">
                  {editingIncomeSourceId ? 'Edit Income Source' : 'Add Income Source'}
                </h2>
              </div>
          </div>

          <form className="income-form" onSubmit={handleIncomeSubmit}>
            <label>
              Income source name
              <input
                name="name"
                onChange={handleIncomeChange}
                placeholder="ex. Campus job, Birthday gift, Yearly bonus"
                required
                type="text"
                value={incomeForm.name}
              />
            </label>

            <button
              aria-pressed={incomeForm.useTaxEstimate}
              className={`toggle-button ${incomeForm.useTaxEstimate ? 'active' : ''}`}
              onClick={handleEstimateToggle}
              type="button"
            >
              Estimate take-home pay after taxes?
            </button>

            <div className="income-form-grid">
              <label>
                Frequency
                <select name="frequency" onChange={handleIncomeChange} value={incomeForm.frequency}>
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {!incomeForm.useTaxEstimate && (
                <label>
                  Expected Amount
                  <input
                    min="0.01"
                    name="amount"
                    onChange={handleIncomeChange}
                    placeholder="750"
                    required
                    step="0.01"
                    type="number"
                    value={incomeForm.amount}
                  />
                </label>
              )}
            </div>

            {incomeForm.useTaxEstimate && (
              <label>
                Pay style
                <select
                  name="compensationType"
                  onChange={handleIncomeChange}
                  value={incomeForm.compensationType}
                >
                  <option value="hourly">Hourly</option>
                  <option value="salaried">Salaried</option>
                </select>
              </label>
            )}

            <label>
              {incomeForm.frequency === 'one_time' ? 'Income date' : 'First payday to track'}
              <input
                max={formatDateInput(yearEnd)}
                min={formatDateInput(accountStartMonth)}
                name="nextPayDate"
                onChange={handleIncomeChange}
                required
                type="date"
                value={incomeForm.nextPayDate}
              />
            </label>

            {isEstimateVisible && (
              <section className="calculator-panel" aria-label="Hourly estimate">
                {incomeForm.compensationType === 'hourly' ? (
                  <div className="income-form-grid">
                    <label>
                      Hourly rate
                      <input
                        min="0.01"
                        name="hourlyRate"
                        onChange={handleIncomeChange}
                        step="0.01"
                        type="number"
                        value={incomeForm.hourlyRate}
                      />
                    </label>

                    <label>
                      Hours per pay period
                      <input
                        min="0.1"
                        name="hoursPerPeriod"
                        onChange={handleIncomeChange}
                        step="0.1"
                        type="number"
                        value={incomeForm.hoursPerPeriod}
                      />
                    </label>
                  </div>
                ) : (
                  <label>
                    Gross paycheck amount
                    <input
                      min="0.01"
                      name="grossAmount"
                      onChange={handleIncomeChange}
                      step="0.01"
                      type="number"
                      value={incomeForm.grossAmount}
                    />
                  </label>
                )}

                <label>
                  Estimated tax rate %
                  <input
                    max="100"
                    min="0"
                    name="estimatedTaxRate"
                    onChange={handleIncomeChange}
                    step="0.1"
                    type="number"
                    value={incomeForm.estimatedTaxRate}
                  />
                </label>

                <div className="estimate-strip">
                  <div>
                    <span>Estimated gross</span>
                    <strong>{formatCurrency(estimatedGrossPay || 0)}</strong>
                  </div>
                  <div>
                    <span>Estimated take-home</span>
                    <strong>{formatCurrency(estimatedNetPay || 0)}</strong>
                  </div>
                  <button
                    type="button"
                    className={`secondary-button ${hasAppliedEstimate ? 'estimate-applied' : ''}`}
                    onClick={() => {
                      setIncomeForm((currentIncomeForm) => ({
                        ...currentIncomeForm,
                        amount: estimatedNetPay > 0 ? estimatedNetPay.toFixed(2) : currentIncomeForm.amount,
                      }));
                      setHasAppliedEstimate(true);
                    }}
                  >
                    {hasAppliedEstimate ? 'Estimate Applied' : 'Use Estimate'}
                  </button>
                </div>

                <p className={`estimate-note ${hasAppliedEstimate ? 'active' : ''}`}>
                  {hasAppliedEstimate
                    ? `Saving ${formatCurrency(estimatedNetPay || 0)} as the amount for this income source.`
                    : 'Review the estimate, then apply it if you want this take-home amount saved.'}
                </p>
              </section>
            )}

            {incomeMessage && <p className="form-message">{incomeMessage}</p>}

            <div className={`form-actions ${editingIncomeSourceId ? 'is-editing' : ''}`}>
              <button type="submit" disabled={isSavingIncome}>
                {isSavingIncome
                  ? 'Saving...'
                  : editingIncomeSourceId
                    ? 'Update Income Source'
                    : 'Save Income Source'}
              </button>
              {editingIncomeSourceId && (
                <button type="button" className="secondary-button" onClick={resetIncomeEditor}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <section className="source-history">
            <button
              className="history-toggle"
              type="button"
              onClick={() => setIsIncomeHistoryOpen((isOpen) => !isOpen)}
            >
              <span>Income History</span>
              <small>{incomeSources.length} saved</small>
            </button>

            {isIncomeHistoryOpen && (
              <div className="income-list">
                {incomeSources.length === 0 ? (
                  <p className="empty-state">No income sources added yet.</p>
                ) : (
                  incomeSources.map((incomeSource) => (
                    <article className="income-item" key={incomeSource.id}>
                      <div className="income-item-copy">
                        <h3>{incomeSource.name}</h3>
                        <p>
                          {getFrequencyLabel(incomeSource.frequency)} •{' '}
                          {incomeSource.useTaxEstimate
                            ? `${incomeSource.compensationType === 'salaried' ? 'Salaried' : 'Hourly'} take-home estimate`
                            : 'Direct amount'}
                        </p>
                        <small>Next date: {formatLongDate(parseLocalDate(incomeSource.nextPayDate.slice(0, 10)))}</small>
                      </div>
                      <div className="income-item-actions">
                        <strong className="income-amount">{formatSignedCurrency(incomeSource.amount)}</strong>
                        <div className="history-actions">
                          <button type="button" className="secondary-button" onClick={() => handleEditIncomeSource(incomeSource)}>
                            Edit
                          </button>
                          <button type="button" className="secondary-button" onClick={() => handleDeleteIncomeSource(incomeSource)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
            </>
          ) : (
            <section className="expense-placeholder" aria-labelledby="expense-heading">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Expenses</p>
                  <h2 id="expense-heading">
                    {editingExpenseSourceId ? 'Edit Expense' : 'Add Expense'}
                  </h2>
                </div>
              </div>

              <form className="income-form" onSubmit={handleExpenseSubmit}>
                <label>
                  Expense name
                  <input
                    name="name"
                    onChange={handleExpenseChange}
                    placeholder="ex. Rent, groceries, phone bill"
                    required
                    type="text"
                    value={expenseForm.name}
                  />
                </label>

                <div className="income-form-grid">
                  <label>
                    Category
                    <select name="category" onChange={handleExpenseChange} value={expenseForm.category}>
                      {expenseCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Essential or discretionary
                    <select name="spendingType" onChange={handleExpenseChange} value={expenseForm.spendingType}>
                      <option value="essential">Essential</option>
                      <option value="discretionary">Discretionary</option>
                    </select>
                  </label>

                  {expenseForm.category === 'custom' && (
                    <label>
                      Custom category
                      <input
                        name="customCategory"
                        onChange={handleExpenseChange}
                        placeholder="ex. Pet care"
                        required
                        type="text"
                        value={expenseForm.customCategory}
                      />
                    </label>
                  )}

                  <label>
                    Frequency
                    <select name="frequency" onChange={handleExpenseChange} value={expenseForm.frequency}>
                      {frequencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Expected Amount
                    <input
                      min="0.01"
                      name="amount"
                      onChange={handleExpenseChange}
                      placeholder="75"
                      required
                      step="0.01"
                      type="number"
                      value={expenseForm.amount}
                    />
                  </label>
                </div>

                <label>
                  {expenseForm.frequency === 'one_time' ? 'Expense date' : 'First due date to track'}
                  <input
                    max={formatDateInput(yearEnd)}
                    min={formatDateInput(accountStartMonth)}
                    name="nextDueDate"
                    onChange={handleExpenseChange}
                    required
                    type="date"
                    value={expenseForm.nextDueDate}
                  />
                </label>

                {expenseMessage && <p className="form-message">{expenseMessage}</p>}

                <div className={`form-actions ${editingExpenseSourceId ? 'is-editing' : ''}`}>
                  <button type="submit" disabled={isSavingExpense}>
                    {isSavingExpense
                      ? 'Saving...'
                      : editingExpenseSourceId
                        ? 'Update Expense'
                        : 'Save Expense'}
                  </button>
                  {editingExpenseSourceId && (
                    <button type="button" className="secondary-button" onClick={resetExpenseEditor}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              <section className="source-history">
                <button
                  className="history-toggle"
                  type="button"
                  onClick={() => setIsExpenseHistoryOpen((isOpen) => !isOpen)}
                >
                  <span>Expense History</span>
                  <small>{expenseSources.length} saved</small>
                </button>

                {isExpenseHistoryOpen && (
                  <div className="income-list">
                    {expenseSources.length === 0 ? (
                      <p className="empty-state">No expense sources added yet.</p>
                    ) : (
                      expenseSources.map((expenseSource) => (
                        <article className="income-item expense-item" key={expenseSource.id}>
                          <div className="income-item-copy">
                            <h3>{expenseSource.name}</h3>
                            <p>
                              {expenseSource.category} · {expenseSource.spendingType === 'essential' ? 'Essential' : 'Discretionary'} ·{' '}
                              {getFrequencyLabel(expenseSource.frequency)}
                            </p>
                            <small>
                              Next date: {formatLongDate(parseLocalDate(expenseSource.nextDueDate.slice(0, 10)))}
                            </small>
                          </div>
                          <div className="income-item-actions">
                            <strong>{formatExpenseCurrency(expenseSource.amount)}</strong>
                            <div className="history-actions">
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => handleEditExpenseSource(expenseSource)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => handleDeleteExpenseSource(expenseSource)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                )}
              </section>
            </section>
          )}
        </section>

        <div className="calendar-column">
          <section className="calendar-panel" aria-labelledby="calendar-heading">
            <div className="panel-heading calendar-header">
              <button
                type="button"
                className="month-arrow"
                disabled={!canGoToPreviousMonth}
                onClick={() => navigateMonth(-1)}
              >
                ←
              </button>
              <div className="calendar-title">
                <p className="eyebrow">Calendar</p>
                <button
                  className={`month-select-button ${selectedMonthRange ? 'active' : ''}`}
                  type="button"
                  onClick={() => {
                    setSelectedDay(null);
                    setSelectedWeekRange(null);
                    setSelectedMonthRange((currentMonthRange) =>
                      currentMonthRange &&
                      isSameDay(currentMonthRange.start, selectedMonth) &&
                      isSameDay(currentMonthRange.end, displayedMonthEnd)
                        ? null
                        : {
                            start: selectedMonth,
                            end: displayedMonthEnd,
                          },
                    );
                  }}
                >
                  <span id="calendar-heading">{displayedMonthLabel}</span>
                </button>
              </div>
              <button
                type="button"
                className="month-arrow"
                disabled={!canGoToNextMonth}
                onClick={() => navigateMonth(1)}
              >
                →
              </button>
            </div>

            <div className="calendar-weekdays" aria-hidden="true">
              <span />
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarWeeks.map((calendarWeek, weekIndex) => {
                const weekRange = getCalendarWeekRange(calendarWeek);
                const isSelectedWeek =
                  selectedWeekRange &&
                  weekRange &&
                  isSameDay(selectedWeekRange.start, weekRange.start) &&
                  isSameDay(selectedWeekRange.end, weekRange.end);
                return (
                  <div className={`calendar-week-row ${isSelectedWeek ? 'selected-week' : ''}`} key={`week-${weekIndex}`}>
                    <button
                      className="week-select-button"
                      disabled={!weekRange}
                      onClick={() => {
                        if (!weekRange) {
                          return;
                        }

                        setSelectedDay(null);
                        setSelectedMonthRange(null);
                        setSelectedWeekRange((currentWeekRange) =>
                          currentWeekRange &&
                          isSameDay(currentWeekRange.start, weekRange.start) &&
                          isSameDay(currentWeekRange.end, weekRange.end)
                            ? null
                            : weekRange,
                        );
                      }}
                      type="button"
                    >
                      Week {weekIndex + 1}
                    </button>

                    {calendarWeek.map((calendarDay, dayIndex) => {
                      if (!calendarDay) {
                        return <div className="calendar-day empty" key={`empty-${weekIndex}-${dayIndex}`} />;
                      }

                      const previewItems = getCalendarPreviewItems(calendarDay);
                      const hiddenItemCount =
                        calendarDay.paydays.length + calendarDay.expenses.length + calendarDay.goals.length - previewItems.length;
                      const isDayInSelectedWeek =
                        selectedWeekRange &&
                        isDateInRange(calendarDay.date, selectedWeekRange.start, selectedWeekRange.end);

                      return (
                        <button
                          type="button"
                          className={`calendar-day ${calendarDay.isToday ? 'today' : ''} ${
                            selectedDay && isSameDay(calendarDay.date, selectedDay) ? 'selected' : ''
                          } ${isDayInSelectedWeek ? 'week-selected-day' : ''}`}
                          key={calendarDay.date.toISOString()}
                          onClick={() => {
                            setSelectedMonthRange(null);
                            setSelectedWeekRange(null);
                            setSelectedDay((currentSelectedDay) =>
                              currentSelectedDay && isSameDay(calendarDay.date, currentSelectedDay)
                                ? null
                                : calendarDay.date,
                            );
                          }}
                        >
                          <span>{calendarDay.date.getDate()}</span>
                          {previewItems.map(({ item, type }) =>
                            type === 'income' ? (
                              <p
                                className="calendar-pill income-pill"
                                key={`income-${item.incomeSourceId}-${item.date.toISOString()}`}
                              >
                                {item.name}: {formatSignedCurrency(item.amount)}
                              </p>
                            ) : type === 'expense' ? (
                              <p
                                className="calendar-pill expense-pill"
                                key={`expense-${item.expenseSourceId}-${item.date.toISOString()}`}
                              >
                                {item.name}: {formatExpenseCurrency(item.amount)}
                              </p>
                            ) : (
                              <p
                                className="calendar-pill goal-pill"
                                key={`goal-${item.id}-${item.date.toISOString()}`}
                              >
                                {item.name}: {formatCurrency(item.remainingAmount)}
                              </p>
                            ),
                          )}
                          {hiddenItemCount > 0 && (
                            <small className="calendar-see-more">+{hiddenItemCount} more</small>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="day-panel" aria-labelledby="day-heading">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  {selectedMonthRange ? 'Selected Month' : selectedWeekRange ? 'Selected Week' : 'Selected Day'}
                </p>
                <h2 id="day-heading">{detailSelectionLabel}</h2>
              </div>
            </div>

            <div className="day-detail-grid">
              <article className="day-detail-card">
                <h3>Income</h3>
                {!hasDetailSelection ? (
                  <p className="empty-state">
                    No day, week, or month selected. Click a date, Week button, or month title to inspect it more closely.
                  </p>
                ) : detailIncome.length === 0 ? (
                  <p className="empty-state">No income scheduled for this selection yet.</p>
                ) : (
                  detailIncome.map((income) => (
                    <div className="day-detail-item" key={`${income.incomeSourceId}-${income.date.toISOString()}`}>
                      <span>{selectedWeekRange ? `${formatLongDate(income.date)} - ${income.name}` : income.name}</span>
                      <strong className="income-amount">{formatSignedCurrency(income.amount)}</strong>
                    </div>
                  ))
                )}
              </article>

              <article className="day-detail-card">
                <h3>Expenses</h3>
                {!hasDetailSelection ? (
                  <p className="empty-state">No day, week, or month selected. Summary stays cleaner until you choose a calendar range.</p>
                ) : detailExpenses.length === 0 ? (
                  <p className="empty-state">No expenses scheduled for this selection yet.</p>
                ) : (
                  detailExpenses.map((expense) => (
                    <div className="day-detail-item expense-detail-item" key={`${expense.expenseSourceId}-${expense.date.toISOString()}`}>
                      <span>
                        {selectedWeekRange ? `${formatLongDate(expense.date)} - ${expense.name}` : expense.name}
                        <small>
                          {expense.category} · {expense.spendingType === 'essential' ? 'Essential' : 'Discretionary'}
                        </small>
                      </span>
                      <strong>{formatExpenseCurrency(expense.amount)}</strong>
                    </div>
                  ))
                )}
              </article>

              <article className="day-detail-card">
                <h3>Goals</h3>
                {!hasDetailSelection ? (
                  <p className="empty-state">Select a calendar range to see goal deadlines.</p>
                ) : detailGoals.length === 0 ? (
                  <p className="empty-state">No goals due for this selection yet.</p>
                ) : (
                  detailGoals.map((goal) => (
                    <div className="day-detail-item goal-detail-item" key={`${goal.id}-${goal.date.toISOString()}`}>
                      <span>
                        {selectedWeekRange ? `${formatLongDate(goal.date)} - ${goal.name}` : goal.name}
                        <small>{formatCurrency(goal.remainingAmount)} left to reach this goal</small>
                      </span>
                      <strong>{goal.estimatedDate ? formatLongDate(goal.estimatedDate) : 'Needs income'}</strong>
                    </div>
                  ))
                )}
              </article>
            </div>
          </section>
        </div>
      </section>
      ) : activePage === 'profile' ? (
      <section className="profile-layout">
        <section className="profile-panel" aria-labelledby="profile-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Profile</p>
              <h2 id="profile-heading">Account Details</h2>
            </div>
          </div>

          <div className="profile-grid">
            <article className="profile-card">
              <span>First Name</span>
              <strong>{user.firstName || 'Not added yet'}</strong>
            </article>
            <article className="profile-card">
              <span>Last Name</span>
              <strong>{user.lastName || 'Not added yet'}</strong>
            </article>
            <article className="profile-card">
              <span>Email</span>
              <strong>{user.email || 'Not added yet'}</strong>
            </article>
            <article className="profile-card">
              <span>Date of Birth</span>
              <strong>{formatOptionalDate(user.dateOfBirth)}</strong>
            </article>
            <article className="profile-card">
              <span>Member Since</span>
              <strong>{formatOptionalDate(user.createdAt)}</strong>
            </article>
          </div>
        </section>
      </section>
      ) : (
      <>
      <section className="summary-grid" aria-label="Income summary">
        <article>
          <p className="eyebrow">Selected Day (Net)</p>
          <strong>{formatCurrency(selectedDayNetTotal)}</strong>
          <span>
            {selectedDay ? formatLongDate(selectedDay) : 'No day selected'}
          </span>
        </article>
        <article>
          <p className="eyebrow">This Week (Net)</p>
          <strong>{formatCurrency(workWeekNetTotal)}</strong>
          <span>
            {formatLongDate(workWeek.start)} to {formatLongDate(workWeek.end)}
          </span>
        </article>
        <article>
          <p className="eyebrow">This Month (Net)</p>
          <strong>{formatCurrency(currentMonthNetTotal)}</strong>
          <span>{currentMonthLabel} through {formatLongDate(currentMonthEnd)}</span>
        </article>
        <article>
          <p className="eyebrow">This Year (Net)</p>
          <strong>{formatCurrency(yearNetTotal)}</strong>
          <span>expected through {formatLongDate(yearEnd)}</span>
        </article>
      </section>

      <section className="summary-layout">
        <section className="chart-grid">
          <article className="chart-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Expected Income</p>
                <h2>{displayedMonthLabel}</h2>
              </div>
            </div>

            <div className="chart-body">
              <div className="pie-chart" style={{ background: selectedMonthPie }}>
                <div className="pie-chart-center">
                  <span>Total</span>
                  <strong>{formatCurrency(displayedMonthTotal)}</strong>
                </div>
              </div>

              <div className="chart-legend">
                {selectedMonthBreakdown.length === 0 ? (
                  <p className="empty-state">No expected income in this month yet.</p>
                ) : (
                  selectedMonthBreakdown.map((item) => (
                    <div className="legend-row" key={item.name}>
                      <span className="legend-dot" style={{ background: item.color }} />
                      <span className="legend-label">{item.name}</span>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="chart-period-totals income-period-totals">
              <span>
                <small>Selected Day</small>
                <strong>{formatSignedCurrency(selectedDayTotal)}</strong>
              </span>
              <span>
                <small>This Week</small>
                <strong>{formatSignedCurrency(workWeekTotal)}</strong>
              </span>
              <span>
                <small>This Month</small>
                <strong>{formatSignedCurrency(currentMonthTotal)}</strong>
              </span>
            </div>
          </article>

          <article className="chart-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Expected Expenses</p>
                <h2>{displayedMonthLabel}</h2>
              </div>
            </div>

            <div className="chart-body">
              <div className="pie-chart" style={{ background: expensePie }}>
                <div className="pie-chart-center">
                  <span>Total</span>
                  <strong>{formatCurrency(displayedMonthExpenseTotal)}</strong>
                </div>
              </div>

              <div className="chart-legend">
                {selectedMonthExpenseBreakdown.length === 0 ? (
                  <p className="empty-state">No expected expenses in this month yet.</p>
                ) : (
                  selectedMonthExpenseBreakdown.map((item) => (
                    <div className="legend-row" key={item.name}>
                      <span className="legend-dot" style={{ background: item.color }} />
                      <span className="legend-label">{item.name}</span>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="chart-period-totals expense-period-totals">
              <span>
                <small>Selected Day</small>
                <strong>{formatExpenseCurrency(selectedDayExpenseTotal)}</strong>
              </span>
              <span>
                <small>This Week</small>
                <strong>{formatExpenseCurrency(workWeekExpenseTotal)}</strong>
              </span>
              <span>
                <small>This Month</small>
                <strong>{formatExpenseCurrency(currentMonthExpenseTotal)}</strong>
              </span>
            </div>
          </article>
        </section>

      <section className="budget-panel" aria-labelledby="budget-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">B.A.B.Y. Snapshot</p>
            <h2 id="budget-heading">Budget Outlook</h2>
          </div>
        </div>

        <section className="snapshot-grid" aria-label="Budget snapshot">
          <article className="snapshot-chart-card">
            <div className="snapshot-pie-grid">
              <div>
                <div className="pie-chart snapshot-pie" style={{ background: netSnapshotPie }}>
                  <div className="pie-chart-center">
                    <span>Net</span>
                    <strong>{formatCurrency(displayedMonthNetTotal)}</strong>
                  </div>
                </div>
                <p>Income vs expenses</p>
              </div>

              <div>
                <div className="pie-chart snapshot-pie" style={{ background: spendingTypeSnapshotPie }}>
                  <div className="pie-chart-center">
                    <span>Spend</span>
                    <strong>{formatCurrency(displayedMonthExpenseTotal)}</strong>
                  </div>
                </div>
                <p>Essential vs discretionary</p>
              </div>
            </div>

            <div className="snapshot-lines">
              <div>
                <span>Income</span>
                <strong className="income-amount">{formatSignedCurrency(displayedMonthTotal)}</strong>
              </div>
              <div>
                <span>Expenses</span>
                <strong className="expense-amount">{formatExpenseCurrency(displayedMonthExpenseTotal)}</strong>
              </div>
              <div>
                <span>Net Available</span>
                <strong>{formatCurrency(displayedMonthNetTotal)}</strong>
              </div>
              <div>
                <span>Essential Spending</span>
                <strong className="expense-amount">{formatExpenseCurrency(displayedMonthEssentialExpenseTotal)}</strong>
              </div>
              <div>
                <span>Discretionary Spending</span>
                <strong className="expense-amount">{formatExpenseCurrency(displayedMonthDiscretionaryExpenseTotal)}</strong>
              </div>
            </div>
          </article>

          <article className="snapshot-card">
            <h3>Starter Categories</h3>
            <div className="budget-list">
              {starterBudgets.map((budget) => (
                <article className="budget-card" key={budget.id}>
                  <div>
                    <h3>{budget.name}</h3>
                    <p>
                      ${budget.spent} planned of ${budget.limit}
                    </p>
                  </div>
                  <progress value={budget.spent} max={budget.limit}>
                    {Math.round((budget.spent / budget.limit) * 100)}%
                  </progress>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="goals-panel" aria-labelledby="goals-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Goals</p>
              <h2 id="goals-heading">Possible Goals</h2>
            </div>
          </div>

          <form className="goal-form" onSubmit={handleBudgetGoalSubmit}>
            <label>
              Goal name
              <input
                name="name"
                onChange={handleBudgetGoalChange}
                placeholder="ex. Emergency fund"
                required
                type="text"
                value={budgetGoalForm.name}
              />
            </label>

            <label>
              Already saved
              <input
                min="0"
                name="currentAmount"
                onChange={handleBudgetGoalChange}
                placeholder="50"
                step="0.01"
                type="number"
                value={budgetGoalForm.currentAmount}
              />
            </label>

            <label>
              Target amount
              <input
                min="1"
                name="targetAmount"
                onChange={handleBudgetGoalChange}
                placeholder="500"
                required
                step="0.01"
                type="number"
                value={budgetGoalForm.targetAmount}
              />
            </label>

            <label>
              Needed by
              <input
                min={formatDateInput(today)}
                name="targetDate"
                onChange={handleBudgetGoalChange}
                required
                type="date"
                value={budgetGoalForm.targetDate}
              />
            </label>

            <button type="submit">Add Goal</button>
          </form>

          <div className="goal-list">
            {budgetGoals.map((goal) => {
              const currentAmount = Number(goal.currentAmount || 0);
              const remainingAmount = Math.max(Number(goal.targetAmount) - currentAmount, 0);
              const estimatedDate = estimateGoalDate(remainingAmount, currentMonthNetTotal, today);
              const targetDate = parseLocalDate(goal.targetDate);
              const canMeetGoal = estimatedDate && estimatedDate <= targetDate;
              const progress = Math.min(100, (currentAmount / Number(goal.targetAmount)) * 100);

              return (
                <article className="goal-card" key={goal.id}>
                  <div>
                    <h3>{goal.name}</h3>
                    <p>{formatCurrency(remainingAmount)} left of {formatCurrency(goal.targetAmount)} by {formatLongDate(targetDate)}</p>
                    <progress value={progress} max="100">
                      {Math.round(progress)}%
                    </progress>
                  </div>
                  <div className={canMeetGoal ? 'goal-status is-on-track' : 'goal-status'}>
                    <span>{estimatedDate ? 'Could be met by' : 'Needs more net income'}</span>
                    <strong>{estimatedDate ? formatLongDate(estimatedDate) : 'Not projected yet'}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
      </section>
      </>
      )}
    </main>
  );
}

export default App;
