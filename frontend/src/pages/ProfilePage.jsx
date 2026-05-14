import { useBudgetApp } from '../context/BudgetAppContext.jsx';
import { formatOptionalDate } from '../lib/budgetHelpers.js';

export function ProfilePage() {
  const {
    handleProfileChange,
    handleProfileSubmit,
    isEditingProfile,
    isSavingProfile,
    profileForm,
    profileMessage,
    resetProfileEditor,
    setIsEditingProfile,
    user,
  } = useBudgetApp();

  return (
    <section className="profile-layout">
      <section className="profile-panel" aria-labelledby="profile-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Profile</p>
            <h2 id="profile-heading">Account Details</h2>
          </div>
          {!isEditingProfile ? (
            <button type="button" onClick={() => setIsEditingProfile(true)}>
              Edit Profile
            </button>
          ) : null}
        </div>

        {isEditingProfile ? (
          <form className="profile-form" onSubmit={handleProfileSubmit}>
            <div className="profile-grid">
              <label className="profile-field">
                <span>First Name</span>
                <input
                  name="firstName"
                  onChange={handleProfileChange}
                  required
                  type="text"
                  value={profileForm.firstName}
                />
              </label>
              <label className="profile-field">
                <span>Last Name</span>
                <input
                  name="lastName"
                  onChange={handleProfileChange}
                  required
                  type="text"
                  value={profileForm.lastName}
                />
              </label>
              <label className="profile-field">
                <span>Email</span>
                <input
                  name="email"
                  onChange={handleProfileChange}
                  required
                  type="email"
                  value={profileForm.email}
                />
              </label>
              <label className="profile-field">
                <span>Date of Birth</span>
                <input
                  name="dateOfBirth"
                  onChange={handleProfileChange}
                  required
                  type="date"
                  value={profileForm.dateOfBirth}
                />
              </label>
              <article className="profile-card">
                <span>Member Since</span>
                <strong>{formatOptionalDate(user.createdAt)}</strong>
              </article>
            </div>

            {profileMessage ? <p className="form-message">{profileMessage}</p> : null}

            <div className="profile-actions">
              <button disabled={isSavingProfile} type="submit">
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="secondary-button" onClick={resetProfileEditor} type="button">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
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
            {profileMessage ? <p className="profile-success-message">{profileMessage}</p> : null}
          </>
        )}
      </section>
    </section>
  );
}
