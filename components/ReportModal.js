export default function ReportModal({
  reportTarget,
  reportReason,
  reportReasons,
  reportNotes,
  onChangeReason,
  onChangeNotes,
  onCancel,
  onReport,
  onReportBlock
}) {
  if (!reportTarget) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <p className="eyebrow">Safety report</p>
        <h2>Report {reportTarget.display_name}</h2>
        <label>
          Reason
          <select value={reportReason} onChange={(event) => onChangeReason(event.target.value)}>
            {reportReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Notes
          <textarea
            rows="3"
            value={reportNotes}
            onChange={(event) => onChangeNotes(event.target.value)}
            placeholder="Share any details that help us review."
          />
        </label>
        <div className="modal__actions">
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn outline" onClick={onReportBlock}>
            Report &amp; block
          </button>
          <button className="btn primary" onClick={onReport}>
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
