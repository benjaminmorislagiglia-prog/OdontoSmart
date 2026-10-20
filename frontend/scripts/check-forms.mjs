import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { validateFields, validDate, todayKey } from '../src/utils/formValidation.js';
import { emptyPaciente, validatePaciente } from '../src/utils/pacienteForm.js';

const server=await createServer({configFile:false,server:{middlewareMode:true},define:{'import.meta.env.VITE_API_URL':JSON.stringify('https://contract.invalid')}});
try {
const { clinicPages }=await server.ssrLoadModule('/src/config/clinicPages.js');

const refs={puestos:[{idPuesto:1}],direcciones:[{idDireccion:1}],localidades:[{idLocalidad:1}],
 empleados:[{idEmpleado:1,activo:true}],odontologos:[],pacientes:[{idPaciente:1,activo:true}],turnos:[{idTurno:1,idPaciente:1}],especialidades:[{idEspecialidad:1}]};
const forms={
 empleados:{dni:'0012345678',nombre:'María-José',apellido:'D’Ángelo',telefono:'+54 (351) 123-4567',correo:'prueba@example.com',idPuesto:'1',idDireccion:''},
 odontologos:{idEmpleado:'1',nroMatricula:'MP-123/4',diaAtencion:'Lunes a viernes',horarioAtencion:'09:00 a 17:00'},
 direcciones:{calle:'9 de Julio',numero:'123',barrio:'Centro',cp:'X5000ABC',idLocalidad:'1'},
 especialidades:{nombre:'Odontología general'},
 estados:{nombre:'Pendiente'},asociaciones:{idOdontologo:'1',idEspecialidad:'1'},
 historias:{idPaciente:'1',idTurno:'1',diagnostico:'Caries en pieza 16.',tratamientosRealizados:'Resina A2',observaciones:''},
};
let checks=0;
function valid(resource,values,source=refs){assert.deepEqual(validateFields(clinicPages[resource].fields,values,source),{},resource);checks++;}
function invalid(resource,key,value){assert.ok(validateFields(clinicPages[resource].fields,{...forms[resource],[key]:value},refs)[key],resource+': '+key+'='+value);checks++;}
for(const resource of Object.keys(forms).filter(key=>key!=='asociaciones'))valid(resource,forms[resource]);
valid('asociaciones',forms.asociaciones,{...refs,odontologos:[{idOdontologo:1,idEmpleado:1,activo:true}]});
for(const value of ['12a34','12.345','1e5','-123','１２３'])invalid('empleados','dni',value);
for(const value of ['Ana2','123','<script>'])invalid('empleados','nombre',value);
for(const value of ['abc','+','---','123ext456'])invalid('empleados','telefono',value);
for(const value of ['1.5','-1','0','1e3','abc','2147483648'])invalid('direcciones','numero',value);
for(const value of ['ABCD','5000!','50','5000 ABC'])invalid('direcciones','cp',value);
for(const value of ['25:00-17:00','09:90-17:00','mañana','9'])invalid('odontologos','horarioAtencion',value);
invalid('odontologos','diaAtencion','123');invalid('odontologos','nroMatricula','@@@');
invalid('empleados','correo','abc');invalid('empleados','idPuesto','1.5');invalid('empleados','idPuesto','2');
invalid('especialidades','nombre','  ');
valid('empleados',{...forms.empleados,nombre:'Jose\u0301',apellido:"O'Connor",telefono:'',correo:''});
valid('direcciones',{...forms.direcciones,cp:'5000',numero:'2147483647'});
valid('odontologos',{...forms.odontologos,horarioAtencion:'09:00-17:00'});
assert.ok(validateFields(clinicPages.odontologos.fields,forms.odontologos,{...refs,odontologos:[{idOdontologo:2,idEmpleado:1}]}).idEmpleado);checks++;
valid('odontologos',forms.odontologos,refs);
const patient={...emptyPaciente,dni:'0012345678',nombre:'Ana',apellido:'Pérez',fechaNacimiento:'1990-05-10',idDireccion:'1'};
assert.deepEqual(validatePaciente(patient),{});checks++;
for(const [key,value] of [['dni','123abc'],['nombre','Ana2'],['apellido','123'],['telefono','llamar'],['fechaNacimiento','2025-02-29'],['fechaNacimiento','0000-01-01'],['fechaNacimiento','9999-01-01'],['idDireccion','1e2'],['idDireccion','1.5']]){
 assert.ok(validatePaciente({...patient,[key]:value})[key],key+'='+value);checks++;
}
assert.equal(validDate('2024-02-29'),true);assert.deepEqual(validatePaciente({...patient,fechaNacimiento:todayKey()}),{});checks+=2;
console.log(`${checks} verificaciones de formularios: DNI, nombres, teléfonos, correo, enteros, códigos postales, matrículas, horarios, fechas, referencias y texto clínico: OK.`);
} finally {await server.close();}
