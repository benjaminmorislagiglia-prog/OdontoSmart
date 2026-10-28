import AsyncStorage from '@react-native-async-storage/async-storage';
const SESSION_KEY = 'odontosmart.mobile-session';
// Credenciales públicas, exclusivamente para el prototipo local.
const CREDENTIALS = { username: 'admin', password: '1234' };
export const authService = {
  async restore() {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
      const session = JSON.parse(stored);
      return session?.username === CREDENTIALS.username ? { username: session.username } : null;
    } catch {
      return null;
    }
  },
  async login(username, password) {
    if (username !== CREDENTIALS.username || password !== CREDENTIALS.password)
      throw new Error('Usuario o contraseña incorrectos.');
    const user = { username: CREDENTIALS.username };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },
  async logout() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};
