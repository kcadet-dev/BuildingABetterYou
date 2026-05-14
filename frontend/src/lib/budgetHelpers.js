const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly', intervalDays: 7 },
  { value: 'biweekly', label: 'Bi-weekly', intervalDays: 14 },
  { value: 'semimonthly', label: 'Semi-monthly', intervalDays: 15 },
  { value: 'monthly', label: 'Monthly', intervalDays: null },
  { value: 'one_time', label: 'One-time', intervalDays: null },
];

const starterGoals = [
  {
    contributionAmount: 25,
    contributionFrequency: 'weekly',
    currentAmount: 75,
    firstContributionDate: '2026-05-15',
    id: 1,
    name: 'Emergency Cushion',
    payments: [],
    targetAmount: 500,
    targetDate: '2026-08-01',
  },
  {
    contributionAmount: 20,
    contributionFrequency: 'weekly',
    currentAmount: 25,
    firstContributionDate: '2026-05-15',
    id: 2,
    name: 'Textbooks',
    payments: [],
    targetAmount: 250,
    targetDate: '2026-06-15',
  },
];
const chartColors = ['#15803d', '#22c55e', '#86efac', '#16a34a', '#4ade80', '#bbf7d0'];
const expenseChartColors = ['#ef4444', '#f87171', '#fca5a5', '#fb7185', '#fecaca', '#fda4af'];
const expenseCategoryOptions = [
  { label: 'Housing', type: 'priority', value: 'Housing' },
  { label: 'Utilities', type: 'priority', value: 'Utilities' },
  { label: 'Groceries', type: 'essential', value: 'Groceries' },
  { label: 'Transportation', type: 'essential', value: 'Transportation' },
  { label: 'Health', type: 'essential', value: 'Health' },
  { label: 'Debt Repayment', type: 'priority', value: 'Debt Repayment' },
  { label: 'Dining & Drinks', type: 'discretionary', value: 'Dining & Drinks' },
  { label: 'Entertainment', type: 'discretionary', value: 'Entertainment' },
  { label: 'Shopping', type: 'discretionary', value: 'Shopping' },
  { label: 'Personal Care', type: 'discretionary', value: 'Personal Care' },
  { label: 'Travel', type: 'discretionary', value: 'Travel' },
  { label: 'Custom Category', type: 'essential', value: 'custom' },
];
const categoryAdvice = {
  'Dining & Drinks': 'Try setting a weekly eating-out cap and save takeout for the meals you actually look forward to.',
  Entertainment: 'Rotate subscriptions instead of keeping every service active at the same time.',
  Groceries: "Look around your area for special promotions on grocery items and consider shopping at private label chains like Trader Joe's.",
  Health: 'Check whether prescriptions, co-pays, or supplies have lower-cost generic or mail-order options.',
  'Personal Care': 'Stretch appointments when you can and compare prices for routine grooming or gym memberships.',
  Shopping: 'Use a 24-hour wait rule before buying non-urgent clothing, electronics, books, or extras.',
  Transportation: 'Compare fuel, transit, and insurance costs occasionally so routine travel does not quietly creep up.',
  Travel: 'Set a trip fund first, then book around flexible dates and off-peak prices when possible.',
  Utilities: 'Review plans once in a while, especially phone and internet, to make sure you are not overpaying.',
};
const authStorageKey = 'baby-finance-auth-session';
const confirmedExpenseStoragePrefix = 'baby-finance-confirmed-expense';
const confirmedIncomeStoragePrefix = 'baby-finance-confirmed-income';
const goalsStoragePrefix = 'baby-finance-goals';
const unconfirmedExpenseStoragePrefix = 'baby-finance-unconfirmed-expense';
const unconfirmedIncomeStoragePrefix = 'baby-finance-unconfirmed-income';
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

function getGoalsStorageKey(userId) {
  return `${goalsStoragePrefix}-${userId}`;
}

function getConfirmedIncomeStorageKey(userId) {
  return `${confirmedIncomeStoragePrefix}-${userId}`;
}

function getUnconfirmedIncomeStorageKey(userId) {
  return `${unconfirmedIncomeStoragePrefix}-${userId}`;
}

function getConfirmedExpenseStorageKey(userId) {
  return `${confirmedExpenseStoragePrefix}-${userId}`;
}

function getUnconfirmedExpenseStorageKey(userId) {
  return `${unconfirmedExpenseStoragePrefix}-${userId}`;
}

function readStoredList(userId, getStorageKey, fallback) {
  if (!userId || typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return fallback;
  }

  try {
    const rawItems = globalThis.localStorage.getItem(getStorageKey(userId));

    if (!rawItems) {
      return fallback;
    }

    const parsedItems = JSON.parse(rawItems);

    return Array.isArray(parsedItems) ? parsedItems : fallback;
  } catch {
    return fallback;
  }
}

function normalizeStoredGoals(goals) {
  return goals.map((goal) => {
    if (!isGoalPaidOff(goal) || goal.completedAt) {
      return goal;
    }

    const latestPayment = [...(goal.payments || [])].sort((firstPayment, secondPayment) =>
      firstPayment.date.localeCompare(secondPayment.date),
    ).at(-1);

    return {
      ...goal,
      completedAt: latestPayment?.date || goal.targetDate,
    };
  });
}

function readStoredGoals(userId) {
  if (!userId || typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return starterGoals;
  }

  try {
    const rawGoals = globalThis.localStorage.getItem(getGoalsStorageKey(userId));

    if (!rawGoals) {
      return normalizeStoredGoals(starterGoals);
    }

    const parsedGoals = JSON.parse(rawGoals);

    return Array.isArray(parsedGoals) ? normalizeStoredGoals(parsedGoals) : normalizeStoredGoals(starterGoals);
  } catch {
    return normalizeStoredGoals(starterGoals);
  }
}

function createDefaultBudgetForm(overrides = {}) {
  return {
    limit: '',
    name: 'Groceries',
    ...overrides,
  };
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

function formatPercent(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    style: 'percent',
  }).format(value || 0);
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
    spendingType: 'priority',
    ...overrides,
  };
}

function normalizeBudgetCategory(budgetCategory) {
  return {
    ...budgetCategory,
    limit: Number(budgetCategory.limit),
    spent: Number(budgetCategory.spent || 0),
  };
}

function createDefaultGoalForm(today, overrides = {}) {
  return {
    contributionAmount: '',
    contributionFrequency: 'weekly',
    currentAmount: '',
    firstContributionDate: formatDateInput(today),
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

function isGoalPaidOff(goal) {
  return Number(goal.currentAmount || 0) >= Number(goal.targetAmount || 0);
}

function isGoalCashEvent(goalEvent) {
  return goalEvent.type === 'contribution' || goalEvent.type === 'payment';
}

function getGoalPaymentKey(goalId, date) {
  return `${goalId}-${formatDateInput(date)}`;
}

function getIncomePaymentKey(income) {
  return `${income.incomeSourceId}-${formatDateInput(income.date)}`;
}

function getExpensePaymentKey(expense) {
  return `${expense.expenseSourceId}-${formatDateInput(expense.date)}`;
}

function isPastDate(date, today) {
  return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function isPaymentConfirmed(paymentKey, date, confirmedPayments, unconfirmedPayments, today) {
  if (unconfirmedPayments.includes(paymentKey)) {
    return false;
  }

  return isPastDate(date, today) || confirmedPayments.includes(paymentKey);
}

function hasGoalPaymentForDate(goal, date) {
  const paymentKey = getGoalPaymentKey(goal.id, date);

  return (goal.payments || []).some((payment) => payment.paymentKey === paymentKey);
}

function getGoalScheduledDate(goal, startDate, endDate) {
  const frequency = frequencyOptions.find((option) => option.value === goal.contributionFrequency);
  let occurrenceDate = parseLocalDate(goal.firstContributionDate || goal.targetDate);

  while (occurrenceDate <= endDate) {
    if (occurrenceDate >= startDate) {
      return occurrenceDate;
    }

    if (goal.contributionFrequency === 'one_time') {
      return null;
    }

    occurrenceDate =
      frequency?.value === 'monthly'
        ? addMonths(occurrenceDate, 1)
        : addDays(occurrenceDate, frequency?.intervalDays || 7);
  }

  return null;
}

function estimateGoalDateFromPlan(goal, today) {
  const remainingAmount = Math.max(Number(goal.targetAmount) - Number(goal.currentAmount || 0), 0);
  const contributionAmount = Number(goal.contributionAmount || 0);

  if (remainingAmount <= 0) {
    return today;
  }

  if (contributionAmount <= 0) {
    return null;
  }

  if (goal.contributionFrequency === 'one_time' && contributionAmount < remainingAmount) {
    return null;
  }

  const frequency = frequencyOptions.find((option) => option.value === goal.contributionFrequency);
  const paymentsNeeded = Math.ceil(remainingAmount / contributionAmount);
  let estimatedDate = parseLocalDate(goal.firstContributionDate || formatDateInput(today));

  if (estimatedDate < today) {
    estimatedDate = today;
  }

  for (let count = 1; count < paymentsNeeded; count += 1) {
    estimatedDate =
      frequency?.value === 'monthly'
        ? addMonths(estimatedDate, 1)
        : addDays(estimatedDate, frequency?.intervalDays || 7);
  }

  return estimatedDate;
}

function buildGoalEvent(goal, date, type, today) {
  const remainingAmount = Math.max(Number(goal.targetAmount) - Number(goal.currentAmount || 0), 0);

  return {
    ...goal,
    amount: Number(goal.contributionAmount || 0),
    currentAmount: Number(goal.currentAmount || 0),
    date,
    estimatedDate: estimateGoalDateFromPlan(goal, today),
    eventId: `${goal.id}-${type}-${formatDateInput(date)}`,
    remainingAmount,
    targetAmount: Number(goal.targetAmount),
    type,
  };
}

function getGoalCalendarItems(goals, monthStart, monthEnd, today) {
  return goals.flatMap((goal) => {
    const targetDate = parseLocalDate(goal.targetDate);
    const events = [];
    const scheduledDate = getGoalScheduledDate(goal, monthStart, monthEnd);
    const completedDate = goal.completedAt ? parseLocalDate(goal.completedAt) : null;
    const paymentEvents = (goal.payments || [])
      .map((payment) => ({
        ...buildGoalEvent(goal, parseLocalDate(payment.date), 'payment', today),
        amount: Number(payment.amount),
        eventId: `${goal.id}-payment-${payment.id}`,
        paymentId: payment.id,
      }))
      .filter((payment) => isDateInRange(payment.date, monthStart, monthEnd));

    if (scheduledDate && !isGoalPaidOff(goal) && !hasGoalPaymentForDate(goal, scheduledDate)) {
      events.push(buildGoalEvent(goal, scheduledDate, 'contribution', today));
    }

    events.push(...paymentEvents);

    if (completedDate && isDateInRange(completedDate, monthStart, monthEnd)) {
      events.push(buildGoalEvent(goal, completedDate, 'paid_off', today));
    }

    if (isDateInRange(targetDate, monthStart, monthEnd)) {
      events.push(buildGoalEvent(goal, targetDate, 'deadline', today));
    }

    return events;
  });
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
  const previewItems = [];

  if (calendarDay.paydays.length > 0) {
    previewItems.push({ item: calendarDay.paydays[0], type: 'income' });
  }

  if (calendarDay.expenses.length > 0) {
    previewItems.push({ item: calendarDay.expenses[0], type: 'expense' });
  }

  if (calendarDay.goals.length > 0) {
    previewItems.push({ item: calendarDay.goals[0], type: 'goal' });
  }

  const remainingItems = [
    ...calendarDay.paydays.slice(previewItems.some((previewItem) => previewItem.type === 'income') ? 1 : 0)
      .map((payday) => ({ item: payday, type: 'income' })),
    ...calendarDay.expenses.slice(previewItems.some((previewItem) => previewItem.type === 'expense') ? 1 : 0)
      .map((expense) => ({ item: expense, type: 'expense' })),
    ...calendarDay.goals.slice(previewItems.some((previewItem) => previewItem.type === 'goal') ? 1 : 0)
      .map((goal) => ({ item: goal, type: 'goal' })),
  ];

  return [...previewItems, ...remainingItems].slice(0, 3);
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
      color: name === 'Goals' ? '#facc15' : expenseChartColors[index % expenseChartColors.length],
      name,
      share: grandTotal === 0 ? 0 : amount / grandTotal,
    }));
}

function buildDiscretionarySavingsItems(expenses) {
  const totals = new Map();

  expenses
    .filter((expense) => expense.spendingType === 'discretionary')
    .forEach((expense) => {
      totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
    });

  return Array.from(totals.entries())
    .sort((firstItem, secondItem) => secondItem[1] - firstItem[1])
    .map(([name, amount]) => ({
      amount,
      advice:
        categoryAdvice[name] ||
        'Look for a more affordable version of one product or service in this category before cutting it out completely. Look for one small repeat purchase in this category that you could reduce or delay this month.',
      name,
    }));
}

function formatChartTooltip(items) {
  if (items.length === 0) {
    return 'No categories yet';
  }

  return items
    .map((item) => `${item.name}: ${formatCurrency(item.amount)} (${formatPercent(item.share)})`)
    .join('\n');
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

function buildNetSnapshotItems(incomeTotal, expenseTotal, goalTotal) {
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
    {
      amount: Math.max(goalTotal, 0),
      color: '#facc15',
      name: 'Goals',
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
      color: '#93c5fd',
      name: 'Essential',
    },
    {
      amount: Math.max(discretionaryTotal, 0),
      color: '#3b82f6',
      name: 'Discretionary',
    },
  ];
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return items.map((item) => ({
    ...item,
    share: total === 0 ? 0 : item.amount / total,
  }));
}


export {
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
  estimateGoalDateFromPlan,
  expenseCategoryOptions,
  formatChartTooltip,
  formatCurrency,
  formatDateInput,
  formatExpenseCurrency,
  formatLongDate,
  formatOptionalDate,
  formatPercent,
  formatSignedCurrency,
  frequencyOptions,
  getCalendarPreviewItems,
  getCalendarWeekRange,
  getConfirmedExpenseStorageKey,
  getConfirmedIncomeStorageKey,
  getExpensePaymentKey,
  getFrequencyLabel,
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
};
