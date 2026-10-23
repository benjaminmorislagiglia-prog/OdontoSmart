import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const origin=process.env.ODONTOSMART_API_URL?.replace(/\/+$/,'');
const fixtures=process.env.ODONTOSMART_PHOTO_FIXTURES;
if(!origin||!['localhost','127.0.0.1'].includes(new URL(origin).hostname)||!fixtures||!process.argv.includes('--allow-write'))
 throw Error('Usar API local, ODONTOSMART_PHOTO_FIXTURES y --allow-write. Crea registros propios de prueba.');
let checks=0;
async function request(path,method='GET',body,expected=200) {
 const response=await fetch(origin+'/api/'+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await response.text();assert.equal(response.status,expected,`${method} ${path}: ${text.slice(0,250)}`);checks++;
 if(!text)return null;
 try{return JSON.parse(text);}catch{return text;}
}
async function upload(path,bytes,name,mime,expected=200) {
 const form=new FormData();form.append('archivo',new Blob([bytes],{type:mime}),name);
 const response=await fetch(origin+'/api/'+path+'/foto',{method:'PUT',body:form});
 const text=await response.text();assert.equal(response.status,expected,text.slice(0,250));checks++;
 if(expected===200)return JSON.parse(text);
}
async function photo(url,expected=200) {
 assert.match(url,/^\/api\/fotos-perfil\/[a-f0-9]{32}\.webp$/);
 const response=await fetch(origin+url);assert.equal(response.status,expected);checks++;
 if(expected!==200)return;
 assert.equal(response.headers.get('content-type'),'image/webp');
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 const bytes=Buffer.from(await response.arrayBuffer());
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 assert.ok(!bytes.includes(Buffer.from('QA_METADATA')));
 return bytes;
}
// Comprobar los archivos de prueba antes de crear registros.
const jpeg=await readFile(join(fixtures,'valid.jpg'));
const png=await readFile(join(fixtures,'valid.png'));
const webp=await readFile(join(fixtures,'valid.webp'));
const dimensions=await readFile(join(fixtures,'dimensions.png'));
const directions=await request('direcciones'),jobs=await request('puestos');
assert.ok(directions.length&&jobs.length);
const stamp=String(Date.now());
const patientBody={dni:'91'+stamp,nombre:'Prueba',apellido:'Foto',telefono:'1100000000',correo:null,fechaNacimiento:'1990-05-10',idDireccion:directions[0].idDireccion,idObraSocial:null};
const employeeBody={dni:'92'+stamp,nombre:'Prueba',apellido:'Empleado',telefono:'1100000000',correo:null,idPuesto:jobs[0].idPuesto,idDireccion:directions[0].idDireccion};
const patient=await request('Pacientes','POST',patientBody,201);
const employee=await request('Empleados','POST',employeeBody,201);
assert.equal(patient.fotoUrl,null);assert.equal(employee.fotoUrl,null);
const doctor=await request('Odontologos','POST',{idEmpleado:employee.idEmpleado,nroMatricula:'FOTO-'+stamp,diaAtencion:'Lunes a viernes',horarioAtencion:'09:00-17:00'},201);
assert.ok(!Object.keys(doctor).some(k=>k.toLowerCase().includes('foto')));
const patientPath='Pacientes/'+patient.idPaciente,employeePath='Empleados/'+employee.idEmpleado;
let p=await upload(patientPath,jpeg,'mi-foto.jpg','image/jpeg');
await photo(p.fotoUrl);
const first=p.fotoUrl;
const before=await request(patientPath);
for(const [bytes,name,mime] of [
 [Buffer.from('<script>malicioso</script>'),'foto.png','image/png'],
 [png,'foto.exe','image/png'],[png,'foto.jpg','image/jpeg'],[png,'foto.png','application/octet-stream'],
 [png.subarray(0,12),'rota.png','image/png'],[Buffer.alloc(0),'vacia.jpg','image/jpeg'],
 [Buffer.alloc(5*1024*1024+1),'grande.png','image/png'],
 [dimensions,'dimensiones.png','image/png'],
]) {
 await upload(patientPath,bytes,name,mime,400);
 assert.deepEqual(await request(patientPath),before,'Una foto inválida no debe modificar datos.');
}
await request(patientPath+'/foto','PUT',{},415);
await upload('Pacientes/2147483647',png,'foto.png','image/png',404);
p=await upload(patientPath,png,'mi-foto.png','image/png');
assert.notEqual(p.fotoUrl,first);await photo(first,404);await photo(p.fotoUrl);
assert.equal((await request(patientPath)).fotoUrl,p.fotoUrl);
await request(patientPath,'PUT',{...patientBody,fotoUrl:'https://malicioso.invalid/a.png'},204);
assert.equal((await request(patientPath)).fotoUrl,p.fotoUrl,'PUT de datos no admite rutas de fotos manipuladas.');
let e=await upload(employeePath,webp,'foto.webp','image/webp');await photo(e.fotoUrl);
const oldEmployee=e.fotoUrl;
e=await upload(employeePath,jpeg,'../../misma-foto.jpg','image/jpeg');
assert.notEqual(e.fotoUrl,oldEmployee);await photo(oldEmployee,404);await photo(e.fotoUrl);
assert.equal((await request(employeePath)).fotoUrl,e.fotoUrl);
await request(employeePath,'PUT',employeeBody,204);
assert.equal((await request(employeePath)).fotoUrl,e.fotoUrl);
const currentDoctor=await request('Odontologos/'+doctor.idOdontologo);
assert.equal(currentDoctor.idEmpleado,employee.idEmpleado);
assert.equal((await request('Empleados')).find(v=>v.idEmpleado===currentDoctor.idEmpleado).fotoUrl,e.fotoUrl);
assert.equal((await request('Pacientes')).find(v=>v.idPaciente===patient.idPaciente).fotoUrl,p.fotoUrl);
for(const path of ['/api/fotos-perfil/appsettings.Local.json','/api/fotos-perfil/..%2fappsettings.Local.json','/api/fotos-perfil/'+p.fotoUrl.split('/').at(-1)+'%0a','/App_Data/profile-photos/'+p.fotoUrl.split('/').at(-1)]) {
 const response=await fetch(origin+path);assert.ok([400,404].includes(response.status));checks++;
}
console.log(`${checks} comprobaciones HTTP correctas: formatos, reemplazo, persistencia, archivos inválidos, tamaño, dimensiones y rutas.`);
// Se conservan activos para la revisión en navegador. Desactivarlos al finalizar esa revisión.
console.log(JSON.stringify({paciente:patient.idPaciente,empleado:employee.idEmpleado,odontologo:doctor.idOdontologo,fotoPaciente:p.fotoUrl,fotoEmpleado:e.fotoUrl}));
