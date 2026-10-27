import PageHeader from '../components/PageHeader';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function SettingSelect({ id, label, value, onChange, options }) {
  return <div className="settings-row"><label htmlFor={id}>{label}</label><select id={id} className="form-select" value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></div>;
}

function SettingSwitch({ id, label, checked, onChange }) {
  return <div className="settings-row"><label htmlFor={id}>{label}</label><div className="form-check form-switch"><input id={id} className="form-check-input" type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} /><span aria-hidden="true">{checked ? 'Activado' : 'Desactivado'}</span></div></div>;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const preferences = usePreferences();
  const { user, logout } = useAuth();
  return <><PageHeader eyebrow="ODONTOSMART" title="Configuración" /><div className="settings-grid">
    <section className="panel settings-card" aria-labelledby="appearance-title"><h2 id="appearance-title">Apariencia</h2><SettingSelect id="settings-theme" label="Tema" value={theme} onChange={setTheme} options={[['light', 'Claro'], ['dark', 'Oscuro']]} /></section>
    <section className="panel settings-card" aria-labelledby="accessibility-title"><h2 id="accessibility-title">Accesibilidad</h2><SettingSelect id="settings-text-size" label="Tamaño de texto" value={preferences.textSize} onChange={preferences.setTextSize} options={[['normal', 'Normal'], ['large', 'Grande']]} /><SettingSwitch id="settings-contrast" label="Contraste aumentado" checked={preferences.highContrast} onChange={preferences.setHighContrast} /><SettingSwitch id="settings-motion" label="Reducir animaciones" checked={preferences.reducedMotion} onChange={preferences.setReducedMotion} /></section>
    <section className="panel settings-card" aria-labelledby="preferences-title"><h2 id="preferences-title">Preferencias</h2><SettingSelect id="settings-rows" label="Filas por página" value={preferences.rowsPerPage} onChange={value => preferences.setRowsPerPage(Number(value))} options={[[10, '10'], [25, '25'], [50, '50']]} /><SettingSwitch id="settings-filters" label="Recordar filtros y búsquedas" checked={preferences.rememberFilters} onChange={preferences.setRememberFilters} /><p className="settings-help">Las preferencias se guardan automáticamente en este navegador.</p></section>
    <section className="panel settings-card" aria-labelledby="session-title"><h2 id="session-title">Sesión</h2><dl className="settings-session"><dt>Usuario actual</dt><dd>{user.username}</dd></dl><button type="button" className="btn btn-outline-secondary" onClick={logout}>Cerrar sesión</button></section>
  </div></>;
}
