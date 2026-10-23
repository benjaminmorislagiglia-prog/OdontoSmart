import assert from 'node:assert/strict';

const origin = process.env.ODONTOSMART_API_URL;
if (!origin || !['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw Error('Configurá ODONTOSMART_API_URL con una API local de desarrollo.');
if (!process.argv.includes('--allow-write'))
  throw Error('La prueba crea turnos conservando su historial. Usar --allow-write en una base de desarrollo.');
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
const states = await request('estadosturno');
const state = name => {
  const matches = states.filter(s => s.nombre === name);
  assert.equal(matches.length, 1, 'Debe existir un solo estado ' + name);
  return matches[0];
};
const absent = state('Ausente');
const confirmed = state('Confirmado');
const attended = state('Atendido');
const cancelled = state('Cancelado');
const pending = state('Pendiente');
assert.notEqual(absent.idEstadoTurno, cancelled.idEstadoTurno);
const originalTurns = await request('Turnos');
const patients = await request('Pacientes');
const dentists = await request('odontologos');
const rooms = await request('consultorios');
assert.ok(patients.length && dentists.length && rooms.length, 'Faltan catálogos de desarrollo.');
const day = new Date(new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Argentina/Buenos_Aires'}).format(new Date()) + 'T12:00:00Z');
do { day.setUTCDate(day.getUTCDate() - 1); } while ([0, 6].includes(day.getUTCDay()));
const date = day.toISOString().slice(0, 10);
const slots = Array.from({length: 8}, (_, index) => `${13 + Math.floor(index / 2)}:${index % 2 ? '30' : '00'}:00`)
  .filter(time => !originalTurns.some(t => t.fecha === date && t.hora === time && t.estado !== 'Cancelado' &&
    (t.idOdontologo === dentists[0].idOdontologo || t.idConsultorio === rooms[0].idConsultorio || t.idPaciente === patients[0].idPaciente)));
assert.ok(slots.length >= 3, 'No hay tres horarios libres en la tarde del día de prueba.');
const payload = time => ({fecha: date, hora: time, idPaciente: patients[0].idPaciente,
  idOdontologo: dentists[0].idOdontologo, idConsultorio: rooms[0].idConsultorio});
const change = (turn, status) => request('historialestadoturno', 'POST', {idTurno: turn.idTurno, idEstadoTurno: status.idEstadoTurno}, 201);
const history = turn => request('historialestadoturno/turno/' + turn.idTurno);

const turn = await request('Turnos', 'POST', payload(slots[0]), 201);
assert.equal(turn.idEstadoTurno, pending.idEstadoTurno);
await change(turn, confirmed);
const before = await history(turn);
const transition = await change(turn, absent);
const after = await history(turn);
assert.deepEqual(after.slice(0, before.length), before);
assert.equal(after.length, before.length + 1);
assert.equal(after.at(-1).idHistorialEstadoTurno, transition.idHistorialEstadoTurno);
assert.equal(after.at(-1).idEstadoTurno, absent.idEstadoTurno);
assert.ok(Number.isFinite(Date.parse(after.at(-1).fechaHora)));
assert.ok(Math.abs(Date.parse(after.at(-1).fechaHora) - Date.parse(transition.fechaHora)) < 1000);
const persisted = await request('Turnos/' + turn.idTurno);
assert.equal(persisted.estado, 'Ausente');
assert.equal(persisted.idPaciente, turn.idPaciente);
assert.equal(persisted.idConsultorio, turn.idConsultorio);
await request('historialestadoturno', 'POST', {idTurno: turn.idTurno, idEstadoTurno: absent.idEstadoTurno}, 409);
// Ausente conserva la reserva; Cancelado es el único estado que libera el horario.
await request('Turnos', 'POST', payload(slots[0]), 409);
const other = await request('Turnos', 'POST', payload(slots[1]), 201);
await change(other, confirmed);
await change(other, attended);
assert.equal((await request('Turnos/' + other.idTurno)).estado, 'Atendido');
await request('Turnos/' + other.idTurno, 'DELETE', undefined, 409);
assert.equal((await request('Turnos/' + other.idTurno)).estado, 'Atendido');
assert.deepEqual((await history(other)).map(h => h.idEstadoTurno), [pending.idEstadoTurno, confirmed.idEstadoTurno, attended.idEstadoTurno]);
await request('Turnos', 'POST', payload(slots[1]), 409);
const replacement = await request('Turnos', 'POST', payload(slots[2]), 201);
await request('Turnos/' + replacement.idTurno, 'DELETE', undefined, 204);
const all = await request('Turnos');
assert.ok(all.some(t => t.idTurno === turn.idTurno && t.estado === 'Ausente'));
for (const previous of originalTurns) assert.ok(all.some(t => t.idTurno === previous.idTurno));
assert.deepEqual(await request('estadosturno'), states);
console.log(`${checks} comprobaciones HTTP correctas: Ausente persistente, historial conservado y regresión de estados existentes.`);
console.log(JSON.stringify({turnoAusente: turn.idTurno, fecha: date, hora: slots[0], paciente: persisted.paciente}));
