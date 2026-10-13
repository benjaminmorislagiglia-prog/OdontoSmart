import { createContext, useContext, useRef, useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiXCircle } from 'react-icons/fi';

const NotificationContext = createContext(null);
const variants = {
  success: { title: 'Listo', icon: FiCheckCircle },
  info: { title: 'Información', icon: FiInfo },
  warning: { title: 'Atención', icon: FiAlertTriangle },
  error: { title: 'Error', icon: FiXCircle },
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const nextId = useRef(0);

  function notify(message, type = 'info') {
    const id = ++nextId.current;
    setNotifications(current => [...current.slice(-3), { id, message, type: variants[type] ? type : 'info' }]);
  }
  function dismiss(id) {
    setNotifications(current => current.filter(item => item.id !== id));
  }

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <ToastContainer position="bottom-end" className="notification-container p-3">
        {notifications.map(({ id, message, type }) => {
          const { title, icon: Icon } = variants[type];
          const urgent = type === 'error' || type === 'warning';
          return (
            <Toast key={id} className={`notification notification-${type}`} onClose={() => dismiss(id)} autohide={!urgent} delay={5500} role={urgent ? 'alert' : 'status'} aria-live={urgent ? 'assertive' : 'polite'} aria-atomic="true">
              <Toast.Header closeLabel="Cerrar notificación"><Icon aria-hidden="true" className="me-2" /><strong className="me-auto">{title}</strong></Toast.Header>
              <Toast.Body>{message}</Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
