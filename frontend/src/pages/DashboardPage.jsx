import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiUsers, FiUserCheck, FiClock, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { dashboardService } from '../services/dashboardService';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { isModuleEnabled } from '../config/modules';
import { formatDate, formatTime } from '../utils/formatters';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Todos');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    dashboardService.getSummary().then(result => { if (active) setData(result); }).catch(() => { if (active) setError('No pudimos cargar el resumen. Volvé a intentarlo.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const date = formatDate(new Date());
  if (loading) return <LoadingState message="Cargando el resumen de la clínica…" />;
  if (error) return <ErrorState title="No pudimos cargar el resumen" message={error} onAction={() => setReload(value => value + 1)} />;
  const rows = data.appointments.filter(item => item.patient.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')) && (status === 'Todos' || item.status === status));
  const metrics = [
    { label: 'Turnos de hoy', value: data.appointments.length, detail: `${data.appointments.filter(item => item.status === 'Atendido').length} atendidos hasta ahora`, icon: FiCalendar, tone: 'green' },
    { label: 'Pacientes registrados', value: data.metrics.patients.toLocaleString('es-AR'), detail: 'Total en la clínica', icon: FiUsers, tone: 'blue' },
    { label: 'Odontólogos activos', value: data.metrics.dentists, detail: 'Equipo profesional', icon: FiUserCheck, tone: 'purple' },
    { label: 'Turnos pendientes', value: data.metrics.pending, detail: `${data.metrics.cancelled} cancelados · resumen general`, icon: FiClock, tone: 'orange' },
  ];
  return <><PageHeader eyebrow="RESUMEN GENERAL" title="Todo listo para un nuevo día" description="Una mirada a la actividad y las prioridades de tu clínica."><div className="date-chip"><FiCalendar aria-hidden="true" />{date}</div></PageHeader><section className="metrics-grid" aria-label="Indicadores de la clínica">{metrics.map(({ label, value, detail, icon: Icon, tone }) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon aria-hidden="true" /></span></div><strong className="metric-value">{value}</strong><p>{detail}</p></article>)}</section><div className="dashboard-grid"><section className="panel appointments-panel" aria-labelledby="appointments-heading"><div className="panel-heading"><div><h2 id="appointments-heading">Turnos de hoy <span className="count-pill">{data.appointments.length}</span></h2><p>La jornada de atención, en un solo lugar.</p></div><Link to="/agenda" className="text-link">Ver agenda <FiArrowRight aria-hidden="true" /></Link></div><div className="table-toolbar"><div className="search-field"><label className="visually-hidden" htmlFor="patient-search">Buscar paciente</label><input id="patient-search" className="form-control" placeholder="Buscar paciente…" value={query} onChange={event => setQuery(event.target.value)} /></div><div><label className="visually-hidden" htmlFor="status-filter">Filtrar por estado</label><select id="status-filter" className="form-select" value={status} onChange={event => setStatus(event.target.value)}>{['Todos', 'Pendiente', 'Confirmado', 'Atendido', 'Cancelado'].map(value => <option key={value} value={value}>{value === 'Todos' ? 'Todos los estados' : value}</option>)}</select></div></div><div className="table-responsive" tabIndex={0} role="region" aria-label="Turnos de hoy: tabla desplazable"><table className="table appointments-table"><caption className="visually-hidden">Turnos de hoy</caption><thead><tr><th scope="col">Hora</th><th scope="col">{isModuleEnabled('/prestaciones') ? 'Paciente / Prestación' : 'Paciente'}</th><th scope="col">Odontólogo</th><th scope="col">Consultorio</th><th scope="col">Estado</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td className="time-cell">{formatTime(item.time)}</td><td><span className="patient-name">{item.patient}</span>{isModuleEnabled('/prestaciones') && <small>{item.treatment}</small>}</td><td>{item.dentist}</td><td><span className="room-label">{item.room}</span></td><td><StatusBadge status={item.status} /></td></tr>)}</tbody></table>{rows.length === 0 && <EmptyState title="No hay turnos que coincidan con los filtros" message="Probá con otro paciente o estado." action={<button type="button" className="btn btn-primary" onClick={() => { setQuery(''); setStatus('Todos'); }}>Limpiar filtros</button>} />}</div><div className="table-footer">{rows.length} de {data.appointments.length} turnos</div></section><aside className="right-column">{isModuleEnabled('/insumos') && <section className="panel" aria-labelledby="alerts-heading"><div className="panel-heading"><div><h2 id="alerts-heading"><FiAlertTriangle className="alert-heading-icon" aria-hidden="true" /> Para revisar</h2><p>Prioridades del inventario</p></div><span className="count-pill amber">{data.supplies.length}</span></div><div className="alerts-list">{data.supplies.map(item => <article className="supply-alert" key={item.id}><span className={`alert-type ${item.kind === 'Por vencer' ? 'expiry' : ''}`}>{item.kind}</span><h3>{item.name}</h3><p>{item.detail}</p></article>)}</div><Link className="panel-link" to="/insumos">Ir a insumos <FiArrowRight aria-hidden="true" /></Link></section>}<section className="panel" aria-labelledby="activity-heading"><div className="panel-heading"><div><h2 id="activity-heading">Actividad reciente</h2><p>Últimos movimientos de la clínica</p></div><FiActivity className="muted-icon" aria-hidden="true" /></div><ol className="activity-list">{data.activity.map(item => <li key={item.id}><span className="activity-dot" /><div><h3>{item.title}</h3><p>{item.detail}</p><small>{item.time}</small></div></li>)}</ol></section></aside></div></>;
}
