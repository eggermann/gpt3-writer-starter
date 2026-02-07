export default function AgeGateModal({ open, checked, error, onToggle, onConfirm }) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <p className="eyebrow">Age gate</p>
        <h2>18+ only</h2>
        <p>This dating space is for adults. Please confirm you are 18+.</p>
        <label className="toggle">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onToggle(event.target.checked)}
          />
          I confirm I am 18+
        </label>
        {error && <p className="status status--error">{error}</p>}
        <button className="btn primary" onClick={onConfirm}>
          Enter
        </button>
      </div>
    </div>
  );
}
