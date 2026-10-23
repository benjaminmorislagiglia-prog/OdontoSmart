import assert from 'node:assert/strict';

const origin = process.env.ODONTOSMART_API_URL;
if (!origin || !['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw Error('Configurá ODONTOSMART_API_URL con una API local de desarrollo.');
if (!process.argv.includes('--allow-write'))
  throw Error('Usar --allow-write: crea seis turnos de prueba y conserva su historial.');

let checks = 0;
async function request(route, method = 'GET', body, expected = 200) {
  const response = await fetch(origin.replace(/\/+$/, '') + '/api/' + route, {
    method, headers: {'Content-Type': 'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  assert.equal(response.status, expected, `${method} ${route}: ${text.slice(0, 300)}`);
  checks++;
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

const states = await request('estadosturno');
const names = ['Pendiente', 'Confirmado', 'Atendido', 'Cancelado', 'Ausente'];
const byName = Object.fromEntries(names.map(name => {
  const matches = states.filter(s => s.nombre === name);
  assert.equal(matches.length, 1, 'Debe existir un único estado ' + name);
  return [name, matches[0].idEstadoTurno];
}));
const allowed = {Pendiente: ['Confirmado', 'Cancelado'], Confirmado: ['Atendido', 'Cancelado', 'Ausente']};
const originals = await request('Turnos');
const originalHistory = await request('historialestadoturno');
const patients = await request('Pacientes');
const dentists = await request('Odontologos');
const rooms = await request('consultorios');
assert.ok(patients.length && dentists.length && rooms.length, 'Faltan catálogos activos para la prueba.');
// Mismo reloj civil que la instalación local verificada; no convierte los turnos a UTC.
const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Argentina/Buenos_Aires'}).format(new Date());
const past = new Date(today + 'T12:00:00Z');
past.setUTCDate(past.getUTCDate() - 1);
const future = new Date(past);
future.setUTCDate(future.getUTCDate() + 3);
const date = past.toISOString().slice(0, 10);
const futureDate = future.toISOString().slice(0, 10);
const freeSlots = day => Array.from({length:48}, (_, index) => `${String(Math.floor(index/2)).padStart(2,'0')}:${index%2?'30':'00'}:00`)
  .filter(time => !originals.some(t => t.fecha === day && t.hora === time &&
    (t.idOdontologo === dentists[0].idOdontologo || t.idConsultorio === rooms[0].idConsultorio)));
const slots = freeSlots(date);
const futureSlots = freeSlots(futureDate);
assert.ok(slots.length >= 5 && futureSlots.length, 'No hay horarios libres para la prueba.');
const created = [];
async function create(day, time) {
  const turn = await request('Turnos', 'POST', {fecha:day, hora:time,
    idPaciente:patients[0].idPaciente, idOdontologo:dentists[0].idOdontologo, idConsultorio:rooms[0].idConsultorio}, 201);
  created.push(turn.idTurno);
  assert.equal(turn.estado, 'Pendiente');
  return turn;
}
const getTurn = turn => request('Turnos/' + turn.idTurno);
const history = turn => request('historialestadoturno/turno/' + turn.idTurno);
const change = (turn, name, expected=201) => request('historialestadoturno', 'POST',
  {idTurno:turn.idTurno, idEstadoTurno:byName[name]}, expected);
async function valid(turn, target) {
  const before = await history(turn);
  const record = await change(turn, target);
  const after = await history(turn);
  assert.equal(after.length, before.length + 1);
  assert.deepEqual(after.slice(0, -1), before);
  assert.equal(after.at(-1).idHistorialEstadoTurno, record.idHistorialEstadoTurno);
  assert.equal(record.idEstadoTurno, byName[target]);
  assert.ok(Number.isFinite(Date.parse(record.fechaHora)));
  assert.equal((await getTurn(turn)).estado, target);
}
async function blocked(turn, target, method='POST') {
  const beforeTurn = await getTurn(turn);
  const beforeHistory = await history(turn);
  const message = method === 'DELETE'
    ? await request('Turnos/'+turn.idTurno, 'DELETE', undefined, 409)
    : await change(turn, target, 409);
  assert.equal(typeof message, 'string');
  assert.ok(message.length > 0);
  assert.deepEqual(await getTurn(turn), beforeTurn, 'El rechazo no debe modificar el turno.');
  assert.deepEqual(await history(turn), beforeHistory, 'El rechazo no debe agregar ni alterar historial.');
  return message;
}

for (const [index, [source, target]] of [
  ['Pendiente','Confirmado'], ['Pendiente','Cancelado'],
  ['Confirmado','Atendido'], ['Confirmado','Cancelado'], ['Confirmado','Ausente'],
].entries()) {
  const turn = await create(date, slots[index]);
  if (source === 'Confirmado') await valid(turn, source);
  const current = await getTurn(turn);
  assert.deepEqual(current.estadosPermitidos.toSorted((a,b)=>a-b), allowed[source].map(n=>byName[n]).toSorted((a,b)=>a-b));
  // Incluye misma asignación y las transiciones inválidas de ambos estados iniciales.
  for (const invalid of names.filter(n => !allowed[source].includes(n))) {
    const message = await blocked(turn, invalid);
    if (source === 'Pendiente' && invalid === 'Ausente') assert.match(message, /Pendiente directamente a Ausente.*Confirmado/);
  }
  await valid(turn, target);
  if (target === 'Confirmado') {
    await blocked(turn, 'Pendiente');
    await blocked(turn, 'Confirmado');
    await request('Turnos/'+turn.idTurno, 'DELETE', undefined, 204);
    assert.equal((await getTurn(turn)).estado, 'Cancelado');
  }
  const final = await getTurn(turn);
  assert.deepEqual(final.estadosPermitidos, []);
  for (const invalid of names) await blocked(turn, invalid);
  if (final.estado !== 'Cancelado') await blocked(turn, 'Cancelado', 'DELETE');
  else {
    const before = await history(turn);
    await request('Turnos/'+turn.idTurno, 'DELETE', undefined, 204);
    assert.deepEqual(await history(turn), before, 'Cancelar nuevamente no duplica el historial.');
  }
}

const upcoming = await create(futureDate, futureSlots[0]);
assert.deepEqual(upcoming.estadosPermitidos.toSorted((a,b)=>a-b), ['Confirmado','Cancelado'].map(n=>byName[n]).toSorted((a,b)=>a-b));
assert.match(await blocked(upcoming, 'Ausente'), /Pendiente directamente a Ausente.*Confirmado/);
const beforeConcurrent = await history(upcoming);
const responses = await Promise.all([0,1].map(() => fetch(origin.replace(/\/+$/,'')+'/api/historialestadoturno', {
  method:'POST', headers:{'Content-Type':'application/json'},
  body:JSON.stringify({idTurno:upcoming.idTurno,idEstadoTurno:byName.Confirmado}),
})));
assert.deepEqual(responses.map(r=>r.status).toSorted(), [201,409]);
checks += 2;
assert.equal((await history(upcoming)).length, beforeConcurrent.length+1);
assert.match(await blocked(upcoming, 'Ausente'), /todavía no ocurrió/);
await request('Turnos/'+upcoming.idTurno, 'DELETE', undefined, 204);
const afterCancel = await history(upcoming);
assert.equal(afterCancel.at(-1).idEstadoTurno, byName.Cancelado);
await request('Turnos/'+upcoming.idTurno, 'DELETE', undefined, 204);
assert.deepEqual(await history(upcoming), afterCancel);

const all = await request('Turnos');
assert.equal(all.length, originals.length + created.length);
const withoutOptions = ({estadosPermitidos, ...turn}) => turn;
for (const previous of originals)
  assert.deepEqual(withoutOptions(all.find(t=>t.idTurno===previous.idTurno)), withoutOptions(previous));
const allHistory = await request('historialestadoturno');
for (const previous of originalHistory)
  assert.deepEqual(allHistory.find(h=>h.idHistorialEstadoTurno===previous.idHistorialEstadoTurno), previous);
assert.deepEqual(await request('estadosturno'), states);
console.log(`${checks} comprobaciones HTTP correctas con SQL Server: transiciones, finales, duplicados, concurrencia, horario e historial.`);
console.log(JSON.stringify({turnosDePrueba:created, fecha:date, fechaFutura:futureDate}));
