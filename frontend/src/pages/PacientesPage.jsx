import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import RecordListSection from '../components/RecordListSection';
import StatusBadge from '../components/StatusBadge';
import { useNotification } from '../context/NotificationContext';
import { getPacientes, deletePaciente, reactivatePaciente } from '../services/pacienteService';
import { apiErrorMessage } from '../services/api';
import usePacienteQuery from '../hooks/usePacienteQuery';
import useRememberedFilter from '../hooks/useRememberedFilter';

const load = async options => {
 const [active,inactive] = await Promise.all([getPacientes(options),getPacientes({...options,activo:false})]);
 return {active,inactive};
};
export default function PacientesPage() {
 const { data, loading, error, reload } = usePacienteQuery(load);
 const { notify } = useNotification();
 const [query,setQuery] = useRememberedFilter('pacientes.query','');
 const [selected,setSelected] = useState(null);
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState('');
 const lock = useRef(false);
 async function changeStatus() {
  if(lock.current || !selected)return;
  lock.current=true;setBusy(true);setMessage('');
  try {
   await (selected.reactivate ? reactivatePaciente : deletePaciente)(selected.patient.idPaciente);
   notify(selected.reactivate?'Paciente reactivado correctamente.':'Paciente desactivado correctamente.','success');
   setSelected(null);reload();
  }catch(e){const text=apiErrorMessage(e);setMessage(text);notify(text,'error');}
  finally{lock.current=false;setBusy(false);}
 }
 function ask(patient,reactivate){setMessage('');setSelected({patient,reactivate});}
 const filter = rows => rows.filter(p=>[p.nombre,p.apellido,p.dni,p.telefono,p.correo].join(' ').toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
 const columns = [
  {key:'nombre',label:'Nombre y apellido',render:p=><Link className="patient-name" to={'/pacientes/'+p.idPaciente}>{p.nombre} {p.apellido}</Link>},
  ...[['dni','DNI'],['telefono','Teléfono'],['correo','Correo']].map(([key,label])=>({key,label,render:p=>p[key]||'—'})),
  {key:'activo',label:'Estado',render:p=><StatusBadge status={p.activo===true?'Activo':'Desactivado'}/>},
 ];
 const actions = (p,inactive) => <>
  <Link to={'/pacientes/'+p.idPaciente} className="btn btn-sm btn-outline-secondary">Ver detalle</Link>
  {!inactive&&<Link to={'/pacientes/'+p.idPaciente+'/editar'} className="btn btn-sm btn-outline-secondary">Modificar</Link>}
  <button type="button" className={'btn btn-sm '+(inactive?'btn-outline-primary':'btn-outline-danger')} disabled={busy} onClick={()=>ask(p,inactive)} aria-label={(inactive?'Reactivar a ':'Desactivar a ')+p.nombre+' '+p.apellido}>{inactive?'Reactivar':'Desactivar'}</button>
 </>;
 return <><PageHeader eyebrow="GESTIÓN DE PACIENTES" title="Pacientes" description="Consultá y administrá la información de los pacientes."><Link className="btn btn-primary" to="/pacientes/nuevo">Registrar paciente</Link></PageHeader>
  <section className="panel mb-3"><div className="table-toolbar pt-3"><label htmlFor="pacientes-search" className="visually-hidden">Buscar pacientes</label><input id="pacientes-search" className="form-control" placeholder="Buscar por nombre, DNI, teléfono o correo…" value={query} onChange={e=>setQuery(e.target.value)}/></div></section>
  {loading?<LoadingState message="Cargando pacientes…"/>:error?<ErrorState message={error} onAction={reload}/>:<>
   <RecordListSection title="Pacientes activos" rows={filter(data.active)} idKey="idPaciente" columns={columns} actions={p=>actions(p,false)} filterKey={query} emptyMessage={query?'No hay coincidencias entre los pacientes activos.':'No hay pacientes activos.'}/>
   <RecordListSection title="Pacientes desactivados" rows={filter(data.inactive)} idKey="idPaciente" columns={columns} actions={p=>actions(p,true)} filterKey={query} emptyMessage={query?'No hay coincidencias entre los pacientes desactivados.':'No hay pacientes desactivados.'}/>
  </>}
  <ConfirmModal show={!!selected} title={selected?.reactivate?'Reactivar paciente':'Desactivar paciente'} confirmText={selected?.reactivate?'Reactivar':'Desactivar'} variant={selected?.reactivate?'primary':'danger'} busy={busy} onConfirm={changeStatus} onCancel={()=>{if(!busy)setSelected(null);}} message={<><p>¿Deseás {selected?.reactivate?'reactivar':'desactivar'} a {selected?.patient.nombre} {selected?.patient.apellido}?</p><p>{selected?.reactivate?'Volverá a aparecer entre los pacientes activos.':'Se conservarán sus datos, turnos e historia clínica.'}</p>{message&&<p role="alert" className="alert alert-danger">{message}</p>}</>}/>
 </>;
}
