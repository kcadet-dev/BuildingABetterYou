import { useBudgetApp } from '../context/BudgetAppContext.jsx';
import { formatOptionalDate } from '../lib/budgetHelpers.js';

export function ProfilePage() {
  const { user } = useBudgetApp();

  return (
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
  );
}
