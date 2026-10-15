import useRememberedFilter from '../hooks/useRememberedFilter';
import PaginatedRows from '../components/PaginatedRows';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import usePacienteQuery from '../hooks/usePacienteQuery';
import { resourceService, anularHistoriaClinica } from '../services/clinicService';
import { formatDate, formatTime } from '../utils/formatters';
import { apiErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';

export default function ClinicEntityPage({config}) {
 const service = resourceService(config.resource);
 const {notify} = useNotification();
 const loader = useCallback(async options => {
  const [rows,...refs] = await Promise.all([resourceService(config.resource).list(options),...(config.refs||[]).map(key=>resourceService(key).list(options))]);
  return {rows,refs:Object.fromEntries((config.refs||[]).map((key,i)=>[key,refs[i]]))};
 },[config]);
 const {data,loading,error,reload} = usePacienteQuery(loader);
 const [query,setQuery] = useRememberedFilter(config.resource + '.query', '');
 const [values,setValues] = useState(null);
 const [editing,setEditing] = useState(null);
 const [view,setView] = useState(null);
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState('');
 const [remove,setRemove] = useState(null);
 const [annul,setAnnul] = useState(null);
 const [reason,setReason] = useState('');
 const [annulError,setAnnulError] = useState('');
 const lock = useRef(false);

 async function open(row,edit=false) {
  if(lock.current)return;
  lock.current=true;setBusy(true);setMessage('');
  try {
   const current = await service.get(row[config.id]);
   if(edit && config.annul && current.anulado){setView(current);setValues(null);notify('El registro está anulado y sólo admite consulta.','warning');return;}
   if(edit){setEditing(current[config.id]);setValues(Object.fromEntries(config.fields.map(f=>[f.key,current[f.key]??''])));setView(null);}
   else {setView(current);setValues(null);}
  }catch(e){notify(apiErrorMessage(e),'error');}
  finally{lock.current=false;setBusy(false);}
 }
 function create(){setEditing(null);setValues(Object.fromEntries(config.fields.map(f=>[f.key,''])));setMessage('');setView(null);}
 async function save(event) {
  event.preventDefault();if(lock.current)return;
  const payload=Object.fromEntries(config.fields.map(f=>[f.key,values[f.key]===''?null:f.type==='select'||f.type==='number'?Number(values[f.key]):String(values[f.key]).trim()]));
  lock.current=true;setBusy(true);setMessage('');
  try{if(editing)await service.update(editing,payload);else await service.create(payload);setValues(null);notify('Datos guardados correctamente.','success');reload();}
  catch(e){const text=apiErrorMessage(e);setMessage(text);notify(text,'error');}
  finally{lock.current=false;setBusy(false);}
 }
 async function confirmRemove(){
  if(lock.current||!remove)return;
  lock.current=true;setBusy(true);setMessage('');
  try{await service.remove(remove[config.id]);setRemove(null);setView(null);notify(config.softDelete?'Registro desactivado.':'Registro eliminado.','success');reload();}
  catch(e){const text=apiErrorMessage(e);setMessage(text);notify(text,'error');}
  finally{lock.current=false;setBusy(false);}
 }
 function display(row,column){
  const [key,,source,idKey,toLabel]=column;
  if(config.annul && key==='anulado')return row.anulado?'Anulado':'Vigente';
  if(source){const item=data.refs[source]?.find(item=>item[idKey]===row[key]);return item?toLabel(item):row[key]==null?'Sin informar':'Referencia '+row[key];}
  return row[key]??'—';
 }
 function renderValue(row,column){
  return config.annul && column[0]==='anulado'
   ? <span className={'status-badge '+(row.anulado?'cancelled':'confirmed')}>{display(row,column)}</span>
   : display(row,column);
 }
 async function confirmAnnul(){
  if(lock.current||!annul)return;
  if(!reason.trim()){setAnnulError('Indicá un motivo de anulación.');return;}
  lock.current=true;setBusy(true);setAnnulError('');
  try{
   const current=await anularHistoriaClinica(annul[config.id],reason.trim());
   setView(current);setValues(null);setAnnul(null);setReason('');
   notify('Registro anulado. Se conserva en el historial del paciente.','success');reload();
  }catch(e){const text=apiErrorMessage(e);setAnnulError(text);notify(text,'error');}
  finally{lock.current=false;setBusy(false);}
 }
 if(loading)return <LoadingState/>;
 if(error)return <ErrorState message={error} onAction={reload}/>;
 const rows=data.rows.filter(row=>config.columns.map(c=>display(row,c)).join(' ').toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
 return <><PageHeader eyebrow="ODONTOSMART" title={config.title} description="Consulta y gestión de información de la clínica."><button className="btn btn-primary" onClick={create} disabled={busy}>Registrar</button></PageHeader>
 {(config.links||[]).length>0&&<div className="patient-actions mb-3">{config.links.map(([url,label])=><Link key={url} to={url} className="btn btn-outline-secondary">{label}</Link>)}</div>}
 {values&&<form className="panel patient-form mb-3" onSubmit={save}><h2>{editing?'Modificar registro':'Registrar'}</h2><fieldset disabled={busy}><div className="row g-3">{config.fields.map(f=><div className="col-12 col-md-6" key={f.key}><label className="form-label" htmlFor={'field-'+f.key}>{f.label}{f.required?' *':''}</label>{f.type==='select'?<select id={'field-'+f.key} className="form-select" value={values[f.key]} required={f.required} disabled={!!editing&&f.immutable} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value,...(f.key==='idPaciente'?{idTurno:''}:{})}))}><option value="">{f.required?'Seleccionar':'Sin informar'}</option>{data.refs[f.source].filter(item=>!f.filter||f.filter(item,values)).map(item=><option key={item[f.idKey]} value={item[f.idKey]}>{f.toLabel(item)}</option>)}</select>:<input id={'field-'+f.key} className="form-control" type={f.type} required={f.required} min={f.min} minLength={f.minLength} maxLength={f.maxLength} value={values[f.key]} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))}/>}</div>)}</div></fieldset>{message&&<p role="alert" className="alert alert-danger mt-3">{message}</p>}<div className="patient-actions mt-3"><button disabled={busy} className="btn btn-primary">{busy?'Guardando…':'Guardar'}</button><button disabled={busy} type="button" className="btn btn-outline-secondary" onClick={()=>setValues(null)}>Cerrar</button></div></form>}
 {view&&<section className="panel patient-form mb-3"><h2>Detalle</h2><dl className="row patient-details">{config.columns.map(c=><div key={c[0]} className="col-12 col-md-6"><dt>{c[1]}</dt><dd>{renderValue(view,c)}</dd></div>)}</dl>{config.annul&&view.anulado&&<div className="patient-reference-note"><p><strong>Registro anulado.</strong> Se conserva para consulta histórica.</p><dl><dt>Motivo de anulación</dt><dd className="clinical-note">{view.motivoAnulacion}</dd><dt>Fecha de anulación</dt><dd>{formatDate(view.fechaAnulacion)} · {formatTime(view.fechaAnulacion)}</dd></dl></div>}<div className="patient-actions">{config.annul&&!view.anulado&&<button type="button" className="btn btn-outline-danger" disabled={busy} onClick={()=>{setAnnul(view);setReason('');setAnnulError('');}}>Anular registro</button>}<button className="btn btn-outline-secondary" disabled={busy} onClick={()=>setView(null)}>Cerrar detalle</button></div></section>}
 <section className="panel"><div className="table-toolbar pt-3"><label className="visually-hidden" htmlFor="entity-search">Buscar</label><input id="entity-search" className="form-control" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar…"/></div>{rows.length?<PaginatedRows rows={rows} filterKey={query}>{visibleRows => <div className="table-responsive" tabIndex={0} role="region" aria-label={config.title}><table className="table appointments-table"><thead><tr>{config.columns.map(c=><th key={c[0]} scope="col">{c[1]}</th>)}<th scope="col">Acciones</th></tr></thead><tbody>{visibleRows.map(row=><tr key={row[config.id]}>{config.columns.map(c=><td key={c[0]}>{renderValue(row,c)}</td>)}<td><div className="patient-actions"><button disabled={busy} className="btn btn-sm btn-outline-secondary" onClick={()=>open(row)}>Ver detalle</button>{!(config.annul&&row.anulado)&&<button disabled={busy} className="btn btn-sm btn-outline-secondary" onClick={()=>open(row,true)}>Modificar</button>}{config.remove&&<button disabled={busy} className="btn btn-sm btn-outline-danger" onClick={()=>{setMessage('');setRemove(row);}}>{config.softDelete?'Desactivar':'Eliminar'}</button>}</div></td></tr>)}</tbody></table></div>}</PaginatedRows>:<EmptyState title={query?'No hay coincidencias':'No hay registros'}/>}</section>
 <ConfirmModal show={!!annul} busy={busy} title="¿Anular este registro de historia clínica?" confirmText="Anular registro" cancelText="Volver" variant="danger" onConfirm={confirmAnnul} onCancel={()=>{if(!busy)setAnnul(null);}} message={<><p>El registro permanecerá en el historial del paciente. Se conservarán el diagnóstico, los tratamientos y las observaciones; después de anularlo sólo podrá consultarse.</p><label className="form-label" htmlFor="annul-reason">Motivo de anulación</label><textarea id="annul-reason" className="form-control" rows={3} maxLength={300} required disabled={busy} value={reason} onChange={e=>{setReason(e.target.value);setAnnulError('');}} aria-invalid={!!annulError} aria-describedby={annulError?'annul-error':undefined}/>{annulError&&<p id="annul-error" role="alert" className="alert alert-danger mt-3">{annulError}</p>}</>}/>
 <ConfirmModal show={!!remove} busy={busy} title={config.softDelete?'Desactivar registro':'Eliminar registro'} message={<><p>{config.softDelete?'Se realizará una baja lógica.':'¿Deseás eliminar este registro? La API comprobará sus relaciones.'}</p>{message&&<p className="alert alert-danger" role="alert">{message}</p>}</>} confirmText={config.softDelete?'Desactivar':'Eliminar'} variant="danger" onConfirm={confirmRemove} onCancel={()=>setRemove(null)}/></>;
}
