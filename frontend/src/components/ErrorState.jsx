import { FiAlertCircle } from 'react-icons/fi';

export default function ErrorState({
  title = 'No pudimos cargar la información',
  message = 'Ocurrió un problema. Intentá nuevamente.',
  icon: Icon = FiAlertCircle,
  onAction,
  actionText = 'Reintentar',
}) {
  return (
    <section className="feedback-state error-state" role="alert">
      {Icon && <Icon className="feedback-icon" aria-hidden="true" />}
      <h2>{title}</h2>
      <p>{message}</p>
      {onAction && <button type="button" className="btn btn-primary" onClick={onAction}>{actionText}</button>}
    </section>
  );
}
