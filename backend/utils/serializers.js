export function serializeUser(user) {
  return {
    createdAt: user.createdAt,
    dateOfBirth: user.dateOfBirth,
    email: user.email,
    firstName: user.firstName,
    id: user.id,
    lastName: user.lastName,
  };
}

export function serializeIncomeSource(incomeSource) {
  return {
    ...incomeSource,
    amount: Number(incomeSource.amount),
    compensationType: incomeSource.compensationType,
    estimatedTaxRate:
      incomeSource.estimatedTaxRate === null ? null : Number(incomeSource.estimatedTaxRate),
    grossAmount: incomeSource.grossAmount === null ? null : Number(incomeSource.grossAmount),
    hourlyRate: incomeSource.hourlyRate === null ? null : Number(incomeSource.hourlyRate),
    hoursPerPeriod:
      incomeSource.hoursPerPeriod === null ? null : Number(incomeSource.hoursPerPeriod),
    name: incomeSource.jobName,
  };
}

export function serializeExpenseSource(expenseSource) {
  return {
    ...expenseSource,
    amount: Number(expenseSource.amount),
  };
}

export function serializeBudgetCategory(budgetCategory) {
  return {
    ...budgetCategory,
    limit: Number(budgetCategory.limit),
    spent: Number(budgetCategory.spent),
  };
}
