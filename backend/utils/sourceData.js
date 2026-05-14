export function buildBudgetCategoryData(payload, userId) {
  const name = String(payload.name || '').trim();
  const limit = Number(payload.limit);

  if (!name) {
    return { error: 'Choose a budget category before saving a limit.' };
  }

  if (Number.isNaN(limit) || limit <= 0) {
    return { error: 'Monthly limit must be greater than 0.' };
  }

  return {
    data: {
      limit,
      name,
      spent: 0,
      userId,
    },
  };
}

export function buildExpenseSourceData(payload, userId) {
  const { amount, category, frequency, name, nextDueDate, spendingType } = payload;
  const sourceName = String(name || '').trim();
  const sourceCategory = String(category || '').trim();
  const normalizedSpendingType =
    spendingType === 'discretionary'
      ? 'discretionary'
      : spendingType === 'priority'
        ? 'priority'
        : 'essential';
  const expenseAmount = Number(amount);

  if (!sourceName || !sourceCategory || !frequency || !nextDueDate) {
    return { error: 'Expense name, category, frequency, and first due date are required.' };
  }

  if (Number.isNaN(expenseAmount) || expenseAmount <= 0) {
    return { error: 'Expense amount must be greater than 0.' };
  }

  return {
    data: {
      amount: expenseAmount,
      category: sourceCategory,
      frequency,
      name: sourceName,
      nextDueDate: new Date(nextDueDate),
      spendingType: normalizedSpendingType,
      userId,
    },
  };
}

export function buildIncomeSourceData(payload, userId) {
  const {
    amount,
    compensationType,
    estimatedTaxRate,
    frequency,
    grossAmount,
    hourlyRate,
    hoursPerPeriod,
    jobName,
    name,
    nextPayDate,
  } = payload;
  const sourceName = String(name || jobName || '').trim();
  const incomeAmount = Number(amount);
  const parsedGrossAmount =
    grossAmount === '' || grossAmount === null || grossAmount === undefined ? null : Number(grossAmount);
  const parsedTaxRate =
    estimatedTaxRate === '' || estimatedTaxRate === null || estimatedTaxRate === undefined
      ? null
      : Number(estimatedTaxRate);
  const parsedHourlyRate =
    hourlyRate === '' || hourlyRate === null || hourlyRate === undefined ? null : Number(hourlyRate);
  const parsedHoursPerPeriod =
    hoursPerPeriod === '' || hoursPerPeriod === null || hoursPerPeriod === undefined
      ? null
      : Number(hoursPerPeriod);
  const normalizedCompensationType =
    compensationType === 'hourly' || compensationType === 'salaried' ? compensationType : null;

  if (!sourceName || !frequency || !nextPayDate) {
    return { error: 'Income source name, frequency, and first income date are required.' };
  }

  if (Number.isNaN(incomeAmount) || incomeAmount <= 0) {
    return { error: 'Income amount must be greater than 0.' };
  }

  if (
    normalizedCompensationType === 'salaried' &&
    (parsedGrossAmount === null || Number.isNaN(parsedGrossAmount) || parsedGrossAmount <= 0)
  ) {
    return { error: 'Gross salaried pay must be greater than 0.' };
  }

  if (
    normalizedCompensationType === 'hourly' &&
    ((parsedHourlyRate === null || parsedHourlyRate <= 0) ||
      (parsedHoursPerPeriod === null || parsedHoursPerPeriod <= 0))
  ) {
    return { error: 'Hourly rate and hours per pay period must be greater than 0.' };
  }

  if (parsedTaxRate !== null && (Number.isNaN(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100)) {
    return { error: 'Estimated tax rate must be between 0 and 100.' };
  }

  return {
    data: {
      amount: incomeAmount,
      compensationType: normalizedCompensationType,
      estimatedTaxRate: parsedTaxRate,
      frequency,
      grossAmount:
        normalizedCompensationType === null
          ? null
          : normalizedCompensationType === 'salaried'
            ? parsedGrossAmount
            : parsedHourlyRate * parsedHoursPerPeriod,
      hourlyRate: normalizedCompensationType === 'hourly' ? parsedHourlyRate : null,
      hoursPerPeriod: normalizedCompensationType === 'hourly' ? parsedHoursPerPeriod : null,
      isCash: false,
      jobName: sourceName,
      nextPayDate: new Date(nextPayDate),
      userId,
    },
  };
}
