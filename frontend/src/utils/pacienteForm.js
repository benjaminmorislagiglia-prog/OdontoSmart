import { validDni, validPersonName, validPhone, validEmail, validDate, todayKey } from './formValidation.js';
export const emptyPaciente = { dni: '', nombre: '', apellido: '', telefono: '', correo: '', fechaNacimiento: '', idObraSocial: '', idDireccion: '' };
export function pacienteToForm(patient) { return Object.fromEntries(Object.keys(emptyPaciente).map(key => [key, patient[key] == null ? '' : String(patient[key])])); }
export function validatePaciente(values) {
 const errors = {};
 for (const [key, label, limit] of [['dni', 'DNI', 20], ['nombre', 'Nombre', 100], ['apellido', 'Apellido', 100]]) {
  if (!values[key].trim()) errors[key] = label + ' es obligatorio.';
  else if (values[key].trim().length > limit) errors[key] = 'Máximo ' + limit + ' caracteres.';
 }
 if(!errors.dni&&!validDni(values.dni.trim()))errors.dni='El DNI sólo admite números, sin puntos ni espacios.';
 for(const key of ['nombre','apellido'])if(!errors[key]&&!validPersonName(values[key].trim()))errors[key]='Usá letras, espacios, apóstrofes o guiones.';
 const date = values.fechaNacimiento;
 if (!validDate(date)||date>todayKey()) errors.fechaNacimiento = 'Ingresá una fecha de nacimiento válida que no sea futura.';
 if (values.telefono.trim().length > 20) errors.telefono = 'Máximo 20 caracteres.';
 else if(values.telefono.trim()&&!validPhone(values.telefono.trim()))errors.telefono='Usá números y, si hace falta, +, espacios, paréntesis, puntos o guiones.';
 if (values.correo.trim() && (!validEmail(values.correo.trim()) || values.correo.trim().length > 100)) errors.correo = 'Ingresá un correo válido de hasta 100 caracteres.';
 for (const key of ['idDireccion', 'idObraSocial']) {
  if ((key === 'idDireccion' || values[key] !== '') && (!/^[1-9]\d*$/.test(values[key]) || Number(values[key]) > 2147483647)) errors[key] = 'Ingresá un ID existente, entero positivo de hasta 2147483647.';
 }
 return errors;
}
export function pacientePayload(values) {
 return { dni: values.dni.trim(), nombre: values.nombre.trim(), apellido: values.apellido.trim(), telefono: values.telefono.trim() || null, correo: values.correo.trim() || null, fechaNacimiento: values.fechaNacimiento, idObraSocial: values.idObraSocial === '' ? null : Number(values.idObraSocial), idDireccion: Number(values.idDireccion) };
}
