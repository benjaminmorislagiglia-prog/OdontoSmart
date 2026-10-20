// Identificadores numéricos se mantienen como texto para conservar ceros iniciales.
export const digitsOnly = value => /^[0-9]*$/.test(value);
export const validDni = value => /^[0-9]{1,20}$/.test(value);
export const validPersonName = value => /^(?=.*\p{L})[\p{L}\p{M} .'’-]+$/u.test(value);
export const validPhone = value => /^(?=.*[0-9])[+]?[0-9() .-]+$/.test(value);
export const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const validPostalCode = value => /^(?=.*[0-9])[A-Za-z0-9]{4,10}$/.test(value);
export const validRegistration = value => /^[A-Za-z0-9]+(?:[ ./-][A-Za-z0-9]+)*$/.test(value);
export const validDays = value => /^(?=.*\p{L})[\p{L}\p{M} ,/.-]+$/u.test(value);
export const validHours = value => /^(?:[01][0-9]|2[0-3]):[0-5][0-9]\s*(?:-|a)\s*(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
export const todayKey = (date = new Date()) => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
export const validDate = value => {
 if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)||Number(value.slice(0,4))<1)return false;
 const parsed=new Date(value+'T00:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
};

export function validateFields(fields, values, refs = {}, editing = null) {
 const errors = {};
 for(const field of fields) {
  const value=String(values[field.key]??'').trim();
  if(!value) {if(field.required)errors[field.key]=field.label+' es obligatorio.';continue;}
  if(field.maxLength&&value.length>field.maxLength)errors[field.key]='Máximo '+field.maxLength+' caracteres.';
  else if(field.minLength&&value.length<field.minLength)errors[field.key]='Mínimo '+field.minLength+' caracteres.';
  else if(field.type==='select') {
   const choices=refs[field.source]||[];
   if(!/^[1-9][0-9]*$/.test(value)||Number(value)>2147483647||!choices.some(item=>String(item[field.idKey])===value&&(!field.filter||field.filter(item,values,refs,editing))))
    errors[field.key]='Seleccioná una opción válida.';
  } else if(field.type==='number'&&(!/^[0-9]+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<(field.min??0)||Number(value)>(field.max??2147483647)))
   errors[field.key]='Ingresá un número entero entre '+(field.min??0)+' y '+(field.max??2147483647)+'.';
  else if(field.type==='email'&&!validEmail(value))errors[field.key]='Ingresá un correo válido.';
  else if(field.validate&&!field.validate(value))errors[field.key]=field.validationMessage;
 }
 return errors;
}
