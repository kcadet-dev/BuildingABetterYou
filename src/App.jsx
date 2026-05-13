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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(value);
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

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
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

function buildCalendarDays(monthStart, paydays, today) {
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const days = [];

  for (let index = 0; index < monthStart.getDay(); index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    days.push({
      date,
      isToday: isSameDay(date, today),
      paydays: paydays.filter((payday) => isSameDay(payday.date, date)),
    });
  }

  return days;
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

function App() {
  const today = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const currentMonthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  const yearEnd = useMemo(() => new Date(today.getFullYear(), 11, 31), [today]);
  const finalMonthStart = useMemo(() => new Date(today.getFullYear(), 11, 1), [today]);
  const workWeek = useMemo(() => getWorkWeekRange(today), [today]);

  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [incomeForm, setIncomeForm] = useState(createDefaultIncomeForm(today));
  const [incomeSources, setIncomeSources] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStart);
  const [selectedDay, setSelectedDay] = useState(today);
  const [editingIncomeSourceId, setEditingIncomeSourceId] = useState(null);
  const [activePlannerTab, setActivePlannerTab] = useState('income');
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [incomeMessage, setIncomeMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const canGoToPreviousMonth = selectedMonth > accountStartMonth;
  const canGoToNextMonth = selectedMonth < finalMonthStart;

  const currentMonthIncome = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getOccurrencesForIncomeSource(incomeSource, today, currentMonthEnd),
      ),
    [currentMonthEnd, incomeSources, today],
  );
  const workWeekIncome = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getOccurrencesForIncomeSource(incomeSource, workWeek.start, workWeek.end),
      ),
    [incomeSources, workWeek.end, workWeek.start],
  );
  const yearIncome = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getOccurrencesForIncomeSource(incomeSource, today, yearEnd),
      ),
    [incomeSources, today, yearEnd],
  );
  const displayedMonthIncome = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getOccurrencesForIncomeSource(incomeSource, selectedMonth, displayedMonthEnd),
      ),
    [displayedMonthEnd, incomeSources, selectedMonth],
  );
  const selectedDayIncome = useMemo(
    () => displayedMonthIncome.filter((income) => isSameDay(income.date, selectedDay)),
    [displayedMonthIncome, selectedDay],
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonth, displayedMonthIncome, today),
    [displayedMonthIncome, selectedMonth, today],
  );

  const workWeekTotal = workWeekIncome.reduce((total, income) => total + income.amount, 0);
  const selectedDayTotal = selectedDayIncome.reduce((total, income) => total + income.amount, 0);
  const currentMonthTotal = currentMonthIncome.reduce((total, income) => total + income.amount, 0);
  const yearTotal = yearIncome.reduce((total, income) => total + income.amount, 0);

  const isEstimateVisible = incomeForm.useTaxEstimate;
  const estimatedGrossPay = !incomeForm.useTaxEstimate
    ? 0
    : incomeForm.compensationType === 'salaried'
      ? Number(incomeForm.grossAmount || 0)
      : Number(incomeForm.hourlyRate || 0) * Number(incomeForm.hoursPerPeriod || 0);
  const estimatedNetPay = estimatedGrossPay * (1 - Number(incomeForm.estimatedTaxRate || 0) / 100);

  useEffect(() => {
    async function loadIncomeSources() {
      if (!user) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/users/${user.id}/income-sources`);
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
  }, [user]);

  const handleChange = (event) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [event.target.name]: event.target.value,
    }));
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const endpoint = authMode === 'login' ? 'login' : 'register';

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.');
      }

      setUser({ createdAt: data.createdAt, id: data.id, username: data.username });
      setSelectedMonth(currentMonthStart);
      setSelectedDay(today);
      setFormData({ username: '', password: '' });
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

  const navigateMonth = (offset) => {
    const nextMonth = addMonths(selectedMonth, offset);

    if (nextMonth > finalMonthStart) {
      return;
    }

    if (nextMonth < accountStartMonth) {
      return;
    }

    setSelectedMonth(nextMonth);
    setSelectedDay(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  };

  if (!user) {
    return (
      <main className="auth-page">
        <section className="brand-panel">
          <p className="eyebrow">Building a Better You</p>
          <h1>BABY Finance</h1>
          <p>Start with one account, then build the budgeting tools around it.</p>
        </section>

        <section className="auth-card" aria-labelledby="auth-heading">
          <div className="mode-switch" aria-label="Account action">
            <button
              className={authMode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('register')}
            >
              Sign up
            </button>
          </div>

          <h2 id="auth-heading">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Username
              <input
                autoComplete="username"
                name="username"
                onChange={handleChange}
                required
                type="text"
                value={formData.username}
              />
            </label>

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
        <div>
          <p className="eyebrow">BABY Finance</p>
          <h1>Welcome, {user.username}</h1>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setUser(null);
            setIncomeSources([]);
            resetIncomeEditor();
          }}
        >
          Logout
        </button>
      </header>

      <section className="summary-grid" aria-label="Income summary">
        <article>
          <p className="eyebrow">Selected Day</p>
          <strong>{formatCurrency(selectedDayTotal)}</strong>
          <span>Income on {formatLongDate(selectedDay)}</span>
          <small>Expenses: $0.00</small>
        </article>
        <article>
          <p className="eyebrow">This Week</p>
          <strong>{formatCurrency(workWeekTotal)}</strong>
          <span>
            {formatLongDate(workWeek.start)} to {formatLongDate(workWeek.end)}
          </span>
          <small>Expenses: $0.00</small>
        </article>
        <article>
          <p className="eyebrow">This Month</p>
          <strong>{formatCurrency(currentMonthTotal)}</strong>
          <span>{currentMonthIncome.length} income date(s) left this month</span>
          <small>Expenses: $0.00</small>
        </article>
        <article>
          <p className="eyebrow">This Year</p>
          <strong>{formatCurrency(yearTotal)}</strong>
          <span>expected through {formatLongDate(yearEnd)}</span>
          <small>Expenses: $0.00</small>
        </article>
      </section>

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
                    <strong>{formatCurrency(incomeSource.amount)}</strong>
                    <button type="button" className="secondary-button" onClick={() => handleEditIncomeSource(incomeSource)}>
                      Edit
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
            </>
          ) : (
            <section className="expense-placeholder" aria-labelledby="expense-heading">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Expenses</p>
                  <h2 id="expense-heading">Add Expenses</h2>
                </div>
              </div>

              <div className="expense-placeholder-body">
                <p className="empty-state">future expenses stuff here lil bro</p>
              </div>
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
                <h2 id="calendar-heading">{displayedMonthLabel}</h2>
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((calendarDay, index) =>
                calendarDay ? (
                  <button
                    type="button"
                    className={`calendar-day ${calendarDay.isToday ? 'today' : ''} ${
                      isSameDay(calendarDay.date, selectedDay) ? 'selected' : ''
                    }`}
                    key={calendarDay.date.toISOString()}
                    onClick={() => setSelectedDay(calendarDay.date)}
                  >
                    <span>{calendarDay.date.getDate()}</span>
                    {calendarDay.paydays.slice(0, 2).map((payday) => (
                      <p key={`${payday.incomeSourceId}-${payday.date.toISOString()}`}>
                        {payday.name}: {formatCurrency(payday.amount)}
                      </p>
                    ))}
                    {calendarDay.paydays.length > 2 && <p>+{calendarDay.paydays.length - 2} more</p>}
                  </button>
                ) : (
                  <div className="calendar-day empty" key={`empty-${index}`} />
                ),
              )}
            </div>
          </section>

          <section className="day-panel" aria-labelledby="day-heading">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Selected Day</p>
                <h2 id="day-heading">{formatLongDate(selectedDay)}</h2>
              </div>
            </div>

            <div className="day-detail-grid">
              <article className="day-detail-card">
                <h3>Income</h3>
                {selectedDayIncome.length === 0 ? (
                  <p className="empty-state">No income scheduled on this day yet.</p>
                ) : (
                  selectedDayIncome.map((income) => (
                    <div className="day-detail-item" key={`${income.incomeSourceId}-${income.date.toISOString()}`}>
                      <span>{income.name}</span>
                      <strong>{formatCurrency(income.amount)}</strong>
                    </div>
                  ))
                )}
              </article>

              <article className="day-detail-card">
                <h3>Potential Expenses</h3>
                <p className="empty-state">Expense planning will show here once we wire that feature in.</p>
              </article>
            </div>
          </section>
        </div>
      </section>

      <section className="budget-panel" aria-labelledby="budget-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Later Build</p>
            <h2 id="budget-heading">Monthly Budget</h2>
          </div>
          <button type="button">Add Category</button>
        </div>

        <div className="budget-list">
          {starterBudgets.map((budget) => (
            <article className="budget-card" key={budget.id}>
              <div>
                <h3>{budget.name}</h3>
                <p>
                  ${budget.spent} spent of ${budget.limit}
                </p>
              </div>
              <progress value={budget.spent} max={budget.limit}>
                {Math.round((budget.spent / budget.limit) * 100)}%
              </progress>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
