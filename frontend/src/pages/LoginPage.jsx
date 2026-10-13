import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FaTooth } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';
import ThemeToggle from '../components/ThemeToggle';
import LoadingState from '../components/LoadingState';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    const nextErrors = {};
    if (!username.trim()) nextErrors.username = 'Ingresá tu usuario.';
    if (!password) nextErrors.password = 'Ingresá tu contraseña.';
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) {
      (nextErrors.username ? usernameInput : passwordInput).current.focus();
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      setPassword('');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setMessage(error.message || 'No se pudo iniciar sesión. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card panel" aria-labelledby="login-heading">
        <div className="login-theme-control"><ThemeToggle /></div>
        <div className="brand login-brand">
          <span className="brand-mark"><FaTooth aria-hidden="true" /></span>
          <div>Odonto<span>Smart</span><small>GESTIÓN ODONTOLÓGICA</small></div>
        </div>
        <p className="eyebrow">BIENVENIDO A TU CLÍNICA</p>
        <h1 id="login-heading">Iniciar sesión</h1>
        <p className="login-description">Accedé al sistema de gestión de la clínica.</p>
        <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <p className="form-help">Ambos campos son obligatorios.</p>
          <div className="mb-4">
            <label className="form-label" htmlFor="login-username">Usuario</label>
            <input ref={usernameInput} id="login-username" className={`form-control ${errors.username ? 'is-invalid' : ''}`} autoComplete="username" required disabled={loading} value={username} onChange={event => setUsername(event.target.value)} aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'username-error' : undefined} />
            {errors.username && <div id="username-error" className="invalid-feedback">{errors.username}</div>}
          </div>
          <div className="mb-4">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <div className="password-field">
              <input ref={passwordInput} id="login-password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} type={visible ? 'text' : 'password'} autoComplete="current-password" required disabled={loading} value={password} onChange={event => setPassword(event.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
              <button className="password-toggle" type="button" disabled={loading} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
                {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
            {errors.password && <div id="password-error" className="invalid-feedback d-block">{errors.password}</div>}
          </div>
          {message && <div className="alert alert-danger login-error" role="alert">{message}</div>}
          <button type="submit" className="btn btn-primary w-100 login-submit" disabled={loading}>
            {loading ? <LoadingState inline message="Iniciando sesión…" /> : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  );
}
