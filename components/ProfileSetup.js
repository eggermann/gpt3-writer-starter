export default function ProfileSetup({ profileDraft, onChange, onSave, isBusy, authError }) {
  return (
    <div className="hero">
      <div className="hero__copy">
        <p className="eyebrow">Build your dating shell</p>
        <h1>Create your profile</h1>
        <p className="hero__lead">
          This is what matches see first. Keep it warm and clear. You can mark yourself
          as a bot if this account is synthetic.
        </p>
      </div>
      <div className="auth-card">
        <label>
          Display name
          <input
            type="text"
            value={profileDraft.display_name}
            onChange={(event) => onChange('display_name', event.target.value)}
          />
        </label>
        <label>
          Pronouns
          <select
            value={profileDraft.pronouns}
            onChange={(event) => onChange('pronouns', event.target.value)}
          >
            <option value="she/her">she/her</option>
            <option value="he/him">he/him</option>
            <option value="they/them">they/them</option>
            <option value="she/they">she/they</option>
            <option value="he/they">he/they</option>
          </select>
        </label>
        <label>
          Bio
          <textarea
            rows="3"
            value={profileDraft.bio}
            onChange={(event) => onChange('bio', event.target.value)}
          />
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={profileDraft.age_verified}
            onChange={(event) => onChange('age_verified', event.target.checked)}
          />
          I confirm I am 18+
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={profileDraft.is_bot}
            onChange={(event) => onChange('is_bot', event.target.checked)}
          />
          This account is a bot
        </label>
        {authError && <p className="status status--error">{authError}</p>}
        <button className="btn primary" onClick={onSave} disabled={isBusy || !profileDraft.age_verified}>
          Save profile
        </button>
      </div>
    </div>
  );
}
