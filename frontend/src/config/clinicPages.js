import { labelDireccion, labelPersona } from '../services/clinicService';
import {
  validDni,
  validPersonName,
  validPhone,
  validPostalCode,
  validRegistration,
  validDays,
  validHours,
} from '../utils/formValidation.js';
const text = (key, label, maxLength = 100, required = true) => ({
  key,
  label,
  type: 'text',
  maxLength,
  required,
});
const select = (key, label, source, idKey, toLabel, required = true) => ({
  key,
  label,
  type: 'select',
  source,
  idKey,
  toLabel,
  required,
});
const named = (item) => item.nombre;
const person = (key, label, source, idKey) => select(key, label, source, idKey, labelPersona);
const doctorLabel = (o, refs) => {
  const employee = refs?.empleados?.find((e) => e.idEmpleado === o.idEmpleado);
  return (employee ? labelPersona(employee) + ' · ' : 'Matrícula ') + o.nroMatricula;
};
const doctorEmployee = {
  ...person('idEmpleado', 'Empleado', 'empleados', 'idEmpleado'),
  filter: (e, values, refs, editing) =>
    e.activo === true &&
    !refs.odontologos.some((o) => o.idEmpleado === e.idEmpleado && o.idOdontologo !== editing),
};
const dniField = {
  ...text('dni', 'DNI', 20),
  inputMode: 'numeric',
  pattern: '[0-9]*',
  digitsOnly: true,
  validate: validDni,
  validationMessage: 'El DNI sólo admite números, sin puntos ni espacios.',
};
const nameField = (key, label) => ({
  ...text(key, label),
  validate: validPersonName,
  validationMessage: 'Usá letras, espacios, apóstrofes o guiones.',
});
const phoneField = {
  ...text('telefono', 'Teléfono', 20, false),
  type: 'tel',
  validate: validPhone,
  validationMessage: 'Usá números y, si hace falta, +, espacios, paréntesis, puntos o guiones.',
};
export const clinicPages = {
  especialidades: {
    title: 'Especialidades',
    resource: 'especialidades',
    id: 'idEspecialidad',
    fields: [{ ...text('nombre', 'Nombre'), minLength: 2 }],
    columns: [['nombre', 'Nombre']],
    remove: true,
    links: [
      ['/odontologos', 'Volver a odontólogos'],
      ['/odontologos/especialidades', 'Asignar especialidades'],
    ],
  },
  odontologos: {
    title: 'Odontólogos',
    resource: 'odontologos',
    id: 'idOdontologo',
    refs: ['empleados', 'odontologos'],
    fields: [
      doctorEmployee,
      {
        ...text('nroMatricula', 'Matrícula', 50),
        validate: validRegistration,
        validationMessage: 'Usá letras, números, espacios, puntos, guiones o barras.',
      },
      {
        ...text('diaAtencion', 'Días de atención', 50),
        validate: validDays,
        validationMessage: 'Indicá los días con letras, por ejemplo Lunes a viernes.',
      },
      {
        ...text('horarioAtencion', 'Horario de atención', 50),
        validate: validHours,
        validationMessage: 'Usá un rango válido, por ejemplo 09:00-17:00.',
        help: 'Formato: 09:00-17:00 o 09:00 a 17:00.',
      },
    ],
    columns: [
      ['idEmpleado', 'Nombre', 'empleados', 'idEmpleado', labelPersona],
      ['nroMatricula', 'Matrícula'],
      ['diaAtencion', 'Días'],
      ['horarioAtencion', 'Horario'],
      ['activo', 'Estado'],
    ],
    remove: true,
    softDelete: true,
    splitActive: true,
    links: [
      ['/empleados', 'Gestionar empleados'],
      ['/odontologos/catalogo-especialidades', 'Gestionar especialidades'],
      ['/odontologos/especialidades', 'Asignar especialidades'],
    ],
  },
  historias: {
    title: 'Historia clínica',
    resource: 'historias',
    annul: true,
    id: 'idHistorialClinico',
    refs: ['pacientes', 'turnos'],
    fields: [
      {
        ...person('idPaciente', 'Paciente', 'pacientes', 'idPaciente'),
        immutable: true,
        filter: (item, values) =>
          item.activo === true || String(item.idPaciente) === String(values.idPaciente),
      },
      {
        ...select(
          'idTurno',
          'Turno',
          'turnos',
          'idTurno',
          (t) => t.fecha + ' ' + t.hora.slice(0, 5) + ' · ' + t.paciente,
        ),
        immutable: true,
        filter: (item, values) => String(item.idPaciente) === String(values.idPaciente),
      },
      text('diagnostico', 'Diagnóstico', 500, false),
      text('tratamientosRealizados', 'Tratamientos realizados', 500, false),
      text('observaciones', 'Observaciones', 500, false),
    ],
    columns: [
      ['idPaciente', 'Paciente', 'pacientes', 'idPaciente', labelPersona],
      [
        'idTurno',
        'Turno',
        'turnos',
        'idTurno',
        (t) => t.fecha + ' ' + t.hora.slice(0, 5) + ' · ' + t.odontologo,
      ],
      ['diagnostico', 'Diagnóstico'],
      ['tratamientosRealizados', 'Tratamientos'],
      ['observaciones', 'Observaciones'],
      ['anulado', 'Estado'],
    ],
  },
  estados: {
    title: 'Estados de turno',
    resource: 'estados',
    id: 'idEstadoTurno',
    fields: [{ ...text('nombre', 'Nombre', 50), minLength: 2 }],
    columns: [['nombre', 'Nombre']],
    remove: true,
  },
  asociaciones: {
    title: 'Especialidades de odontólogos',
    resource: 'asociaciones',
    id: 'idOdontologoEspecialidad',
    refs: ['odontologos', 'empleados', 'especialidades'],
    fields: [
      {
        ...select('idOdontologo', 'Odontólogo', 'odontologos', 'idOdontologo', doctorLabel),
        filter: (o, values, refs) =>
          String(o.idOdontologo) === String(values.idOdontologo) ||
          (o.activo &&
            refs.empleados.some((e) => e.idEmpleado === o.idEmpleado && e.activo === true)),
      },
      select('idEspecialidad', 'Especialidad', 'especialidades', 'idEspecialidad', named),
    ],
    columns: [
      ['idOdontologo', 'Odontólogo', 'odontologos', 'idOdontologo', doctorLabel],
      ['idEspecialidad', 'Especialidad', 'especialidades', 'idEspecialidad', named],
    ],
    remove: true,
    links: [
      ['/odontologos', 'Volver a odontólogos'],
      ['/odontologos/catalogo-especialidades', 'Gestionar especialidades'],
    ],
  },
  empleados: {
    title: 'Empleados',
    resource: 'empleados',
    id: 'idEmpleado',
    refs: ['puestos', 'direcciones', 'localidades', 'provincias'],
    fields: [
      dniField,
      nameField('nombre', 'Nombre'),
      nameField('apellido', 'Apellido'),
      { ...text('correo', 'Correo', 100, false), type: 'email' },
      phoneField,
      select('idPuesto', 'Puesto', 'puestos', 'idPuesto', named),
      select('idDireccion', 'Dirección', 'direcciones', 'idDireccion', labelDireccion, false),
    ],
    columns: [
      ['nombre', 'Nombre'],
      ['apellido', 'Apellido'],
      ['dni', 'DNI'],
      ['telefono', 'Teléfono'],
      ['idPuesto', 'Puesto', 'puestos', 'idPuesto', named],
      ['activo', 'Estado'],
    ],
    remove: true,
    softDelete: true,
    splitActive: true,
  },
  direcciones: {
    title: 'Direcciones',
    resource: 'direcciones',
    id: 'idDireccion',
    refs: ['localidades'],
    fields: [
      { ...text('calle', 'Calle'), minLength: 2 },
      {
        key: 'numero',
        label: 'Número',
        type: 'number',
        min: 1,
        max: 2147483647,
        step: 1,
        inputMode: 'numeric',
        required: true,
      },
      text('barrio', 'Barrio', 100, false),
      {
        ...text('cp', 'Código postal', 10),
        minLength: 4,
        validate: validPostalCode,
        validationMessage: 'Usá entre 4 y 10 letras o números, incluyendo al menos un número.',
        help: 'Ejemplos: 5000 o X5000ABC.',
      },
      select('idLocalidad', 'Localidad', 'localidades', 'idLocalidad', named),
    ],
    columns: [
      ['calle', 'Calle'],
      ['numero', 'Número'],
      ['barrio', 'Barrio'],
      ['cp', 'CP'],
      ['idLocalidad', 'Localidad', 'localidades', 'idLocalidad', named],
    ],
    remove: true,
  },
};
clinicPages.empleados.detailColumns = clinicPages.empleados.fields
  .map((f) => [f.key, f.label, f.source, f.idKey, f.toLabel])
  .concat([['activo', 'Estado']]);
