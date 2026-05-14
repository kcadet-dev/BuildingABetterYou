import { useMemo } from 'react';
import {
  buildBreakdown,
  buildCalendarDays,
  buildCalendarWeeks,
  buildDiscretionarySavingsItems,
  buildExpenseBreakdown,
  buildPieGradient,
  buildSpendingTypeSnapshotItems,
  expenseCategoryOptions,
  formatChartTooltip,
  formatLongDate,
  getExpensePaymentKey,
  getGoalCalendarItems,
  getIncomePaymentKey,
  getMonthStart,
  getOccurrencesForExpenseSource,
  getOccurrencesForIncomeSource,
  getWorkWeekRange,
  isDateInRange,
  isGoalCashEvent,
  isGoalPaidOff,
  isPaymentConfirmed,
  isSameDay,
  parseLocalDate,
} from '../lib/budgetHelpers.js';

export function useBudgetDerivedData(state) {
  const {
    budgetCategories,
    budgetGoals,
    confirmedExpensePayments,
    confirmedIncomePayments,
    currentMonthEnd,
    currentMonthStart,
    expenseChartPeriod,
    expenseSources,
    finalMonthStart,
    incomeChartPeriod,
    incomeForm,
    incomeSources,
    netSnapshotPeriod,
    selectedDay,
    selectedMonth,
    selectedMonthRange,
    selectedWeekRange,
    today,
    unconfirmedExpensePayments,
    unconfirmedIncomePayments,
    user,
    yearEnd,
  } = state;

  const workWeek = useMemo(() => getWorkWeekRange(today), [today]);
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
    () => incomeSources.flatMap((incomeSource) => getOccurrencesForIncomeSource(incomeSource, today, currentMonthEnd)),
    [currentMonthEnd, incomeSources, today],
  );
  const currentMonthExpenses = useMemo(
    () => expenseSources.flatMap((expenseSource) => getOccurrencesForExpenseSource(expenseSource, today, currentMonthEnd)),
    [currentMonthEnd, expenseSources, today],
  );
  const workWeekIncome = useMemo(
    () => incomeSources.flatMap((incomeSource) => getOccurrencesForIncomeSource(incomeSource, workWeek.start, workWeek.end)),
    [incomeSources, workWeek.end, workWeek.start],
  );
  const workWeekExpenses = useMemo(
    () => expenseSources.flatMap((expenseSource) => getOccurrencesForExpenseSource(expenseSource, workWeek.start, workWeek.end)),
    [expenseSources, workWeek.end, workWeek.start],
  );
  const yearIncome = useMemo(
    () => incomeSources.flatMap((incomeSource) => getOccurrencesForIncomeSource(incomeSource, today, yearEnd)),
    [incomeSources, today, yearEnd],
  );
  const yearExpenses = useMemo(
    () => expenseSources.flatMap((expenseSource) => getOccurrencesForExpenseSource(expenseSource, today, yearEnd)),
    [expenseSources, today, yearEnd],
  );
  const displayedMonthIncome = useMemo(
    () => incomeSources.flatMap((incomeSource) => getOccurrencesForIncomeSource(incomeSource, selectedMonth, displayedMonthEnd)),
    [displayedMonthEnd, incomeSources, selectedMonth],
  );
  const displayedMonthExpenses = useMemo(
    () => expenseSources.flatMap((expenseSource) => getOccurrencesForExpenseSource(expenseSource, selectedMonth, displayedMonthEnd)),
    [displayedMonthEnd, expenseSources, selectedMonth],
  );
  const selectedDayIncome = useMemo(
    () => (selectedDay ? displayedMonthIncome.filter((income) => isSameDay(income.date, selectedDay)) : []),
    [displayedMonthIncome, selectedDay],
  );
  const selectedDayExpenses = useMemo(
    () => (selectedDay ? displayedMonthExpenses.filter((expense) => isSameDay(expense.date, selectedDay)) : []),
    [displayedMonthExpenses, selectedDay],
  );
  const displayedMonthGoals = useMemo(
    () => getGoalCalendarItems(budgetGoals, selectedMonth, displayedMonthEnd, today),
    [budgetGoals, displayedMonthEnd, selectedMonth, today],
  );
  const selectedDayGoals = useMemo(
    () => (selectedDay ? displayedMonthGoals.filter((goal) => isSameDay(goal.date, selectedDay)) : []),
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
    goalItems.filter((goal) => goal.type === 'payment').reduce((total, goal) => total + goal.amount, 0);

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
  const displayedMonthPriorityExpenseTotal = displayedMonthExpenses
    .filter((expense) => expense.spendingType === 'priority')
    .reduce((total, expense) => total + expense.amount, 0);
  const displayedMonthEssentialExpenseTotal = displayedMonthExpenses
    .filter((expense) => expense.spendingType === 'essential')
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
      expenseCategoryOptions.filter((option) => option.value !== 'custom').map((option) => option.value),
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
    return Array.from(categoryNames).sort((firstName, secondName) => firstName.localeCompare(secondName));
  }, [budgetCategories, expenseSources]);
  const budgetCategorySummaries = budgetCategories.map((category) => {
    const spent = displayedMonthExpenseByCategory.get(category.name) || 0;
    const limit = Number(category.limit);
    return { ...category, isOverBudget: spent > limit, limit, remaining: limit - spent, spent };
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
        ? displayedMonthIncome.filter((income) => isDateInRange(income.date, selectedWeekRange.start, selectedWeekRange.end))
        : [],
    [displayedMonthIncome, selectedWeekRange],
  );
  const selectedWeekExpenses = useMemo(
    () =>
      selectedWeekRange
        ? displayedMonthExpenses.filter((expense) => isDateInRange(expense.date, selectedWeekRange.start, selectedWeekRange.end))
        : [],
    [displayedMonthExpenses, selectedWeekRange],
  );
  const selectedWeekGoals = useMemo(
    () =>
      selectedWeekRange
        ? displayedMonthGoals.filter((goal) => isDateInRange(goal.date, selectedWeekRange.start, selectedWeekRange.end))
        : [],
    [displayedMonthGoals, selectedWeekRange],
  );
  const detailIncome = selectedMonthRange ? displayedMonthIncome : selectedWeekRange ? selectedWeekIncome : selectedDayIncome;
  const detailExpenses = selectedMonthRange ? displayedMonthExpenses : selectedWeekRange ? selectedWeekExpenses : selectedDayExpenses;
  const detailGoals = selectedMonthRange ? displayedMonthGoals : selectedWeekRange ? selectedWeekGoals : selectedDayGoals;
  const detailSelectionLabel = selectedMonthRange
    ? displayedMonthLabel
    : selectedWeekRange
      ? `${formatLongDate(selectedWeekRange.start)} to ${formatLongDate(selectedWeekRange.end)}`
      : selectedDay
        ? formatLongDate(selectedDay)
        : 'No Day Selected';
  const hasDetailSelection = Boolean(selectedDay || selectedWeekRange || selectedMonthRange);
  const detailGoalTotal = detailGoals.reduce((total, goal) => total + (isGoalCashEvent(goal) ? goal.amount : 0), 0);
  const detailNetTotal =
    detailIncome.reduce((total, income) => total + income.amount, 0) -
    detailExpenses.reduce((total, expense) => total + expense.amount, 0) -
    detailGoalTotal;
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
  const detailActualGoalTotal = detailGoals.filter((goal) => goal.type === 'payment').reduce((total, goal) => total + goal.amount, 0);
  const detailActualNetTotal = detailActualIncomeTotal - detailActualExpenseTotal - detailActualGoalTotal;
  const canAllocateGoalNet = Boolean(selectedWeekRange || selectedMonthRange) && detailNetTotal > 0;
  const allocationLabel = selectedMonthRange ? 'month' : 'week';

  const chartIncome = incomeChartPeriod === 'weekly' ? workWeekIncome : incomeChartPeriod === 'yearly' ? yearIncome : displayedMonthIncome;
  const chartExpenses = expenseChartPeriod === 'weekly' ? workWeekExpenses : expenseChartPeriod === 'yearly' ? yearExpenses : displayedMonthExpenses;
  const chartGoalPayments = expenseChartPeriod === 'weekly' ? workWeekGoals : expenseChartPeriod === 'yearly' ? yearGoals : displayedMonthGoals;
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
  const chartPriorityExpenseTotal = chartExpenses
    .filter((expense) => expense.spendingType === 'priority')
    .reduce((total, expense) => total + expense.amount, 0);
  const chartEssentialExpenseTotal = chartExpenses
    .filter((expense) => expense.spendingType === 'essential')
    .reduce((total, expense) => total + expense.amount, 0);
  const chartDiscretionaryExpenseTotal = chartExpenseItems
    .filter((expense) => expense.spendingType === 'discretionary' || expense.spendingType === 'goal')
    .reduce((total, expense) => total + expense.amount, 0);
  const chartPeriodLabels = {
    monthly: displayedMonthLabel,
    weekly: `${formatLongDate(workWeek.start)} to ${formatLongDate(workWeek.end)}`,
    yearly: `through ${formatLongDate(yearEnd)}`,
  };
  const netSnapshotLabel =
    netSnapshotPeriod === 'weekly'
      ? `${formatLongDate(workWeek.start)} to ${formatLongDate(workWeek.end)}`
      : netSnapshotPeriod === 'yearly'
        ? `through ${formatLongDate(yearEnd)}`
        : displayedMonthLabel;
  const netSnapshotPlannedTotal =
    netSnapshotPeriod === 'weekly' ? workWeekNetTotal : netSnapshotPeriod === 'yearly' ? yearNetTotal : displayedMonthNetTotal;
  const netSnapshotActualTotal =
    netSnapshotPeriod === 'weekly'
      ? workWeekActualNetTotal
      : netSnapshotPeriod === 'yearly'
        ? yearActualNetTotal
        : displayedMonthActualNetTotal;
  const selectedIncomeBreakdown = useMemo(() => buildBreakdown(chartIncome), [chartIncome]);
  const selectedExpenseBreakdown = useMemo(() => buildExpenseBreakdown(chartExpenseItems), [chartExpenseItems]);
  const selectedMonthPie = useMemo(() => buildPieGradient(selectedIncomeBreakdown), [selectedIncomeBreakdown]);
  const expensePie = useMemo(() => buildPieGradient(selectedExpenseBreakdown, '#edf2f7'), [selectedExpenseBreakdown]);
  const expenseTypePie = useMemo(
    () =>
      buildPieGradient(
        buildSpendingTypeSnapshotItems(chartPriorityExpenseTotal, chartEssentialExpenseTotal, chartDiscretionaryExpenseTotal),
        '#edf2f7',
      ),
    [chartDiscretionaryExpenseTotal, chartEssentialExpenseTotal, chartPriorityExpenseTotal],
  );
  const incomePieTooltip = useMemo(() => formatChartTooltip(selectedIncomeBreakdown), [selectedIncomeBreakdown]);
  const expensePieTooltip = useMemo(() => formatChartTooltip(selectedExpenseBreakdown), [selectedExpenseBreakdown]);
  const spendingTypeSnapshotItems = useMemo(
    () =>
      buildSpendingTypeSnapshotItems(
        displayedMonthPriorityExpenseTotal,
        displayedMonthEssentialExpenseTotal,
        displayedMonthDiscretionaryExpenseTotal + displayedMonthGoalTotal,
      ),
    [
      displayedMonthDiscretionaryExpenseTotal,
      displayedMonthEssentialExpenseTotal,
      displayedMonthGoalTotal,
      displayedMonthPriorityExpenseTotal,
    ],
  );
  const spendingTypeSnapshotPie = useMemo(
    () => buildPieGradient(spendingTypeSnapshotItems, '#edf2f7'),
    [spendingTypeSnapshotItems],
  );
  const spendingTypeTooltip = useMemo(() => formatChartTooltip(spendingTypeSnapshotItems), [spendingTypeSnapshotItems]);

  const isEstimateVisible = incomeForm.useTaxEstimate;
  const estimatedGrossPay = !incomeForm.useTaxEstimate
    ? 0
    : incomeForm.compensationType === 'salaried'
      ? Number(incomeForm.grossAmount || 0)
      : Number(incomeForm.hourlyRate || 0) * Number(incomeForm.hoursPerPeriod || 0);
  const estimatedNetPay = estimatedGrossPay * (1 - Number(incomeForm.estimatedTaxRate || 0) / 100);
  const userId = user?.id;

  return {
    accountStartMonth,
    activeGoals,
    allocationLabel,
    budgetCategoryOptions,
    budgetCategorySummaries,
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
    chartPriorityExpenseTotal,
    closestActiveGoal,
    completedGoals,
    currentMonthActualIncomeTotal,
    currentMonthActualNetTotal,
    currentMonthAvailableToBudget,
    currentMonthExpenseTotal,
    currentMonthExpenses,
    currentMonthGoalTotal,
    currentMonthGoals,
    currentMonthIncome,
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
    displayedMonthExpenseByCategory,
    displayedMonthExpenseTotal,
    displayedMonthExpenses,
    displayedMonthGoalTotal,
    displayedMonthGoals,
    displayedMonthIncome,
    displayedMonthLabel,
    displayedMonthNetTotal,
    displayedMonthPriorityExpenseTotal,
    displayedMonthSpendingTypeTotal,
    displayedMonthTotal,
    estimatedGrossPay,
    estimatedNetPay,
    expensePie,
    expensePieTooltip,
    expenseTypePie,
    hasDetailSelection,
    incomePieTooltip,
    isEstimateVisible,
    netSnapshotActualTotal,
    netSnapshotLabel,
    netSnapshotPlannedTotal,
    nextBillDue,
    nextPayday,
    overBudgetCategories,
    selectedDayExpenseTotal,
    selectedDayTotal,
    selectedExpenseBreakdown,
    selectedIncomeBreakdown,
    selectedMonthPie,
    spendingTypeSnapshotItems,
    spendingTypeSnapshotPie,
    spendingTypeTooltip,
    today,
    userId,
    workWeek,
    workWeekActualNetTotal,
    workWeekExpenseTotal,
    workWeekExpenses,
    workWeekGoalTotal,
    workWeekGoals,
    workWeekIncome,
    workWeekNetTotal,
    workWeekTotal,
    yearActualIncomeTotal,
    yearActualNetTotal,
    yearEnd,
    yearExpenseTotal,
    yearExpenses,
    yearGoalTotal,
    yearGoals,
    yearIncome,
    yearNetTotal,
    yearTotal,
  };
}
