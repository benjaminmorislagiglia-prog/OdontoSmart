import { FiCheck, FiCheckCircle, FiClock, FiUserX, FiXCircle } from 'react-icons/fi';

const states = {
  Confirmado: { icon: FiCheckCircle, className: 'confirmed' },
  Pendiente: { icon: FiClock, className: 'pending' },
  Atendido: { icon: FiCheck, className: 'attended' },
  Cancelado: { icon: FiXCircle, className: 'cancelled' },
  Ausente: { icon: FiUserX, className: 'absent' },
};

export default function StatusBadge({ status }) {
  const { icon: Icon, className } = states[status] || { icon: FiClock, className: 'pending' };
  return <span className={`status-badge ${className}`}><Icon aria-hidden="true" />{status}</span>;
}
