import assert from 'node:assert/strict';

const origin=process.env.ODONTOSMART_API_URL;
if(!origin||!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Configurá ODONTOSMART_API_URL con la API local.');
const base=origin.replace(/\/+$/,'')+'/api/';
const missing=2147483647;
let checks=0;
async function request(route,method='GET',body,expected=200){
 const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await response.text();assert.equal(response.status,expected,method+' '+route+': '+text.slice(0,250));checks++;
 try{return JSON.parse(text);}catch{return text;}
}
const directions=await request('direcciones');assert.ok(directions.length);
const person={dni:'0012345678',nombre:'María-José',apellido:'D’Ángelo',telefono:'+54 (351) 123-4567',correo:'prueba@example.com'};
const bodies={
 Pacientes:{...person,idDireccion:directions[0].idDireccion,idObraSocial:null,fechaNacimiento:'1990-05-10'},
 Empleados:{...person,idPuesto:1,idDireccion:null},
 Odontologos:{idEmpleado:1,nroMatricula:'MP-123/4',diaAtencion:'Lunes a viernes',horarioAtencion:'09:00 a 17:00'},
 direcciones:{calle:'9 de Julio',numero:123,barrio:'Centro',cp:'X5000ABC',idLocalidad:1},
 Turnos:{fecha:'2026-10-20',hora:'09:00:00',idPaciente:1,idOdontologo:1,idConsultorio:1},
};
// Nunca se crean registros: cada PUT apunta a un ID que se comprueba inexistente.
for(const resource of Object.keys(bodies))await request(resource+'/'+missing+'?incluirInactivos=true','GET',undefined,404);
async function invalid(resource,key,value){
 const result=await request(resource+'/'+missing+(resource==='Pacientes'?'?reactivar=true':''),'PUT',{...bodies[resource],[key]:value},400);
 assert.ok(Object.keys(result.errors||{}).some(field=>field.toLowerCase().replace(/^\$\./,'')===key.toLowerCase()),resource+': falta error de '+key);
}
for(const resource of ['Pacientes','Empleados']) {
 for(const value of ['12a34','12.345','1e5','-123',12345])await invalid(resource,'dni',value);
 await invalid(resource,'nombre','Ana2');await invalid(resource,'apellido','123');
 for(const value of ['abc','+','---','123ext456'])await invalid(resource,'telefono',value);
 await invalid(resource,'correo','abc');
}
await invalid('Pacientes','fechaNacimiento','9999-01-01');
await invalid('Pacientes','fechaNacimiento','2025-02-29');
await invalid('Pacientes','idObraSocial',0);
await invalid('Empleados','idDireccion',-1);
await invalid('Empleados','idPuesto',1.5);
for(const value of [0,-1,1.5,'abc','1e2',2147483648])await invalid('direcciones','numero',value);
for(const value of ['ABCD','5000!','5000 ABC'])await invalid('direcciones','cp',value);
for(const value of ['25:00-17:00','09:90-17:00','mañana'])await invalid('Odontologos','horarioAtencion',value);
await invalid('Odontologos','diaAtencion','123');await invalid('Odontologos','nroMatricula','@@@');
await invalid('Turnos','fecha','incorrecta');await invalid('Turnos','hora','25:90');await invalid('Turnos','idPaciente',1.5);
// Los mismos campos con formatos válidos superan el DTO y alcanzan el 404 del controlador.
for(const resource of Object.keys(bodies))await request(resource+'/'+missing,'PUT',bodies[resource],404);
await request('direcciones/'+missing,'PUT',{...bodies.direcciones,cp:'5000'},404);
console.log(`${checks} verificaciones HTTP: la API rechaza tipos/formato inválidos y acepta DNI con ceros, nombres con tildes, teléfono internacional, matrícula alfanumérica y CP numérico/alfanumérico. Sin crear ni modificar registros.`);
