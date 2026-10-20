import assert from 'node:assert/strict';

const origin = process.env.ODONTOSMART_API_URL;
if (!origin || !['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw Error('Configurá ODONTOSMART_API_URL con una API local de desarrollo.');
if (!process.argv.includes('--allow-write'))
  throw Error('Usar --allow-write: crea registros identificados de prueba y conserva el historial.');
let checks = 0;
async function request(route, method = 'GET', body, expected = 200) {
  const response = await fetch(origin.replace(/\/+$/, '') + '/api/' + route, {
    method, headers: {'Content-Type': 'application/json'}, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  assert.equal(response.status, expected, method + ' ' + route + ': ' + text.slice(0, 300));
  checks++;
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}
const stamp = Date.now().toString();
const directions = await request('direcciones');
const jobs = await request('puestos');
const rooms = await request('consultorios');
const states = await request('estadosturno');
assert.ok(directions.length && jobs.length && rooms.length, 'Faltan catálogos locales.');
const originals = Object.fromEntries(await Promise.all(['Pacientes','Empleados','Odontologos'].map(async route=>[route,await request(route)])));
let patient, employee, doctor, turn, association, specialty, room;
try {
  const patientBody = {dni:stamp,nombre:'Verificación',apellido:'Gestión '+stamp,telefono:'1100000000',correo:null,
    fechaNacimiento:'1990-05-10',idDireccion:directions[0].idDireccion,idObraSocial:null};
  patient = await request('Pacientes','POST',patientBody,201);
  await request('Pacientes/'+patient.idPaciente,'PUT',{...patientBody,telefono:'1100000001'},204);
  assert.equal((await request('Pacientes/'+patient.idPaciente)).telefono,'1100000001');
  const employeeBody = {dni:'E'+stamp,nombre:'Verificación',apellido:'Personal '+stamp,telefono:'1100000000',correo:null,
    idPuesto:jobs[0].idPuesto,idDireccion:directions[0].idDireccion};
  employee = await request('Empleados','POST',employeeBody,201);
  await request('Empleados/'+employee.idEmpleado,'PUT',{...employeeBody,telefono:'1100000002'},204);
  assert.equal((await request('Empleados/'+employee.idEmpleado)).telefono,'1100000002');
  const doctorBody={idEmpleado:employee.idEmpleado,nroMatricula:'QA-'+stamp,diaAtencion:'Lunes a viernes',horarioAtencion:'08:00 a 18:00'};
  doctor=await request('Odontologos','POST',doctorBody,201);
  assert.deepEqual(Object.keys(doctor).sort(),['activo','diaAtencion','horarioAtencion','idEmpleado','idOdontologo','nroMatricula'].sort());
  await request('Odontologos','POST',{...doctorBody,nroMatricula:'Otra-'+stamp},409);
  await request('Odontologos/'+doctor.idOdontologo,'PUT',{...doctorBody,horarioAtencion:'09:00 a 18:00'},204);
  assert.equal((await request('Odontologos/'+doctor.idOdontologo)).horarioAtencion,'09:00 a 18:00');
  specialty=await request('especialidades','POST',{nombre:'Verificación '+stamp},201);
  assert.equal((await request('especialidades/'+specialty.idEspecialidad)).nombre,specialty.nombre);
  association=await request('odontologoespecialidades','POST',{idOdontologo:doctor.idOdontologo,idEspecialidad:specialty.idEspecialidad},201);
  assert.ok((await request('odontologoespecialidades/odontologo/'+doctor.idOdontologo)).some(a=>a.idEspecialidad===specialty.idEspecialidad));
  room=await request('consultorios','POST',{nombre:'Verificación '+stamp,idDireccion:directions[0].idDireccion},201);
  assert.ok((await request('consultorios')).some(r=>r.idConsultorio===room.idConsultorio));
  assert.equal((await request('consultorios/'+room.idConsultorio)).nombre,room.nombre);
  // Se prueba el consultorio temporal sin asociarle historial, para poder retirarlo al finalizar.
  const date=new Date(); date.setUTCDate(date.getUTCDate()+14);
  const day=date.toISOString().slice(0,10);
  const turns=await request('Turnos');
  const hours=Array.from({length:16},(_,i)=>`${String(8+Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}:00`);
  const hour=hours.find(h=>!turns.some(t=>t.fecha===day&&t.hora===h&&t.idConsultorio===rooms[0].idConsultorio&&t.estado!=='Cancelado'));
  assert.ok(hour,'No hay un horario libre para la prueba.');
  const turnBody={fecha:day,hora:hour,idPaciente:patient.idPaciente,idOdontologo:doctor.idOdontologo,idConsultorio:rooms[0].idConsultorio};
  turn=await request('Turnos','POST',turnBody,201);
  const clinical=await request('HistorialClinico','POST',{idPaciente:patient.idPaciente,idTurno:turn.idTurno,
    diagnostico:'Registro exclusivo de verificación de gestión.',tratamientosRealizados:null,observaciones:'Conservar relaciones al desactivar/reactivar.'},201);
  for(const [route,entity,key] of [['Pacientes',patient,'idPaciente'],['Empleados',employee,'idEmpleado']]) {
    const id=entity[key];
    await request(route+'/'+id,'DELETE',undefined,204);
    assert.ok(!(await request(route)).some(r=>r[key]===id));
    assert.ok((await request(route+'?activo=false')).some(r=>r[key]===id));
    await request(route+'/'+id,'GET',undefined,404);
    assert.equal((await request(route+'/'+id+'?incluirInactivos=true')).activo,false);
    await request('Turnos','POST',{...turnBody,hora:'18:30:00'},400);
    if(route==='Empleados') {
      assert.ok(!(await request('Odontologos')).some(r=>r.idOdontologo===doctor.idOdontologo));
      assert.ok((await request('Odontologos?activo=false')).some(r=>r.idOdontologo===doctor.idOdontologo));
      await request('Odontologos/'+doctor.idOdontologo,'GET',undefined,404);
      assert.equal((await request('Odontologos/'+doctor.idOdontologo+'?incluirInactivos=true')).activo,true);
      await request('Odontologos/'+doctor.idOdontologo+'/reactivar','POST',undefined,409);
    }
    assert.deepEqual(await request('HistorialClinico/'+clinical.idHistorialClinico),clinical);
    assert.equal((await request('Turnos/'+turn.idTurno)).idPaciente,patient.idPaciente);
    await request(route+'/'+id+'/reactivar','POST',undefined,204);
    await request(route+'/'+id+'/reactivar','POST',undefined,204);
    assert.equal((await request(route)).filter(r=>r[key]===id).length,1);
    assert.ok(!(await request(route+'?activo=false')).some(r=>r[key]===id));
    assert.equal((await request(route+'/'+id)).activo,true);
  }
  assert.ok((await request('Odontologos')).some(r=>r.idOdontologo===doctor.idOdontologo));
  await request('Odontologos/'+doctor.idOdontologo,'DELETE',undefined,204);
  await request('Empleados/'+employee.idEmpleado,'DELETE',undefined,204);
  await request('Empleados/'+employee.idEmpleado+'/reactivar','POST',undefined,204);
  assert.equal((await request('Odontologos/'+doctor.idOdontologo+'?incluirInactivos=true')).activo,false);
  await request('Odontologos/'+doctor.idOdontologo+'/reactivar','POST',undefined,204);
  assert.equal((await request('Odontologos/'+doctor.idOdontologo)).activo,true);
  assert.ok((await request('odontologoespecialidades/odontologo/'+doctor.idOdontologo)).some(a=>a.idOdontologoEspecialidad===association.idOdontologoEspecialidad));
  const expected=[];
  for(const name of ['Pendiente','Confirmado','Ausente','Atendido','Cancelado']) {
    const state=states.find(s=>s.nombre===name);assert.ok(state,'Falta '+name);
    expected.push(state.idEstadoTurno);
    if(name!=='Pendiente')await request('historialestadoturno','POST',{idTurno:turn.idTurno,idEstadoTurno:state.idEstadoTurno},201);
    assert.equal((await request('Turnos/'+turn.idTurno)).estado,name);
  }
  const history=await request('historialestadoturno/turno/'+turn.idTurno);
  assert.deepEqual(history.map(h=>h.idEstadoTurno),expected);
  assert.ok(history.every(h=>Number.isFinite(Date.parse(h.fechaHora))));
  assert.deepEqual(await request('estadosturno'),states);
  for(const [route,items] of Object.entries(originals)) {
    const current=await request(route);
    for(const item of items)assert.ok(current.some(r=>JSON.stringify(r)===JSON.stringify(item)),'Se alteró un registro previo de '+route);
  }
  console.log(`${checks} comprobaciones HTTP correctas: CRUD, desactivación/reactivación, empleado → odontólogo, especialidades, consultorios y estados de Agenda.`);
} finally {
  // Sólo los registros creados por esta ejecución. No se eliminan turnos ni historias clínicas.
  if(turn)await request('Turnos/'+turn.idTurno,'DELETE',undefined,204);
  if(doctor)await request('Odontologos/'+doctor.idOdontologo,'DELETE',undefined,204);
  if(employee)await request('Empleados/'+employee.idEmpleado,'DELETE',undefined,204);
  if(patient)await request('Pacientes/'+patient.idPaciente,'DELETE',undefined,204);
  if(association)await request('odontologoespecialidades/'+association.idOdontologoEspecialidad,'DELETE',undefined,204);
  if(specialty)await request('especialidades/'+specialty.idEspecialidad,'DELETE',undefined,204);
  if(room)await request('consultorios/'+room.idConsultorio,'DELETE',undefined,204);
  console.log(JSON.stringify({paciente:patient?.idPaciente,empleado:employee?.idEmpleado,odontologo:doctor?.idOdontologo,turnoCancelado:turn?.idTurno,marca:stamp}));
}
