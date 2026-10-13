/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
const stored = new Map();
const storage = {
  getItem: async key => stored.get(key) || null,
  setItem: async (key, value) => { stored.set(key, value); },
  removeItem: async key => { stored.delete(key); },
};
// Compile the actual JavaScript services for Node; no native runtime or network.
function load(relative, parent = path.join(__dirname, '..')) {
  const filename = path.resolve(parent, relative + (path.extname(relative) ? '' : '.js'));
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', source)(
    name => name === '@react-native-async-storage/async-storage' ? storage : load(name, path.dirname(filename)), module, module.exports,
  );
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
  assert.equal(await auth.restore(), null);
  stored.set('odontosmart.mobile-session', '{broken');
  assert.equal(await auth.restore(), null);
  const { appointmentService: agenda } = load('src/services/appointmentService');
  const { patientService: patients } = load('src/services/patientService');
  const { notificationService: notices } = load('src/services/notificationService');
  const { clinicalHistoryService: history } = load('src/services/clinicalHistoryService');
  const { dateKey, shiftDay } = load('src/utils/dates');
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDay('2024-03-01', -1), '2024-02-29');
  assert.equal((await agenda.listToday()).length, 4);
  assert.equal((await agenda.listByDate(shiftDay(dateKey(), 1))).length, 1);
  const before = await agenda.getById('a3');
  assert.equal((await agenda.updateStatus('a3', 'Confirmado')).status, 'Confirmado');
  assert.equal(before.status, 'Pendiente');
  assert.equal((await agenda.listToday()).find(a => a.id === 'a3').status, 'Confirmado');
  assert.equal((await agenda.updateStatus('a3', 'Atendido')).status, 'Atendido');
  await assert.rejects(agenda.updateStatus('a3', 'Cancelado'));
  assert.equal((await agenda.updateStatus('a5', 'Cancelado')).status, 'Cancelado');
  assert.equal((await agenda.listByPatient('p2')).find(a => a.id === 'a5').status, 'Cancelado');
  assert.equal(await agenda.getById('missing'), null);
  await assert.rejects(agenda.updateStatus('missing', 'Confirmado'));
  const patient = await patients.getById('p1');
  patient.name = 'Changed';
  assert.notEqual((await patients.getById('p1')).name, 'Changed');
  assert.equal(await patients.getById('missing'), null);
  const records = await history.listByPatient('p1');
  assert.equal(records.length, 2);
  assert.ok(records[0].date > records[1].date);
  assert.deepEqual(await history.listByPatient('p2'), []);
  const unread = (await notices.list()).filter(n => !n.read).length;
  await notices.markRead('n1');
  assert.equal((await notices.list()).filter(n => !n.read).length, unread - 1);
  await notices.markRead('n1');
  assert.equal((await notices.list()).filter(n => !n.read).length, unread - 1);
  await assert.rejects(notices.markRead('missing'));
  console.log('Servicios locales: login/logout, fechas, filtros, transiciones, copias, historia y avisos OK.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
