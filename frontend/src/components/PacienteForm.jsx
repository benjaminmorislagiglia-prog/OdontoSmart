import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingState from './LoadingState';
import { emptyPaciente, pacienteToForm, pacientePayload, validatePaciente } from '../utils/pacienteForm';
export default function PacienteForm({ patient = null, onSave, cancelTo }) {
 const [values, setValues] = useState(() => patient ? pacienteToForm(patient) : { ...emptyPaciente });
 const [errors, setErrors] = useState({});
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState('');
 const lock = useRef(false);
 const formRef = useRef(null);
 async function submit(event) {
  event.preventDefault();
  if (lock.current) return;
  const validation = validatePaciente(values);
  setErrors(validation); setMessage('');
  if (Object.keys(validation).length) { formRef.current?.elements.namedItem(Object.keys(validation)[0])?.focus(); return; }
  lock.current = true; setBusy(true);
  try { await onSave(pacientePayload(values)); }
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
 return <form ref={formRef} onSubmit={submit} noValidate className="panel patient-form"><p className="form-help">Los campos con * son obligatorios.</p><fieldset disabled={busy}><legend className="visually-hidden">Datos del paciente</legend><div className="row g-3">{fields.map(field)}</div><section className="patient-reference-note"><h2>Referencias de dirección y obra social</h2><p>Integración temporal de desarrollo: todavía no hay catálogos disponibles. Ingresá únicamente IDs existentes proporcionados por el equipo de la API. Estos campos se reemplazarán por selectores cuando se habiliten los catálogos.</p><p>La API exige una dirección válida. Sin ese ID no se puede registrar al paciente. La obra social es opcional.</p><div className="row g-3">{field(['idDireccion', 'ID de dirección existente', 'text', 10, true])}{field(['idObraSocial', 'ID de obra social existente (opcional)', 'text', 10, false])}</div></section></fieldset>{message && <div className="alert alert-danger" role="alert">{message}</div>}<div className="patient-actions"><button className="btn btn-primary" disabled={busy} type="submit">{busy ? <LoadingState inline message="Guardando…" /> : 'Guardar paciente'}</button>{busy ? <button type="button" className="btn btn-outline-secondary" disabled>Volver</button> : <Link to={cancelTo} className="btn btn-outline-secondary">Volver</Link>}</div></form>;
}
