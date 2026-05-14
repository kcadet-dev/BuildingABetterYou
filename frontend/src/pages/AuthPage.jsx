import { useBudgetApp } from '../context/BudgetAppContext.jsx';

export function AuthPage() {
  const {
    authMode,
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    message,
    setAuthMode,
    setMessage,
  } = useBudgetApp();

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
