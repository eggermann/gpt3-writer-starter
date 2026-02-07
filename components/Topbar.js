export default function Topbar({ mode, onSignOut }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand__mark">DBN</span>
        <div>
          <p className="brand__name">Date a Bot or Not</p>
          <span className="brand__sub">Robo-human dating platform</span>
        </div>
      </div>
      <div className="topbar__actions">
        <span className="chip">{mode === 'demo' ? 'Demo mode' : 'Live mode'}</span>
        {mode !== 'demo' && (
          <button className="btn ghost" onClick={onSignOut}>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
