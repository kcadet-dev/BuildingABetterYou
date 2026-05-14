import {
  apiBaseUrl,
  addMonths,
  createDefaultBudgetForm,
  createDefaultExpenseForm,
  createDefaultGoalForm,
  createDefaultIncomeForm,
  emptyAuthForm,
  expenseCategoryOptions,
  formatDateInput,
  getExpensePaymentKey,
  getGoalPaymentKey,
  getIncomePaymentKey,
  isPaymentConfirmed,
  normalizeBudgetCategory,
  normalizeExpenseSource,
  normalizeIncomeSource,
} from '../lib/budgetHelpers.js';
import { useBudgetAppState } from './useBudgetAppState.js';
import { useBudgetDerivedData } from './useBudgetDerivedData.js';
import { useBudgetEffects } from './useBudgetEffects.js';

export function useBabyFinanceApp() {
  const state = useBudgetAppState();
  const derived = useBudgetDerivedData(state);

  useBudgetEffects(state, derived);

  const {
    authMode,
    budgetCategoryForm,
    budgetGoalForm,
    currentMonthStart,
    confirmedExpensePayments,
    confirmedIncomePayments,
    editingExpenseSourceId,
    editingGoalId,
    editingIncomeSourceId,
    expenseForm,
    formData,
    incomeForm,
    profileForm,
    selectedMonth,
    selectedMonthRange,
    selectedWeekRange,
    setActivePage,
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
    setExpenseForm,
    setExpenseMessage,
    setExpenseSources,
    setFormData,
    setGoalMessage,
    setHasAppliedEstimate,
    setIncomeForm,
    setIncomeMessage,
    setIncomeSources,
    setIsEditingProfile,
    setIsSavingBudgetLimit,
    setIsSavingExpense,
    setIsSavingIncome,
    setIsSavingProfile,
    setIsSubmitting,
    setMessage,
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
  } = state;

  const {
    accountStartMonth,
    allocationLabel,
    detailNetTotal,
    estimatedNetPay,
  } = derived;

  const handleChange = (event) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleProfileChange = (event) => {
    setProfileForm((currentProfileForm) => ({
      ...currentProfileForm,
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

  const resetProfileEditor = () => {
    setIsEditingProfile(false);
    setProfileMessage('');
    setProfileForm({
      dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };

  const handleBudgetCategoryChange = (event) => {
    setBudgetCategoryForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileMessage('');

    if (!user?.id) {
      setProfileMessage('Log in before updating account details.');
      return;
    }

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.email.trim() || !profileForm.dateOfBirth) {
      setProfileMessage('First name, last name, date of birth, and email are required.');
      return;
    }

    if (!profileForm.email.includes('@')) {
      setProfileMessage('Enter a valid email address.');
      return;
    }

    setIsSavingProfile(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateOfBirth: profileForm.dateOfBirth,
          email: profileForm.email,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not update account details.');
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
      setProfileMessage('Account details updated.');
      setIsEditingProfile(false);
    } catch (error) {
      setProfileMessage(error.message);
    } finally {
      setIsSavingProfile(false);
    }
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
        nextIncomeForm.amount = estimatedNetPay > 0 ? estimatedNetPay.toFixed(2) : currentIncomeForm.amount;
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
      category: expenseForm.category === 'custom' ? expenseForm.customCategory.trim() : expenseForm.category,
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

    if (nextMonth > state.finalMonthStart) {
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
    ...state,
    ...derived,
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
    handleProfileChange,
    handleProfileSubmit,
    handleSubmit,
    handleUnconfirmGoalPayment,
    navigateMonth,
    resetExpenseEditor,
    resetGoalEditor,
    resetIncomeEditor,
    resetProfileEditor,
    toggleExpenseConfirmation,
    toggleIncomeConfirmation,
  };
}
