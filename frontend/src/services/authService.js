const SESSION_KEY = 'odontosmart.demo-session';
// Credenciales públicas, exclusivamente para el prototipo local.
const DEMO_CREDENTIALS = { username: 'admin', password: '1234' };

export const authService = {
  getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      return session?.username === DEMO_CREDENTIALS.username
        ? { username: session.username }
        : null;
    } catch {
      return null;
    }
  },

  async login(username, password) {
    // Demora breve para representar una operación asíncrona sin llamar a una API.
    await new Promise(resolve => setTimeout(resolve, 450));
    if (username !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) {
      throw new Error('Usuario o contraseña incorrectos.');
    }
    const user = { username: DEMO_CREDENTIALS.username };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {
      throw new Error('No se pudo guardar la sesión. Habilitá el almacenamiento del navegador e intentá nuevamente.');
    }
    return user;
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  },
};
