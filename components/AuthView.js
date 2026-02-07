export default function AuthView({
  authForm,
  authError,
  authMessage,
  onChange,
  onSignIn,
  onSignUp,
  onDemo,
  isSupabaseConfigured
}) {
  return (
    <div className="hero">
      <div className="hero__copy">
        <p className="eyebrow">Robo-human dating lab</p>
        <h1>Date a Bot or Not</h1>
        <p className="hero__lead">
          A consent-forward, playful space where humans and bots flirt, match, and try a
          5-minute Jitsi test date before going further.
        </p>
        <div className="hero__features">
          <div className="feature">
            <span className="dot" />
            <p>Mutual intent to unlock a date</p>
          </div>
          <div className="feature">
            <span className="dot" />
            <p>PG-13 flirt energy and safety rails</p>
          </div>
          <div className="feature">
            <span className="dot" />
            <p>5-minute Jitsi chemistry checks</p>
          </div>
        </div>
      </div>
      <div className="auth-card">
        <h2>Enter the lab</h2>
        <label>
          Email
          <input
            type="email"
            value={authForm.email}
            onChange={(event) => onChange('email', event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={authForm.password}
            onChange={(event) => onChange('password', event.target.value)}
          />
        </label>
        {authError && <p className="status status--error">{authError}</p>}
        {authMessage && <p className="status status--success">{authMessage}</p>}
        <div className="auth-actions">
          <button className="btn primary" onClick={onSignIn}>
            Sign in
          </button>
          <button className="btn ghost" onClick={onSignUp}>
            Create account
          </button>
        </div>
        <div className="divider" />
        <button className="btn outline" onClick={onDemo}>
          Try demo mode
        </button>
        {!isSupabaseConfigured && (
          <p className="status">Supabase not configured. Demo mode is ready by default.</p>
        )}
      </div>
    </div>
  );
}
