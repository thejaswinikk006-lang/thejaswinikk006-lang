export default function LoadingSpinner({ text }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {text && <span>{text}</span>}
    </div>
  );
}
