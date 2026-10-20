import useRememberedFilter from '../hooks/useRememberedFilter';
import PaginatedRows from '../components/PaginatedRows';
import {useCallback,useRef,useState} from 'react';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import StatusBadge from '../components/StatusBadge';
import AppointmentDatePicker from '../components/AppointmentDatePicker';
import { validDate } from '../utils/formValidation.js';
import usePacienteQuery from '../hooks/usePacienteQuery';
import {resourceService,turnoService,historialEstadoService,getHistorialTurno,labelPersona} from '../services/clinicService';
import {apiErrorMessage} from '../services/api';
import {useNotification} from '../context/NotificationContext';
import {formatDate,formatTime} from '../utils/formatters';
export const localDateKey = (date = new Date()) => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const load = async options => {
 const keys=['turnos','pacientes','odontologos','empleados','consultorios','estados'];
 return Object.fromEntries(await Promise.all(keys.map(async key=>[key,await resourceService(key).list(options)])));
};
export default function AgendaPage(){
 const {data,loading,error,reload}=usePacienteQuery(load);
 const {notify}=useNotification();
 const [day,setDay]=useRememberedFilter('agenda.day', localDateKey, value => typeof value === 'string' && (value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)));
 const [query,setQuery]=useRememberedFilter('agenda.query', '');
 const [filter,setFilter]=useRememberedFilter('agenda.state', '');
 const [form,setForm]=useState(null);
 const [editing,setEditing]=useState(null);
 const [view,setView]=useState(null);
 const [history,setHistory]=useState([]);
 const [stateId,setStateId]=useState('');
 const [cancel,setCancel]=useState(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const lock=useRef(false);
 async function inspect(row,edit=false){
  if(lock.current)return;
  lock.current=true;setBusy(true);setMessage('');
  try{
   const current=await turnoService.get(row.idTurno);
   if(edit){setEditing(current.idTurno);setForm({...current,hora:current.hora.slice(0,5)});setView(null);}
   else {const records=await getHistorialTurno(current.idTurno);setView(current);setHistory(records);setStateId('');setForm(null);}
  }catch(e){notify(apiErrorMessage(e),'error');}
  finally{lock.current=false;setBusy(false);}
 }
 async function mutate(action,success){
  if(lock.current)return;
  lock.current=true;setBusy(true);setMessage('');
  try{await action();setForm(null);setView(null);setCancel(null);notify(success,'success');reload();}
  catch(e){const text=apiErrorMessage(e);setMessage(text);notify(text,'error');}
  finally{lock.current=false;setBusy(false);}
 }
 function save(e){
  e.preventDefault();
  if(!validDate(form.fecha)){setMessage('Seleccioná una fecha válida en el calendario.');return;}
  const payload={fecha:form.fecha,hora:form.hora.length===5?form.hora+':00':form.hora,idPaciente:Number(form.idPaciente),idOdontologo:Number(form.idOdontologo),idConsultorio:Number(form.idConsultorio)};
  return mutate(()=>editing?turnoService.update(editing,payload):turnoService.create(payload),'Turno guardado correctamente.');
 }
 function changeState(e){
  e.preventDefault();
  const state=data.estados.find(s=>String(s.idEstadoTurno)===stateId);
  if(state?.nombre==='Cancelado'){setCancel(view);setMessage('');return;}
  return mutate(()=>historialEstadoService.create({idTurno:view.idTurno,idEstadoTurno:Number(stateId)}),'Estado actualizado.');
 }
 if(loading)return <LoadingState message="Cargando agenda…"/>;
 if(error)return <ErrorState message={error} onAction={reload}/>;
 const rows=data.turnos.filter(t=>(!day||t.fecha===day)&&(!filter||String(t.idEstadoTurno)===filter)&&(t.paciente+' '+t.odontologo).toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
 const doctor=o=>{const employee=data.empleados.find(e=>e.idEmpleado===o.idEmpleado);return employee?labelPersona(employee)+' · '+o.nroMatricula:'Matrícula '+o.nroMatricula;};
 return <><PageHeader eyebrow="AGENDA" title="Agenda / Turnos" description="Reservas y seguimiento de la atención."><button className="btn btn-primary" disabled={busy} onClick={()=>{setEditing(null);setForm({fecha:day||localDateKey(),hora:'',idPaciente:'',idOdontologo:'',idConsultorio:''});setView(null);setMessage('');}}>Reservar turno</button></PageHeader>
 {form&&<form className="panel patient-form mb-3" onSubmit={save}><h2>{editing?'Modificar turno':'Reservar turno'}</h2><fieldset disabled={busy}><div className="row g-3">{[['fecha','Fecha','date'],['hora','Hora','time']].map(([key,label,type])=><div key={key} className="col-12 col-md-6"><label className="form-label" htmlFor={'turno-'+key}>{label}</label>{key==='fecha'?<AppointmentDatePicker id="turno-fecha" value={form.fecha} disabled={busy} onChange={fecha=>{setForm(current=>({...current,fecha}));setMessage('');}}/>:<input id={'turno-'+key} className="form-control" type={type} required value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}/>}</div>)}{[['idPaciente','Paciente',data.pacientes,'idPaciente',labelPersona],['idOdontologo','Odontólogo',data.odontologos,'idOdontologo',doctor],['idConsultorio','Consultorio',data.consultorios,'idConsultorio',c=>c.nombre]].map(([key,label,items,idKey,toLabel])=><div key={key} className="col-12 col-md-6"><label htmlFor={'turno-'+key} className="form-label">{label}</label><select id={'turno-'+key} className="form-select" required value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}><option value="">Seleccionar</option>{items.map(item=><option key={item[idKey]} value={item[idKey]}>{toLabel(item)}</option>)}</select></div>)}</div></fieldset>{message&&<p className="alert alert-danger mt-3" role="alert">{message}</p>}<div className="patient-actions mt-3"><button className="btn btn-primary" disabled={busy}>{busy?'Guardando…':'Guardar turno'}</button><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>setForm(null)}>Cerrar</button></div></form>}
 {view&&<section className="panel patient-form mb-3"><h2>Detalle del turno</h2><dl className="row patient-details">{[['Paciente',view.paciente],['Fecha y hora',formatDate(view.fecha)+' '+formatTime(view.hora)],['Odontólogo',view.odontologo],['Consultorio',view.consultorio],['Estado',view.estado||'Sin estado registrado']].map(([label,value])=><div className="col-12 col-md-6" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><h2>Historial de estados</h2>{history.length?<ul>{history.map(h=><li key={h.idHistorialEstadoTurno}>{formatDate(h.fechaHora)} {formatTime(h.fechaHora)} · {data.estados.find(s=>s.idEstadoTurno===h.idEstadoTurno)?.nombre||'Estado '+h.idEstadoTurno}</li>)}</ul>:<EmptyState title="Sin cambios de estado registrados"/>}<form onSubmit={changeState}><label htmlFor="new-state" className="form-label">Nuevo estado</label><select id="new-state" className="form-select mb-3" required value={stateId} disabled={busy} onChange={e=>setStateId(e.target.value)}><option value="">Seleccionar estado</option>{data.estados.filter(s=>s.idEstadoTurno!==view.idEstadoTurno).map(s=><option key={s.idEstadoTurno} value={s.idEstadoTurno}>{s.nombre}</option>)}</select><button disabled={busy} className="btn btn-primary">Cambiar estado</button><button type="button" className="btn btn-outline-secondary ms-2" onClick={()=>setView(null)}>Cerrar detalle</button></form>{message&&<p role="alert" className="alert alert-danger mt-3">{message}</p>}</section>}
 <section className="panel"><div className="table-toolbar pt-3 flex-wrap"><div><label className="form-label" htmlFor="agenda-day">Fecha (vacía: todas)</label><input id="agenda-day" type="date" className="form-control" value={day} onChange={e=>setDay(e.target.value)}/></div><div className="search-field"><label htmlFor="agenda-search" className="form-label">Paciente u odontólogo</label><input id="agenda-search" className="form-control" value={query} onChange={e=>setQuery(e.target.value)}/></div><div><label className="form-label" htmlFor="agenda-state">Estado</label><select id="agenda-state" className="form-select" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Todos</option>{data.estados.map(s=><option key={s.idEstadoTurno} value={s.idEstadoTurno}>{s.nombre}</option>)}</select></div></div>{rows.length?<PaginatedRows rows={rows} filterKey={[day,query,filter]}>{visibleRows => <div className="table-responsive" role="region" tabIndex={0} aria-label="Agenda de turnos"><table className="table appointments-table"><thead><tr>{['Fecha','Hora','Paciente','Odontólogo','Consultorio','Estado','Acciones'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{visibleRows.map(t=><tr key={t.idTurno}><td>{formatDate(t.fecha)}</td><td>{formatTime(t.hora)}</td><td>{t.paciente}</td><td>{t.odontologo}</td><td>{t.consultorio}</td><td><StatusBadge status={t.estado||'Sin estado registrado'}/></td><td><div className="patient-actions"><button disabled={busy} className="btn btn-sm btn-outline-secondary" onClick={()=>inspect(t)}>Ver detalle</button><button disabled={busy} className="btn btn-sm btn-outline-secondary" onClick={()=>inspect(t,true)}>Modificar</button><button className="btn btn-sm btn-outline-danger" disabled={busy||t.estado==='Cancelado'} onClick={()=>{setCancel(t);setMessage('');}}>Cancelar turno</button></div></td></tr>)}</tbody></table></div>}</PaginatedRows>:<EmptyState title="No hay turnos para los filtros elegidos"/>}</section>
 <ConfirmModal show={!!cancel} busy={busy} title="Cancelar turno" confirmText="Cancelar turno" cancelText="Volver" variant="danger" message={<><p>¿Deseás cancelar el turno de {cancel?.paciente}? Se conservará el historial.</p>{message&&<p className="alert alert-danger" role="alert">{message}</p>}</>} onConfirm={()=>mutate(()=>turnoService.remove(cancel.idTurno),'Turno cancelado.')} onCancel={()=>setCancel(null)}/></>;
}
