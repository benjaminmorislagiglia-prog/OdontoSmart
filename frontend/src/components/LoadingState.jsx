export default function LoadingState({ message = 'Cargando…', inline = false }) {
  return (
    <span className={inline ? 'loading-inline' : 'feedback-state loading-state'} role="status">
      <span className={`spinner-border ${inline ? 'spinner-border-sm' : ''}`} aria-hidden="true" />
      <span>{message}</span>
    </span>
  );
}
