import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingState from './LoadingState';
import { labelDireccion } from '../services/clinicService';
import { emptyPaciente, pacienteToForm, pacientePayload, validatePaciente } from '../utils/pacienteForm';
export default function PacienteForm({ patient = null, catalogs, onSave, cancelTo }) {
 const [values, setValues] = useState(() => patient ? pacienteToForm(patient) : { ...emptyPaciente });
 const [errors, setErrors] = useState({});
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState('');
 const lock = useRef(false);
 const formRef = useRef(null);
 const inactive = patient != null && patient.activo !== true;
 async function submit(event) {
  event.preventDefault();
  if (lock.current) return;
  const validation = validatePaciente(values);
  setErrors(validation); setMessage('');
  if (Object.keys(validation).length) { formRef.current?.elements.namedItem(Object.keys(validation)[0])?.focus(); return; }
  lock.current = true; setBusy(true);
  const reactivar = inactive && event.nativeEvent.submitter?.value === 'reactivar';
  try { await onSave(pacientePayload(values), { reactivar }); }
  catch (error) { setMessage(error.message); }
  finally { lock.current = false; setBusy(false); }
 }
 const fields = [
  ['dni', 'DNI', 'text', 20, true], ['nombre', 'Nombre', 'text', 100, true],
  ['apellido', 'Apellido', 'text', 100, true], ['fechaNacimiento', 'Fecha de nacimiento', 'date', undefined, true],
  ['telefono', 'Teléfono', 'tel', 20, false], ['correo', 'Correo', 'email', 100, false],
 ];
 function field([key, label, type, maxLength, required]) {
  return <div className="col-12 col-md-6" key={key}><label className="form-label" htmlFor={key}>{label}{required ? ' *' : ''}</label><input id={key} name={key} className={'form-control' + (errors[key] ? ' is-invalid' : '')} type={type} maxLength={maxLength} required={required} value={values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? key + '-error' : undefined} />{errors[key] && <div id={key + '-error'} className="invalid-feedback">{errors[key]}</div>}</div>;
 }
 return <form ref={formRef} onSubmit={submit} noValidate className="panel patient-form">{inactive && <p className="patient-reference-note"><strong>Paciente desactivado.</strong> Podés guardar los datos manteniendo este estado o elegir Guardar y reactivar.</p>}<p className="form-help">Los campos con * son obligatorios.</p><fieldset disabled={busy}><legend className="visually-hidden">Datos del paciente</legend><div className="row g-3">{fields.map(field)}</div><section className="patient-reference-note"><h2>Dirección y cobertura</h2><div className="row g-3">{[['idDireccion','Dirección',catalogs.direcciones,'idDireccion',labelDireccion,true],['idObraSocial','Obra social',catalogs.obrasSociales,'idObraSocial',item=>item.nombre,false]].map(([key,label,items,idKey,toLabel,required])=><div className="col-12 col-md-6" key={key}><label htmlFor={key} className="form-label">{label}{required?' *':''}</label><select id={key} name={key} value={values[key]} required={required} className={'form-select'+(errors[key]?' is-invalid':'')} aria-invalid={!!errors[key]} aria-describedby={errors[key]?key+'-error':undefined} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}><option value="">{required?'Seleccionar dirección':'Sin obra social'}</option>{items.map(item=><option key={item[idKey]} value={item[idKey]}>{toLabel(item)}</option>)}</select>{errors[key]&&<div id={key+'-error'} className="invalid-feedback">{errors[key]}</div>}</div>)}</div>{!catalogs.direcciones.length&&<p className="form-help">No hay direcciones registradas. Registrá una dirección antes del alta.</p>}<Link to="/pacientes/direcciones">Gestionar direcciones</Link></section></fieldset>{message && <div className="alert alert-danger" role="alert">{message}</div>}<div className="patient-actions"><button className="btn btn-primary" disabled={busy} type="submit">{busy ? <LoadingState inline message="Guardando…" /> : 'Guardar paciente'}</button>{inactive && <button className="btn btn-outline-primary" disabled={busy} type="submit" name="accion" value="reactivar">Guardar y reactivar</button>}{busy ? <button type="button" className="btn btn-outline-secondary" disabled>Volver</button> : <Link to={cancelTo} className="btn btn-outline-secondary">Volver</Link>}</div></form>;
}
