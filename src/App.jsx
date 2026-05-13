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
const chartColors = ['#136f63', '#f59e0b', '#2563eb', '#dc2626', '#7c3aed', '#0f766e'];
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

function buildIncomeBreakdown(incomeOccurrences) {
  const totals = new Map();
  let grandTotal = 0;

  incomeOccurrences.forEach((incomeOccurrence) => {
    grandTotal += incomeOccurrence.amount;
    totals.set(incomeOccurrence.name, (totals.get(incomeOccurrence.name) || 0) + incomeOccurrence.amount);
  });

  return Array.from(totals.entries())
    .sort((firstItem, secondItem) => secondItem[1] - firstItem[1])
    .map(([name, amount], index) => ({
      amount,
      color: chartColors[index % chartColors.length],
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

function App() {
  const today = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const currentMonthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  const yearEnd = useMemo(() => new Date(today.getFullYear(), 11, 31), [today]);
  const finalMonthStart = useMemo(() => new Date(today.getFullYear(), 11, 1), [today]);
  const workWeek = useMemo(() => getWorkWeekRange(today), [today]);

  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState(emptyAuthForm);
  const [incomeForm, setIncomeForm] = useState(createDefaultIncomeForm(today));
  const [incomeSources, setIncomeSources] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStart);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingIncomeSourceId, setEditingIncomeSourceId] = useState(null);
  const [activePlannerTab, setActivePlannerTab] = useState('income');
  const [activePage, setActivePage] = useState('planner');
  const [user, setUser] = useState(() => readStoredAuthSession());
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
    () =>
      selectedDay ? displayedMonthIncome.filter((income) => isSameDay(income.date, selectedDay)) : [],
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
  const displayedMonthTotal = displayedMonthIncome.reduce((total, income) => total + income.amount, 0);
  const selectedMonthBreakdown = useMemo(
    () => buildIncomeBreakdown(displayedMonthIncome),
    [displayedMonthIncome],
  );
  const selectedMonthPie = useMemo(
    () => buildPieGradient(selectedMonthBreakdown),
    [selectedMonthBreakdown],
  );
  const expensePie = useMemo(() => buildPieGradient([], '#edf2f7'), []);

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
        email: data.email,
        firstName: data.firstName,
        id: data.id,
        lastName: data.lastName,
      });
      setActivePage('planner');
      setSelectedMonth(currentMonthStart);
      setSelectedDay(null);
      setFormData(emptyAuthForm);
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
    setSelectedDay(null);
  };

  if (!user) {
    return (
      <main className="auth-page">
        <section className="brand-panel">
          <div className="brand-panel-copy">
            <p className="eyebrow">Building a Better You</p>
            <h1>BABY Finance</h1>
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
              <strong>BABY Snapshot</strong>
              <small>Take the guesswork out of finanical planning.</small>
            </article>
          </div>
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
            {authMode === 'login' ? <p>Sign in to view your planner and upcoming paydays.</p> : null}
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
        <div>
          <p className="eyebrow">BABY Finance</p>
          <h1>Welcome, {user.firstName || user.email || 'there'}</h1>
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
                      selectedDay && isSameDay(calendarDay.date, selectedDay) ? 'selected' : ''
                    }`}
                    key={calendarDay.date.toISOString()}
                    onClick={() =>
                      setSelectedDay((currentSelectedDay) =>
                        currentSelectedDay && isSameDay(calendarDay.date, currentSelectedDay)
                          ? null
                          : calendarDay.date,
                      )
                    }
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
                <h2 id="day-heading">
                  {selectedDay ? formatLongDate(selectedDay) : 'No Day Selected'}
                </h2>
              </div>
            </div>

            <div className="day-detail-grid">
              <article className="day-detail-card">
                <h3>Income</h3>
                {!selectedDay ? (
                  <p className="empty-state">
                    No day selected. Click a day in the calendar to inspect that day more closely.
                  </p>
                ) : selectedDayIncome.length === 0 ? (
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
                <p className="empty-state">
                  {selectedDay
                    ? 'Expense planning will show here once we wire that feature in.'
                    : 'No day selected. Summary stays cleaner until you click into a date.'}
                </p>
              </article>
            </div>
          </section>
        </div>
      </section>
      ) : (
      <>
      <section className="summary-grid" aria-label="Income summary">
        <article>
          <p className="eyebrow">Selected Day</p>
          <strong>{formatCurrency(selectedDayTotal)}</strong>
          <span>
            {selectedDay ? `Income on ${formatLongDate(selectedDay)}` : 'No day selected'}
          </span>
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
                  <strong>$0.00</strong>
                </div>
              </div>

              <div className="chart-legend">
                <p className="empty-state">Expense categories and charts will fill in once we wire up expenses.</p>
              </div>
            </div>
          </article>
        </section>

      <section className="budget-panel" aria-labelledby="budget-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">BABY Snapshot</p>
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
      </section>
      </>
      )}
    </main>
  );
}

export default App;
