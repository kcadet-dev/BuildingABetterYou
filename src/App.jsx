import { useEffect, useMemo, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly', intervalDays: 7 },
  { value: 'biweekly', label: 'Bi-weekly', intervalDays: 14 },
  { value: 'semimonthly', label: 'Semi-monthly', intervalDays: 15 },
  { value: 'monthly', label: 'Monthly', intervalDays: null },
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

function getPaydaysForIncome(incomeSource, startDate, endDate) {
  const paydays = [];
  const frequency = frequencyOptions.find((option) => option.value === incomeSource.frequency);
  let payday = parseLocalDate(incomeSource.nextPayDate.slice(0, 10));

  while (payday <= endDate) {
    if (payday >= startDate) {
      paydays.push({
        amount: Number(incomeSource.amount),
        date: new Date(payday),
        incomeSourceId: incomeSource.id,
        jobName: incomeSource.jobName,
      });
    }

    payday =
      frequency?.value === 'monthly'
        ? addMonths(payday, 1)
        : addDays(payday, frequency?.intervalDays || 14);
  }

  return paydays;
}

function buildCalendarDays(today, paydays) {
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const days = [];

  for (let index = 0; index < monthStart.getDay(); index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    days.push({
      date,
      paydays: paydays.filter((payday) => isSameDay(payday.date, date)),
    });
  }

  return days;
}

function App() {
  const today = useMemo(() => new Date(), []);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    frequency: 'biweekly',
    jobName: '',
    nextPayDate: formatDateInput(today),
  });
  const [incomeSources, setIncomeSources] = useState([]);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [incomeMessage, setIncomeMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingIncome, setIsSavingIncome] = useState(false);

  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const monthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  const weekEnd = useMemo(() => addDays(today, 6), [today]);
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const monthPaydays = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getPaydaysForIncome(incomeSource, today, monthEnd),
      ),
    [incomeSources, monthEnd, today],
  );
  const weekPaydays = useMemo(
    () =>
      incomeSources.flatMap((incomeSource) =>
        getPaydaysForIncome(incomeSource, today, weekEnd),
      ),
    [incomeSources, today, weekEnd],
  );
  const calendarDays = useMemo(() => buildCalendarDays(today, monthPaydays), [monthPaydays, today]);
  const expectedMonthIncome = monthPaydays.reduce((total, payday) => total + payday.amount, 0);
  const expectedWeekIncome = weekPaydays.reduce((total, payday) => total + payday.amount, 0);

  useEffect(() => {
    async function loadIncomeSources() {
      if (!user) {
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/users/${user.id}/income-sources`);
      const data = await response.json();
      setIncomeSources(data);
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
    setIncomeForm((currentIncomeForm) => ({
      ...currentIncomeForm,
      [event.target.name]: event.target.value,
    }));
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

      setUser({ id: data.id, username: data.username });
      setFormData({ username: '', password: '' });
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

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${user.id}/income-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incomeForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save income.');
      }

      setIncomeSources((currentIncomeSources) => [...currentIncomeSources, data]);
      setIncomeForm({
        amount: '',
        frequency: 'biweekly',
        jobName: '',
        nextPayDate: formatDateInput(today),
      });
    } catch (error) {
      setIncomeMessage(error.message);
    } finally {
      setIsSavingIncome(false);
    }
  };

  if (!user) {
    return (
      <main className="auth-page">
        <section className="brand-panel">
          <p className="eyebrow">Building a Better You</p>
          <h1>Baby Finance</h1>
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
          <p className="eyebrow">Baby Finance</p>
          <h1>Welcome, {user.username}</h1>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setUser(null);
            setIncomeSources([]);
          }}
        >
          Logout
        </button>
      </header>

      <section className="summary-grid" aria-label="Income summary">
        <article>
          <p className="eyebrow">This Month</p>
          <strong>{formatCurrency(expectedMonthIncome)}</strong>
          <span>expected from {monthPaydays.length} payday(s)</span>
        </article>
        <article>
          <p className="eyebrow">Next 7 Days</p>
          <strong>{formatCurrency(expectedWeekIncome)}</strong>
          <span>expected this week</span>
        </article>
        <article>
          <p className="eyebrow">Income Sources</p>
          <strong>{incomeSources.length}</strong>
          <span>job(s) saved</span>
        </article>
      </section>

      <section className="workspace-grid">
        <section className="income-panel" aria-labelledby="income-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Income</p>
              <h2 id="income-heading">Add Job Income</h2>
            </div>
          </div>

          <form className="income-form" onSubmit={handleIncomeSubmit}>
            <label>
              Job or income name
              <input
                name="jobName"
                onChange={handleIncomeChange}
                placeholder="Campus job"
                required
                type="text"
                value={incomeForm.jobName}
              />
            </label>

            <label>
              Paycheck amount
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

            <label>
              Pay frequency
              <select name="frequency" onChange={handleIncomeChange} value={incomeForm.frequency}>
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Next payday
              <input
                min={formatDateInput(today)}
                name="nextPayDate"
                onChange={handleIncomeChange}
                required
                type="date"
                value={incomeForm.nextPayDate}
              />
            </label>

            {incomeMessage && <p className="form-message">{incomeMessage}</p>}

            <button type="submit" disabled={isSavingIncome}>
              {isSavingIncome ? 'Saving...' : 'Save Income'}
            </button>
          </form>

          <div className="income-list">
            {incomeSources.length === 0 ? (
              <p className="empty-state">No income added yet.</p>
            ) : (
              incomeSources.map((incomeSource) => (
                <article className="income-item" key={incomeSource.id}>
                  <div>
                    <h3>{incomeSource.jobName}</h3>
                    <p>{getFrequencyLabel(incomeSource.frequency)}</p>
                  </div>
                  <strong>{formatCurrency(Number(incomeSource.amount))}</strong>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="calendar-panel" aria-labelledby="calendar-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Pay Calendar</p>
              <h2 id="calendar-heading">{monthName}</h2>
            </div>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((calendarDay, index) =>
              calendarDay ? (
                <article
                  className={`calendar-day ${isSameDay(calendarDay.date, today) ? 'today' : ''}`}
                  key={calendarDay.date.toISOString()}
                >
                  <span>{calendarDay.date.getDate()}</span>
                  {calendarDay.paydays.map((payday) => (
                    <p key={`${payday.incomeSourceId}-${payday.date.toISOString()}`}>
                      {payday.jobName}: {formatCurrency(payday.amount)}
                    </p>
                  ))}
                </article>
              ) : (
                <div className="calendar-day empty" key={`empty-${index}`} />
              ),
            )}
          </div>
        </section>
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
