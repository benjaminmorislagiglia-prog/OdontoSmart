import useRememberedFilter from '../hooks/useRememberedFilter';
import RecordListSection from '../components/RecordListSection';
import StatusBadge from '../components/StatusBadge';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ConfirmModal from '../components/ConfirmModal';
import usePacienteQuery from '../hooks/usePacienteQuery';
import { resourceService, listIncludingInactive, anularHistoriaClinica } from '../services/clinicService';
import { formatDate, formatTime } from '../utils/formatters';
import { apiErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { digitsOnly, validateFields } from '../utils/formValidation.js';
import ProfilePhotoPicker, { ProfileHeader } from '../components/ProfilePhoto';
import PersonProfile from '../components/PersonProfile';
import { uploadProfilePhoto } from '../services/profileService';

export default function ClinicEntityPage({config}) {
 const service = resourceService(config.resource);
 const {notify} = useNotification();
 const loader = useCallback(async options => {
  const refKeys=(config.refs||[]).filter(key=>key!==config.resource);
  const [rows,inactive,...references] = await Promise.all([
   resourceService(config.resource).list(options),
   config.splitActive?resourceService(config.resource).list({...options,activo:false}):[],
   ...refKeys.map(key=>['pacientes','empleados','odontologos'].includes(key)?listIncludingInactive(key,options):resourceService(key).list(options))
  ]);
  const refs=Object.fromEntries(refKeys.map((key,i)=>[key,references[i]]));
  if(config.refs?.includes(config.resource))refs[config.resource]=[...rows,...inactive];
  return {rows,inactive,refs};
 },[config]);
 const {data,loading,error,reload} = usePacienteQuery(loader);
 const [query,setQuery] = useRememberedFilter(config.resource + '.query', '');
 const [values,setValues] = useState(null);
 const [editing,setEditing] = useState(null);
 const [view,setView] = useState(null);
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState('');
 const [errors,setErrors] = useState({});
 const [photo,setPhoto] = useState(null);
 const [profilePerson,setProfilePerson] = useState(null);
 const employeePhotos=config.resource==='empleados';
 const formRef = useRef(null);
 const [remove,setRemove] = useState(null);
 const [reactivate,setReactivate] = useState(null);
 const [annul,setAnnul] = useState(null);
 const [reason,setReason] = useState('');
 const [annulError,setAnnulError] = useState('');
 const lock = useRef(false);

 async function open(row,edit=false) {
  if(lock.current)return;
  lock.current=true;setBusy(true);setMessage('');
  try {
   const current = await service.get(row[config.id],{incluirInactivos:!!config.splitActive});
   if(employeePhotos)setProfilePerson(current);
   if(config.resource==='odontologos')setProfilePerson(await resourceService('empleados').get(current.idEmpleado,{incluirInactivos:true}));
   setPhoto(null);
   if(edit && config.splitActive && !isActive(current)){notify('Reactivá el registro antes de modificar sus datos.','warning');return;}
   if(edit && config.annul && current.anulado){setView(current);setValues(null);notify('El registro está anulado y sólo admite consulta.','warning');return;}
   if(edit){setEditing(current[config.id]);setValues(Object.fromEntries(config.fields.map(f=>[f.key,current[f.key]??''])));setErrors({});setView(null);}
   else {setView(current);setValues(null);}
  }catch(e){notify(apiErrorMessage(e),'error');}
  finally{lock.current=false;setBusy(false);}
 }
 function create(){setEditing(null);setValues(Object.fromEntries(config.fields.map(f=>[f.key,''])));setErrors({});setMessage('');setView(null);setPhoto(null);setProfilePerson(null);}
 async function save(event) {
  event.preventDefault();if(lock.current)return;
  const validation=validateFields(config.fields,values,data.refs,editing);
  setErrors(validation);setMessage('');
  if(Object.keys(validation).length){formRef.current?.elements.namedItem(Object.keys(validation)[0])?.focus();return;}
  const payload=Object.fromEntries(config.fields.map(f=>{const value=String(values[f.key]??'').trim();return [f.key,value===''?null:f.type==='select'||f.type==='number'?Number(value):value];}));
  lock.current=true;setBusy(true);setMessage('');
  try{
   let target=editing;
   if(editing)await service.update(editing,payload);
   else {
    const created=await service.create(payload);
    if(employeePhotos){target=created[config.id];setEditing(target);setProfilePerson(created);}
   }
   if(employeePhotos&&photo){
    try{await uploadProfilePhoto('Empleados',target,photo);}
    catch(e){throw new Error('Los datos del empleado se guardaron, pero la foto no pudo guardarse. '+apiErrorMessage(e)+' Podés elegir otra foto y volver a guardar.');}
   }
   setValues(null);notify('Datos guardados correctamente.','success');reload();
  }
  catch(e){const text=apiErrorMessage(e);setMessage(text);notify(text,'error');}
  finally{lock.current=false;setBusy(false);}
 }
 async function confirmRemove(){
  if(lock.current||!remove)return;
  lock.current=true;setBusy(true);setMessage('');
  try{await service.remove(remove[config.id]);setRemove(null);setView(null);notify(config.softDelete?'Registro marcado como inactivo.':'Registro eliminado.','success');reload();}
  catch(e){const text=apiErrorMessage(e);setMessage(text);notify(text,'error');}
  finally{lock.current=false;setBusy(false);}
 }
 function display(row,column){
  const [key,,source,idKey,toLabel]=column;
  if(config.splitActive && key==='activo')return isActive(row)?'Activo':'Inactivo';
  if(config.annul && key==='anulado')return row.anulado?'Anulado':'Vigente';
  if(source){const item=data.refs[source]?.find(item=>item[idKey]===row[key]);return item?toLabel(item,data.refs):row[key]==null?'Sin informar':'Referencia '+row[key];}
  return row[key]??'—';
 }
 function renderValue(row,column){
  if(config.splitActive && column[0]==='activo')return <StatusBadge status={display(row,column)}/>;
  return config.annul && column[0]==='anulado'
   ? <span className={'status-badge '+(row.anulado?'cancelled':'confirmed')}>{display(row,column)}</span>
   : display(row,column);
 }
 function employeeActive(row){return config.resource!=='odontologos'||data.refs.empleados.some(e=>e.idEmpleado===row.idEmpleado&&e.activo===true);}
 function isActive(row){return row.activo===true&&employeeActive(row);}
 async function confirmReactivate(){
  if(lock.current||!reactivate)return;
  lock.current=true;setBusy(true);setMessage('');
  try{await service.reactivate(reactivate[config.id]);setReactivate(null);setView(null);notify('Registro reactivado.','success');reload();}
  catch(e){const text=apiErrorMessage(e);setMessage(text);notify(text,'error');}
  finally{lock.current=false;setBusy(false);}
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
 function changeField(field,value){
  if(field.digitsOnly&&!digitsOnly(value)){setErrors(previous=>({...previous,[field.key]:field.validationMessage}));return;}
  setValues(previous=>({...previous,[field.key]:value,...(field.key==='idPaciente'?{idTurno:''}:{})}));
  setErrors(previous=>({...previous,[field.key]:undefined}));
 }
 function renderField(field){
  const id='field-'+field.key;
  const common={id,name:field.key,value:values[field.key],required:field.required,'aria-invalid':!!errors[field.key],
   'aria-describedby':errors[field.key]?id+'-error':field.help?id+'-help':undefined,onChange:event=>changeField(field,event.target.value)};
  return <div className="col-12 col-md-6" key={field.key}><label className="form-label" htmlFor={id}>{field.label}{field.required?' *':''}</label>
   {field.type==='select'?<select {...common} className={'form-select'+(errors[field.key]?' is-invalid':'')} disabled={!!editing&&field.immutable}>
    <option value="">{field.required?'Seleccionar':'Sin informar'}</option>
    {data.refs[field.source].filter(item=>!field.filter||field.filter(item,values,data.refs,editing)).map(item=><option key={item[field.idKey]} value={item[field.idKey]}>{field.toLabel(item,data.refs)}</option>)}
   </select>:<input {...common} className={'form-control'+(errors[field.key]?' is-invalid':'')} type={field.type} inputMode={field.inputMode} pattern={field.pattern} min={field.min} max={field.max} step={field.step} minLength={field.minLength} maxLength={field.maxLength}/>}
   {field.help&&<p className="form-help" id={id+'-help'}>{field.help}</p>}
   {errors[field.key]&&<div className="invalid-feedback" id={id+'-error'}>{errors[field.key]}</div>}
  </div>;
 }
 if(loading)return <LoadingState/>;
 if(error)return <ErrorState message={error} onAction={reload}/>;
 const filtered=rows=>rows.filter(row=>config.columns.map(c=>display(row,c)).join(' ').toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
 return <><PageHeader eyebrow="ODONTOSMART" title={config.title} description="Consulta y gestión de información de la clínica."><button className="btn btn-primary" onClick={create} disabled={busy}>Registrar</button></PageHeader>
 {(config.links||[]).length>0&&<div className="patient-actions mb-3">{config.links.map(([url,label])=><Link key={url} to={url} className="btn btn-outline-secondary">{label}</Link>)}</div>}
 {values&&<form ref={formRef} noValidate className="panel patient-form mb-3" onSubmit={save}><h2>{editing?'Modificar registro':'Registrar'}</h2><fieldset disabled={busy}>{employeePhotos&&<ProfilePhotoPicker person={{...profilePerson,...values}} file={photo} onChange={setPhoto} disabled={busy}/>}<div className="row g-3">{config.fields.map(renderField)}</div></fieldset>{message&&<p role="alert" className="alert alert-danger mt-3">{message}</p>}<div className="patient-actions mt-3"><button disabled={busy} className="btn btn-primary">{busy?'Guardando…':'Guardar'}</button><button disabled={busy} type="button" className="btn btn-outline-secondary" onClick={()=>setValues(null)}>Cerrar</button></div></form>}
 {view&&<section className="panel patient-form mb-3"><h2>Detalle</h2>{employeePhotos?<PersonProfile person={view} direction={data.refs.direcciones.find(d=>d.idDireccion===view.idDireccion)} localities={data.refs.localidades} provinces={data.refs.provincias} extraFields={[["Puesto",display(view,["idPuesto","Puesto","puestos","idPuesto",p=>p.nombre])],["Estado",renderValue(view,["activo"])]]}/>:<>{config.resource==="odontologos"&&profilePerson&&<ProfileHeader person={profilePerson}/>}<dl className="row patient-details">{(config.detailColumns||config.columns).map(c=><div key={c[0]} className="col-12 col-md-6"><dt>{c[1]}</dt><dd>{renderValue(view,c)}</dd></div>)}</dl></>}{config.annul&&view.anulado&&<div className="patient-reference-note"><p><strong>Registro anulado.</strong> Se conserva para consulta histórica.</p><dl><dt>Motivo de anulación</dt><dd className="clinical-note">{view.motivoAnulacion}</dd><dt>Fecha de anulación</dt><dd>{formatDate(view.fechaAnulacion)} · {formatTime(view.fechaAnulacion)}</dd></dl></div>}<div className="patient-actions">{config.annul&&!view.anulado&&<button type="button" className="btn btn-outline-danger" disabled={busy} onClick={()=>{setAnnul(view);setReason('');setAnnulError('');}}>Anular registro</button>}<button className="btn btn-outline-secondary" disabled={busy} onClick={()=>setView(null)}>Cerrar detalle</button></div></section>}
 <section className="panel mb-3"><div className="table-toolbar pt-3"><label className="visually-hidden" htmlFor="entity-search">Buscar</label><input id="entity-search" className="form-control" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar…"/></div></section>
 {[{title:config.splitActive?config.title+' activos':config.title,rows:data.rows,inactive:false},...(config.splitActive?[{title:config.title+' inactivos',rows:data.inactive,inactive:true}]:[])].map(section=><RecordListSection key={section.title} title={section.title} rows={filtered(section.rows)} idKey={config.id} filterKey={query} emptyMessage={query?'No hay coincidencias':'No hay registros.'} columns={config.columns.map(c=>({key:c[0],label:c[1],render:row=>renderValue(row,c)}))} actions={row=><>
   <button disabled={busy} className="btn btn-sm btn-outline-secondary" onClick={()=>open(row)}>Ver detalle</button>
   {section.inactive?<>{employeeActive(row)?<button disabled={busy} className="btn btn-sm btn-outline-primary" onClick={()=>{setMessage('');setReactivate(row);}}>Reactivar</button>:<Link className="btn btn-sm btn-outline-secondary" to="/empleados">Reactivar primero al empleado</Link>}</>:<>
    {!(config.annul&&row.anulado)&&<button disabled={busy} className="btn btn-sm btn-outline-secondary" onClick={()=>open(row,true)}>Modificar</button>}
    {config.remove&&<button disabled={busy} className="btn btn-sm btn-outline-danger" onClick={()=>{setMessage('');setRemove(row);}}>{config.softDelete?'Desactivar':'Eliminar'}</button>}
   </>}
 </>}/>)}
 <ConfirmModal show={!!reactivate} busy={busy} title="Reactivar registro" message={<><p>El registro volverá al listado de activos con sus mismos datos e historial.</p>{message&&<p className="alert alert-danger" role="alert">{message}</p>}</>} confirmText="Reactivar" onConfirm={confirmReactivate} onCancel={()=>{if(!busy)setReactivate(null);}}/>
 <ConfirmModal show={!!annul} busy={busy} title="¿Anular este registro de historia clínica?" confirmText="Anular registro" cancelText="Volver" variant="danger" onConfirm={confirmAnnul} onCancel={()=>{if(!busy)setAnnul(null);}} message={<><p>El registro permanecerá en el historial del paciente. Se conservarán el diagnóstico, los tratamientos y las observaciones; después de anularlo sólo podrá consultarse.</p><label className="form-label" htmlFor="annul-reason">Motivo de anulación</label><textarea id="annul-reason" className="form-control" rows={3} maxLength={300} required disabled={busy} value={reason} onChange={e=>{setReason(e.target.value);setAnnulError('');}} aria-invalid={!!annulError} aria-describedby={annulError?'annul-error':undefined}/>{annulError&&<p id="annul-error" role="alert" className="alert alert-danger mt-3">{annulError}</p>}</>}/>
 <ConfirmModal show={!!remove} busy={busy} title={config.softDelete?'Desactivar registro':'Eliminar registro'} message={<><p>{config.softDelete?'Se desactivará el registro y se conservarán sus datos e historial.':'¿Deseás eliminar este registro? La API comprobará sus relaciones.'}</p>{message&&<p className="alert alert-danger" role="alert">{message}</p>}</>} confirmText={config.softDelete?'Desactivar':'Eliminar'} variant="danger" onConfirm={confirmRemove} onCancel={()=>setRemove(null)}/></>;
}
