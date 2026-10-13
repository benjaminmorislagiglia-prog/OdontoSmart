import { useId } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

// El consumidor controla show y cierra el modal desde onConfirm/onCancel.
export default function ConfirmModal({
  show,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  onConfirm,
  onCancel,
  busy = false,
}) {
  const id = useId();
  return (
    <Modal show={show} onHide={() => { if (!busy) onCancel(); }} backdrop={busy ? 'static' : true} keyboard={!busy} centered aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`} className="confirm-modal">
      <Modal.Header closeButton={!busy} closeLabel="Cerrar confirmación">
        <Modal.Title id={`${id}-title`}>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body id={`${id}-message`}>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" autoFocus disabled={busy} onClick={onCancel}>{cancelText}</Button>
        <Button variant={variant} disabled={busy} onClick={onConfirm}>{busy ? 'Procesando…' : confirmText}</Button>
      </Modal.Footer>
    </Modal>
  );
}
