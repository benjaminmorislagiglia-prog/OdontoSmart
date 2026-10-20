import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { AxiosError } from 'axios';
import { emptyPaciente, validatePaciente, pacientePayload } from '../src/utils/pacienteForm.js';

const swagger = JSON.parse(await readFile(new URL('../../docs/api/openapi.json', import.meta.url), 'utf8'));
const server = await createServer({ configFile: false, server: { middlewareMode: true }, define: {
  'import.meta.env.VITE_API_URL': JSON.stringify('https://contract.invalid'),
} });
try {
  const { api, apiErrorMessage } = await server.ssrLoadModule('/src/services/api.js');
  const service = await server.ssrLoadModule('/src/services/pacienteService.js');
  const calls = [];
  let result = [];
  api.defaults.adapter = async config => {
    calls.push(config);
    return { config, status: 200, statusText: 'OK', headers: {}, data: result };
  };
  assert.deepEqual(await service.getPacientes(), []);
  result = { idPaciente: 7, dni: '12345678', nombre: 'Ana', apellido: 'Pérez', activo: true };
  assert.equal((await service.getPacienteById(7)).idPaciente, 7);
  const form = { ...emptyPaciente, dni: '12345678', nombre: ' Ana ', apellido: 'Pérez', fechaNacimiento: '1990-05-04', idDireccion: '9' };
  assert.deepEqual(validatePaciente(form), {});
  const payload = pacientePayload(form);
  assert.equal(payload.nombre, 'Ana');
  assert.equal(payload.idDireccion, 9);
  assert.equal(payload.idObraSocial, null);
  assert.equal(payload.correo, null);
  assert.deepEqual(Object.keys(payload).sort(), Object.keys(swagger.components.schemas.PacienteGuardarDto.properties).sort());
  await service.createPaciente(payload);
  result = '';
  await service.updatePaciente(7, payload);
  result = undefined;
  await service.deletePaciente(7);
  assert.deepEqual(calls.map(c => [c.method, c.url]), [
    ['get', '/api/Pacientes'], ['get', '/api/Pacientes/7'], ['post', '/api/Pacientes'],
    ['put', '/api/Pacientes/7'], ['delete', '/api/Pacientes/7'],
  ]);
  for (const call of calls) {
    const key = call.url.endsWith('/7') ? '/api/Pacientes/{id}' : call.url;
    assert.ok(swagger.paths[key][call.method]);
  }
  assert.deepEqual(JSON.parse(calls[2].data), payload);
  assert.deepEqual(JSON.parse(calls[3].data), payload);
  assert.deepEqual(calls[1].params, {incluirInactivos:true});
  result = [{idPaciente:7, activo:false}];
  assert.equal((await service.getPacientes({activo:false}))[0].activo, false);
  assert.deepEqual(calls.at(-1).params, {activo:false});
  result = undefined;
  await service.reactivatePaciente(7);
  assert.equal(calls.at(-1).method, 'post');
  assert.equal(calls.at(-1).url, '/api/Pacientes/7/reactivar');
  assert.ok(swagger.paths['/api/Pacientes/{id}/reactivar'].post);
  assert.ok(swagger.paths['/api/Pacientes/{id}/reactivar'].post.responses['204']);
  await service.updatePaciente(7,payload,{reactivar:true});
  assert.equal(calls.at(-1).method,'put');
  assert.deepEqual(calls.at(-1).params,{reactivar:true});
  assert.deepEqual(JSON.parse(calls.at(-1).data),payload);
  assert.ok(swagger.paths['/api/Pacientes/{id}'].put.parameters.some(p=>p.name==='reactivar'&&p.in==='query'&&p.schema.default===false));
  await assert.rejects(service.reactivatePaciente('../Empleados'));
  assert.ok(validatePaciente(emptyPaciente).dni);
  assert.ok(validatePaciente({ ...form, idDireccion: '' }).idDireccion);
  assert.ok(validatePaciente({ ...form, idDireccion: '0' }).idDireccion);
  assert.ok(validatePaciente({ ...form, idObraSocial: '1.5' }).idObraSocial);
  assert.ok(validatePaciente({ ...form, fechaNacimiento: '2025-02-29' }).fechaNacimiento);
  assert.ok(validatePaciente({ ...form, correo: 'invalid' }).correo);
  await assert.rejects(service.getPacienteById('../Turnos'));
  result = { unexpected: [] };
  await assert.rejects(service.getPacientes(), /formato inesperado/);
  const response = { status: 400, data: { errors: { dni: ['El DNI ya existe.'] } } };
  api.defaults.adapter = async config => { throw new AxiosError('Bad request', 'ERR_BAD_REQUEST', config, {}, response); };
  await assert.rejects(service.createPaciente(payload), error => apiErrorMessage(error) === 'El DNI ya existe.');
  assert.match(apiErrorMessage({ request: {} }), /CORS/);
  assert.match(apiErrorMessage({ code: 'ECONNABORTED' }), /demasiado/);
  console.log('Contrato de Pacientes, consulta de inactivos, reactivación, payload, validaciones y errores: OK (adaptador controlado, sin API real).');
} finally { await server.close(); }
