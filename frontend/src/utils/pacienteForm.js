export const emptyPaciente = { dni: '', nombre: '', apellido: '', telefono: '', correo: '', fechaNacimiento: '', idObraSocial: '', idDireccion: '' };
export function pacienteToForm(patient) { return Object.fromEntries(Object.keys(emptyPaciente).map(key => [key, patient[key] == null ? '' : String(patient[key])])); }
export function validatePaciente(values) {
 const errors = {};
 for (const [key, label, limit] of [['dni', 'DNI', 20], ['nombre', 'Nombre', 100], ['apellido', 'Apellido', 100]]) {
  if (!values[key].trim()) errors[key] = label + ' es obligatorio.';
  else if (values[key].trim().length > limit) errors[key] = 'Máximo ' + limit + ' caracteres.';
 }
 const date = values.fechaNacimiento;
 const parsed = new Date(date + 'T00:00:00Z');
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) errors.fechaNacimiento = 'Ingresá una fecha de nacimiento válida.';
 if (values.telefono.trim().length > 20) errors.telefono = 'Máximo 20 caracteres.';
 if (values.correo.trim() && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo.trim()) || values.correo.trim().length > 100)) errors.correo = 'Ingresá un correo válido de hasta 100 caracteres.';
 for (const key of ['idDireccion', 'idObraSocial']) {
  if ((key === 'idDireccion' || values[key] !== '') && (!/^[1-9]\d*$/.test(values[key]) || Number(values[key]) > 2147483647)) errors[key] = 'Ingresá un ID existente, entero positivo de hasta 2147483647.';
 }
 return errors;
}
export function pacientePayload(values) {
 return { dni: values.dni.trim(), nombre: values.nombre.trim(), apellido: values.apellido.trim(), telefono: values.telefono.trim() || null, correo: values.correo.trim() || null, fechaNacimiento: values.fechaNacimiento, idObraSocial: values.idObraSocial === '' ? null : Number(values.idObraSocial), idDireccion: Number(values.idDireccion) };
}
