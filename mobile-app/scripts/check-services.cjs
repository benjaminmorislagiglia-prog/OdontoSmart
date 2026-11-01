/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const reactQuery = require('@tanstack/react-query');
const stored = new Map();
let storageFails = false;
const storage = {
  getItem: async key => { if (storageFails) throw new Error('Storage unavailable'); return stored.get(key) || null; },
  setItem: async (key, value) => { stored.set(key, value); },
  removeItem: async key => { stored.delete(key); },
};
let permission = { granted: true, canAskAgain: true };
let picked = { canceled: true, assets: null };
const image = { uri: 'file:///foto.jpg', fileName: 'foto.jpg', mimeType: 'image/jpeg', width: 512, height: 512, fileSize: 1024 };
const picker = {
  requestCameraPermissionsAsync: async () => permission,
  requestMediaLibraryPermissionsAsync: async () => permission,
  launchCameraAsync: async () => picked,
  launchImageLibraryAsync: async () => picked,
};
const platform = { OS: 'android' };
const cache = new Map();
let client;
// Se ejecutan los servicios reales con transporte y permisos controlados, sin tocar la BD.
function load(relative, parent = path.join(__dirname, '..')) {
  const filename = path.resolve(parent, relative + (path.extname(relative) ? '' : '.js'));
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', source)(name => {
    if (name === '@react-native-async-storage/async-storage') return storage;
    if (name === 'react-native') return { Platform: platform };
    if (name === 'expo-image-picker') return picker;
    if (name === '@tanstack/react-query') return {
      ...reactQuery, useQuery: options => options, useMutation: options => options, useQueryClient: () => client,
    };
    return name.startsWith('.') ? load(name, path.dirname(filename)) : require(name);
  }, module, module.exports);
  return module.exports;
}

async function main() {
  const { authService: auth } = load('src/services/authService');
  assert.equal(await auth.restore(), null);
  await assert.rejects(auth.login('', ''));
  await assert.rejects(auth.login('admin', 'wrong'));
  await auth.login('admin', '1234');
  assert.deepEqual(await auth.restore(), { username: 'admin' });
  assert.ok([...stored.values()].every(value => !value.includes('1234')));
  await auth.logout();
  stored.set('odontosmart.mobile-session', '{broken');
  assert.equal(await auth.restore(), null);
  const { useSessionStore: session } = load('src/stores/sessionStore');
  await session.getState().restore();
  assert.equal(session.getState().restoring, false);
  storageFails = true;
  await session.getState().restore();
  assert.ok(session.getState().restoreError);
  storageFails = false;
  await session.getState().login('admin', '1234');
  assert.equal(session.getState().user.username, 'admin');
  assert.ok(!('patients' in session.getState()) && !('appointments' in session.getState()));
  await session.getState().logout();
  assert.equal(session.getState().user, null);

  const { dateKey, shiftDay, timeKey, calculateAge } = load('src/utils/dates');
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDay('2024-03-01', -1), '2024-02-29');
  assert.equal(timeKey(new Date(2026, 10, 2, 8, 5, 48)), '08:05:00');
  assert.equal(calculateAge('2000-11-01', new Date(2026, 10, 1)), 26);
  assert.equal(calculateAge('2000-11-02', new Date(2026, 10, 1)), 25);
  assert.equal(calculateAge('2026-11-01', new Date(2026, 10, 1, 10)), 0);
  assert.equal(calculateAge('2027-01-01', new Date(2026, 10, 1)), null);
  assert.equal(calculateAge('2001-02-29'), null);
  assert.equal(calculateAge(null), null);
  const api = load('src/services/api');
  const { patientService: patients } = load('src/services/patientService');
  const { appointmentService: agenda, availableTransitions } = load('src/services/appointmentService');
  const { clinicalHistoryService: history } = load('src/services/clinicalHistoryService');
  const { validatePhoto, pickPatientPhoto } = load('src/services/photoService');
  const patient = { idPaciente: 9, nombre: 'Paciente', apellido: 'Prueba', dni: '21000000', activo: true,
    telefono: '3511234567', correo: null, fechaNacimiento: '2000-01-01', idObraSocial: null, idDireccion: 1, fotoUrl: null };
  const states = [{ idEstadoTurno: 11, nombre: 'Confirmado' }, { idEstadoTurno: 19, nombre: 'Cancelado' },
    { idEstadoTurno: 28, nombre: 'Atendido' }, { idEstadoTurno: 31, nombre: 'Ausente' }];
  let turn = { idTurno: 7, fecha: dateKey(), hora: '09:30:00', idPaciente: 9, paciente: 'Paciente Prueba',
    odontologo: 'Profesional Prueba', consultorio: 'Consultorio 1', idEstadoTurno: 5, estado: 'Pendiente', estadosPermitidos: [11, 19] };
  const changes = [];
  const newAppointments = [];
  const dentists = [
    { idOdontologo: 102, idEmpleado: 4, activo: true, diaAtencion: 'Lunes a viernes', horarioAtencion: '08:00 a 17:00', nroMatricula: 'MP1234' },
    { idOdontologo: 103, idEmpleado: 5, activo: false },
    { idOdontologo: 104, idEmpleado: 6, activo: true },
  ];
  const employees = [{ idEmpleado: 4, nombre: 'Profesional', apellido: 'Prueba', activo: true },
    { idEmpleado: 5, nombre: 'Otro', apellido: 'Profesional', activo: true }, { idEmpleado: 6, activo: false }];
  const rooms = [{ idConsultorio: 3, nombre: 'Consultorio 3' }];
  const calls = [];
  let responder;
  const originalFetch = global.fetch;
  const originalFormData = global.FormData;
  const response = (data, status = 200) => new Response(typeof data === 'string' ? data : JSON.stringify(data), { status });
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (responder) return responder(url, options);
    const pathname = new URL(url).pathname;
    if (pathname === '/api/Pacientes') return response(new URL(url).searchParams.get('activo') === 'false' ? [] : [patient]);
    if (pathname === '/api/Pacientes/9/foto') {
      assert.equal(options.method, 'PUT');
      assert.ok(!options.headers['Content-Type']);
      assert.equal(options.body.fields.Archivo.name, 'foto-paciente.jpg');
      assert.equal(options.body.fields.Archivo.type, 'image/jpeg');
      patient.fotoUrl = '/api/fotos-perfil/123.webp';
      return response(patient);
    }
    if (pathname === '/api/Pacientes/9') return response(patient);
    if (pathname === '/api/Odontologos' || pathname === '/api/Empleados') {
      assert.equal(new URL(url).searchParams.get('activo'), 'true');
      return response(pathname === '/api/Odontologos' ? dentists : employees);
    }
    if (pathname === '/api/consultorios') return response(rooms);
    if (pathname === '/api/Turnos' && options.method === 'POST') {
      const body = JSON.parse(options.body);
      assert.deepEqual(Object.keys(body).sort(), ['fecha', 'hora', 'idConsultorio', 'idOdontologo', 'idPaciente']);
      assert.equal(body.idPaciente, 9);
      assert.equal(body.idOdontologo, 102);
      assert.equal(body.idConsultorio, 3);
      assert.match(body.fecha, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(body.hora, '14:15:00');
      const created = { ...turn, idTurno: 8, estado: 'Pendiente', idEstadoTurno: 5, estadosPermitidos: [11, 19], fecha: body.fecha, hora: body.hora, consultorio: 'Consultorio 3' };
      newAppointments.push(created);
      return response(created, 201);
    }
    if (pathname === '/api/Turnos') return response([turn, ...newAppointments]);
    if (pathname === '/api/Turnos/7') return response(turn);
    if (pathname === '/api/Turnos/8') return response(newAppointments[0]);
    if (pathname === '/api/estadosturno') return response(states);
    if (pathname === '/api/obrasociales' || pathname === '/api/direcciones' || pathname === '/api/localidades') return response([]);
    if (pathname === '/api/HistorialClinico/paciente/9') return response([{ idHistorialClinico: 3, idTurno: 7, idPaciente: 9, diagnostico: 'Control', tratamientosRealizados: 'Evaluación', anulado: false }]);
    if (pathname === '/api/historialestadoturno') {
      assert.equal(options.method, 'POST');
      assert.equal(options.headers['Content-Type'], 'application/json');
      const body = JSON.parse(options.body);
      assert.deepEqual(Object.keys(body).sort(), ['idEstadoTurno', 'idTurno']);
      assert.equal(body.idTurno, 7);
      if (!turn.estadosPermitidos.includes(body.idEstadoTurno)) return response('El turno no admite ese estado.', 409);
      const next = states.find(state => state.idEstadoTurno === body.idEstadoTurno);
      changes.push({ ...body, fechaHora: new Date().toISOString() });
      turn = { ...turn, estado: next.nombre, idEstadoTurno: next.idEstadoTurno, estadosPermitidos: next.nombre === 'Confirmado' ? [19, 28, 31] : [] };
      return response(changes.at(-1), 201);
    }
    return response('No encontrado.', 404);
  };
  try {
    api.apiConfig.baseURL = '';
    await assert.rejects(patients.list(), /EXPO_PUBLIC_API_URL/);
    api.apiConfig.baseURL = 'http://localhost:5122';
    const beforeConfig = calls.length;
    await assert.rejects(patients.list(), /localhost apunta/);
    assert.equal(calls.length, beforeConfig);
    api.apiConfig.baseURL = 'https://clinica.example.test';
    const list = await patients.list();
    assert.equal(list[0].id, '9');
    assert.equal(list[0].name, 'Paciente Prueba');
    assert.equal(list[0].photoPath, null);
    assert.deepEqual(await patients.list(false), []);
    assert.equal((await patients.getById(9)).dni, patient.dni);
    assert.equal(new URL(calls.at(-1).url).searchParams.get('incluirInactivos'), 'true');
    assert.equal((await history.listByPatient(9))[0].appointmentId, '7');
    assert.deepEqual(await patients.catalogs(), { coverages: [], addresses: [], localities: [] });
    assert.equal((await agenda.listToday()).length, 1);
    assert.equal((await agenda.listByDate(shiftDay(dateKey(), 1))).length, 0);
    assert.equal((await agenda.listByPatient(9))[0].time, '09:30');
    const catalog = await agenda.states();
    assert.deepEqual(availableTransitions(await agenda.getById(7), catalog).map(state => state.name), ['Confirmado', 'Cancelado']);
    await assert.rejects(agenda.updateStatus(7, 31), /no admite/);

    client = load('src/query/queryClient').queryClient;
    const queries = load('src/hooks/useClinicQueries');
    const appointmentsQuery = queries.useAppointments();
    const detailQuery = queries.useAppointment('7');
    const listObserver = new reactQuery.QueryObserver(client, appointmentsQuery);
    const detailObserver = new reactQuery.QueryObserver(client, detailQuery);
    const unsubscribeList = listObserver.subscribe(() => {});
    const unsubscribeDetail = detailObserver.subscribe(() => {});
    await client.fetchQuery(appointmentsQuery);
    await client.fetchQuery(detailQuery);
    const update = new reactQuery.MutationObserver(client, queries.useUpdateAppointmentStatus());
    await update.mutate({ id: '7', stateId: 11 });
    assert.equal(client.getQueryData(detailQuery.queryKey).status, 'Confirmado');
    assert.equal(client.getQueryData(appointmentsQuery.queryKey)[0].status, 'Confirmado');
    assert.ok(availableTransitions(await agenda.getById(7), catalog).some(state => state.name === 'Ausente'));
    await update.mutate({ id: '7', stateId: 31 });
    assert.equal((await agenda.getById(7)).status, 'Ausente');
    assert.deepEqual(availableTransitions(await agenda.getById(7), catalog), []);
    assert.equal((await agenda.listByPatient(9)).length, 1);
    assert.equal(client.getQueryData(appointmentsQuery.queryKey)[0].status, 'Ausente');
    await assert.rejects(update.mutate({ id: '7', stateId: 19 }), /no admite/);
    assert.equal(changes.length, 2);
    assert.ok(changes.every(change => change.fechaHora));
    for (const name of ['Atendido', 'Cancelado', 'Ausente']) assert.deepEqual(availableTransitions({ status: name, allowedStateIds: [] }, catalog), []);
    unsubscribeList(); unsubscribeDetail();

    const booking = await agenda.bookingCatalogs();
    assert.equal(booking.dentists.length, 1);
    assert.equal(booking.dentists[0].label, 'Profesional Prueba');
    assert.match(booking.dentists[0].description, /08:00 a 17:00/);
    assert.deepEqual(booking.rooms, [{ id: '3', label: 'Consultorio 3' }]);
    const values = { patientId: '9', dentistId: '102', roomId: '3', date: shiftDay(dateKey(), 2), time: '14:15:00' };
    const beforeValidation = calls.length;
    for (const key of Object.keys(values)) await assert.rejects(agenda.create({ ...values, [key]: '' }), /Seleccioná/);
    assert.equal(calls.length, beforeValidation);
    const unsubscribeAgenda = listObserver.subscribe(() => {});
    const create = new reactQuery.MutationObserver(client, queries.useCreateAppointment());
    const created = await create.mutate(values);
    assert.equal(created.patientId, '9');
    assert.equal(created.status, 'Pendiente');
    assert.equal(client.getQueryData(queries.clinicKeys.appointment('8')).id, '8');
    assert.ok(client.getQueryData(appointmentsQuery.queryKey).some(item => item.id === '8'));
    assert.equal((await agenda.getById('8')).date, values.date);
    assert.equal((await history.listByPatient('9')).length, 1);
    const countBeforeRejection = client.getQueryData(appointmentsQuery.queryKey).length;
    responder = () => response('El odontólogo ya tiene un turno en esa fecha y hora.', 409);
    await assert.rejects(create.mutate(values), error => error.status === 409 && /odontólogo ya tiene/.test(error.message));
    assert.equal(client.getQueryData(appointmentsQuery.queryKey).length, countBeforeRejection);
    responder = undefined;
    unsubscribeAgenda();

    assert.equal(await pickPatientPhoto('gallery'), null);
    assert.equal(await pickPatientPhoto('camera'), null);
    permission = { granted: false, canAskAgain: true };
    await assert.rejects(pickPatientPhoto('camera'), /permiso/);
    permission = { granted: false, canAskAgain: false };
    await assert.rejects(pickPatientPhoto('gallery'), /configuración/);
    permission = { granted: true, canAskAgain: true };
    picked = { canceled: false, assets: [image] };
    assert.equal((await pickPatientPhoto('camera')).mimeType, 'image/jpeg');
    assert.equal((await pickPatientPhoto('gallery')).fileName, 'foto-paciente.jpg');
    assert.throws(() => validatePhoto({ ...image, mimeType: 'image/heic' }), /JPG/);
    assert.throws(() => validatePhoto({ ...image, fileSize: 6 * 1024 * 1024 }), /5 MB/);
    assert.throws(() => validatePhoto({ ...image, width: 5000 }), /4096/);
    assert.throws(() => validatePhoto({}), /leer/);
    global.FormData = class { fields = {}; append(key, value) { this.fields[key] = value; } };
    const upload = new reactQuery.MutationObserver(client, queries.useUploadPatientPhoto());
    const patientsQuery = queries.usePatients();
    await client.fetchQuery(patientsQuery);
    await upload.mutate({ id: '9', asset: image });
    assert.equal(client.getQueryData(queries.clinicKeys.patient('9')).photoPath, patient.fotoUrl);
    assert.equal(client.getQueryState(patientsQuery.queryKey).isInvalidated, true);
    assert.equal(api.resolvePhotoURL(patient.fotoUrl), 'https://clinica.example.test/api/fotos-perfil/123.webp');

    responder = () => response('No se puede marcar como ausente un turno que todavía no ocurrió.', 409);
    await assert.rejects(agenda.updateStatus(7, 31), error => error.status === 409 && /todavía no ocurrió/.test(error.message));
    responder = () => response({ errors: { Dni: ['El DNI solo admite números.'] } }, 400);
    await assert.rejects(patients.list(), /DNI solo/);
    responder = () => response('<html>Error</html>');
    await assert.rejects(patients.list(), /formato inesperado/);
    responder = () => response({ mensaje: 'No se pudo acceder a la base de datos.' }, 503);
    const beforeRetry = calls.length;
    await assert.rejects(client.fetchQuery({ queryKey: ['check-error'], queryFn: () => patients.list(), retryDelay: 0 }), /base de datos/);
    assert.equal(calls.length - beforeRetry, 2);
    responder = () => { throw new TypeError('Network failed'); };
    await assert.rejects(patients.list(), /conectar con la API/);
    responder = () => response([]);
    assert.deepEqual(await patients.list(), []);
    assert.deepEqual(await agenda.list(), []);
    assert.deepEqual(await history.listByPatient('9'), []);
    const originalTimer = global.setTimeout;
    global.setTimeout = (fn, ms, ...args) => originalTimer(fn, ms === 15000 ? 1 : ms, ...args);
    responder = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Aborted'))));
    try { await assert.rejects(patients.list(), error => error.kind === 'timeout'); }
    finally { global.setTimeout = originalTimer; }
  } finally {
    global.fetch = originalFetch;
    global.FormData = originalFormData;
    client?.clear();
  }
  const { notificationService: notices } = load('src/services/notificationService');
  const unread = (await notices.list()).filter(item => !item.read).length;
  await notices.markRead('n1');
  assert.equal((await notices.list()).filter(item => !item.read).length, unread - 1);
  await assert.rejects(notices.markRead('missing'));
  console.log('OK: sesión, edad y fechas, pacientes, catálogos de reserva, creación de turnos, payload real, caché e invalidación, estados e historial, errores, listas vacías, permisos y fotos (pruebas controladas; sin modificar la BD).');
}
module.exports = { load };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
