import { notifications } from '../mocks/notifications';
const localNotifications = notifications.map(item => ({ ...item }));
export const notificationService = {
  async list() { return localNotifications.map(item => ({ ...item })); },
  async markRead(id) {
    const notification = localNotifications.find(item => item.id === id);
    if (!notification) throw new Error('El aviso no está disponible.');
    notification.read = true;
    return { ...notification };
  },
};
