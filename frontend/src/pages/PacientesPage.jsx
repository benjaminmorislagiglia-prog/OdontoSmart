import useRememberedFilter from '../hooks/useRememberedFilter';
import PaginatedRows from '../components/PaginatedRows';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import { useNotification } from '../context/NotificationContext';
import { getPacientes, deletePaciente } from '../services/pacienteService';
import { apiErrorMessage } from '../services/api';
import usePacienteQuery from '../hooks/usePacienteQuery';
export default function PacientesPage() {
 const { data, loading, error, reload } = usePacienteQuery(getPacientes);
 const { notify } = useNotification();
 const [query, setQuery] = useRememberedFilter('pacientes.query', '');
 const [selected, setSelected] = useState(null);
 const [busy, setBusy] = useState(false);
 const [deleteError, setDeleteError] = useState('');
 const lock = useRef(false);
 async function deactivate() {
  if (lock.current || !selected) return;
  lock.current = true; setBusy(true); setDeleteError('');
  try { await deletePaciente(selected.idPaciente); setSelected(null); notify('Paciente dado de baja correctamente.', 'success'); reload(); }
  catch (e) { const message = apiErrorMessage(e); setDeleteError(message); notify(message, 'error'); }
  finally { lock.current = false; setBusy(false); }
 }
 const rows = (data || []).filter(p => [p.nombre, p.apellido, p.dni, p.telefono, p.correo].join(' ').toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
 return <><PageHeader eyebrow="GESTIÓN DE PACIENTES" title="Pacientes" description="Consultá y administrá la información de los pacientes."><Link className="btn btn-primary" to="/pacientes/nuevo">Registrar paciente</Link></PageHeader><section className="panel"><div className="table-toolbar"><label htmlFor="pacientes-search" className="visually-hidden">Buscar pacientes</label><input id="pacientes-search" className="form-control" placeholder="Buscar por nombre, DNI, teléfono o correo…" value={query} onChange={e => setQuery(e.target.value)} /></div>{loading ? <LoadingState message="Cargando pacientes…" /> : error ? <ErrorState message={error} onAction={reload} /> : !data.length ? <EmptyState title="No hay pacientes registrados" message="Podés registrar un paciente cuando tengas una dirección válida." /> : !rows.length ? <EmptyState title="No hay coincidencias" action={<button className="btn btn-primary" onClick={() => setQuery('')}>Limpiar búsqueda</button>} /> : <PaginatedRows rows={rows} filterKey={query}>{visibleRows => <div className="table-responsive" tabIndex={0} role="region" aria-label="Listado de pacientes"><table className="table appointments-table"><caption className="visually-hidden">Pacientes de la clínica</caption><thead><tr>{['Nombre y apellido', 'DNI', 'Teléfono', 'Correo', 'Estado', 'Acciones'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{visibleRows.map(p => <tr key={p.idPaciente}><td><Link className="patient-name" to={'/pacientes/' + p.idPaciente}>{[p.nombre, p.apellido].filter(Boolean).join(' ') || 'Sin nombre registrado'}</Link></td><td>{p.dni || '—'}</td><td>{p.telefono || '—'}</td><td>{p.correo || '—'}</td><td><span className={'status-badge ' + (p.activo === true ? 'confirmed' : p.activo === false ? 'cancelled' : 'pending')}>{p.activo === true ? 'Activo' : p.activo === false ? 'Inactivo' : 'Sin informar'}</span></td><td><div className="patient-actions"><Link to={'/pacientes/' + p.idPaciente} className="btn btn-sm btn-outline-secondary">Ver detalle</Link><Link to={'/pacientes/' + p.idPaciente + '/editar'} className="btn btn-sm btn-outline-secondary">Editar</Link><button type="button" className="btn btn-sm btn-outline-danger" disabled={p.activo === false || busy} onClick={() => { setDeleteError(''); setSelected(p); }} aria-label={'Dar de baja a ' + p.nombre + ' ' + p.apellido}>Dar de baja</button></div></td></tr>)}</tbody></table></div>}</PaginatedRows>}</section><ConfirmModal show={!!selected} title="Dar de baja al paciente" message={<><p>¿Deseás dar de baja a {selected?.nombre} {selected?.apellido}? Se realizará una baja lógica.</p>{deleteError && <p role="alert" className="alert alert-danger">{deleteError}</p>}</>} confirmText="Dar de baja" variant="danger" busy={busy} onConfirm={deactivate} onCancel={() => { if (!busy) setSelected(null); }} /></>;
}
