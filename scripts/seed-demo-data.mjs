import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdtempSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Carga exclusiva de desarrollo. Sin --replace sólo muestra el plan.
const args = process.argv.slice(2);
const server = args.includes('--server') ? args[args.indexOf('--server') + 1] : '.\\SQLEXPRESS';
if (!/^(?:\.|localhost|127\.0\.0\.1)(?:\\[\w-]+)?$/i.test(server)) throw Error('Usar únicamente una instancia SQL Server local.');
const database = 'OdontoSmartDB';
const now = new Date();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const localHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', hourCycle: 'h23' }).format(now));
const baseDay = new Date(today + 'T12:00:00Z');
const dateKey = date => date.toISOString().slice(0, 10);
function businessDay(offset) {
  const date = new Date(baseDay);
  const direction = Math.sign(offset);
  for (let remaining = Math.abs(offset); remaining > 0;) {
    date.setUTCDate(date.getUTCDate() + direction);
    if (![0, 6].includes(date.getUTCDay())) remaining--;
  }
  return dateKey(date);
}
const patients = [
  ['Ana','Bustos',28],['Bruno','Correa',37],['Catalina','Duarte',23],['Esteban','Luna',46],
  ['Inés','Montes',34],['Joaquín','Arias',41],['Malena','Robles',26],['Pedro','Giménez',53],
  ['Renata','Salcedo',32],['Simón','Varela',60],
];
const dentists = [
  ['Clara','Aguilar','Odontología general'],['Ignacio','Domínguez','Endodoncia'],
  ['Victoria','Escudero','Ortodoncia'],['Ramiro','Godoy','Periodoncia'],
  ['Natalia','López','Cirugía bucal'],['Sebastián','Miranda','Rehabilitación oral'],
];
const rooms = ['Consultorio 1','Consultorio 2','Consultorio 3'];
const coverage = ['Cobertura Dental Norte (ficticia)','Salud Integral Centro (ficticia)','Plan Odontológico Sur (ficticio)'];
const streets = ['Los Tilos','Av. del Parque','Los Aromos','Pasaje del Sol','Los Ceibos','Las Acacias','Los Álamos','Av. Las Flores','Los Olivos','Pasaje del Molino'];
const cases = [
  ['Lesión cariosa en pieza 16','Restauración con resina de pieza 16','Restauración finalizada; se recomienda un control de evolución.'],
  ['Patología pulpar en pieza 36','Tratamiento endodóntico de pieza 36','Procedimiento finalizado; se registra control posterior.'],
  ['Apiñamiento dental anterior','Control y ajuste de aparatología ortodóntica','Seguimiento de la alineación dental.'],
  ['Gingivitis asociada a placa','Profilaxis y limpieza periodontal','Se registran recomendaciones de higiene y control.'],
  ['Resto radicular en pieza 18','Extracción de resto radicular de pieza 18','Procedimiento sin incidencias; control posoperatorio programado.'],
  ['Desajuste de prótesis removible','Ajuste y pulido de prótesis removible','Se verifica comodidad y adaptación de la prótesis.'],
];
const usedDni = new Set();
const dni = age => {
  // Rangos aproximados por edad; números inventados, únicos dentro de esta carga.
  let result;
  do result = String(randomInt(Math.max(14000000, 55000000-age*600000), Math.max(17000000, 58000000-age*600000))); while (usedDni.has(result));
  usedDni.add(result);
  return result;
};
const usedPhones = new Set();
const phone = () => {
  let result;
  do result = '0351-000-' + randomInt(1000,10000); while (usedPhones.has(result));
  usedPhones.add(result);
  return result;
};
const sqlString = value => value == null ? 'NULL' : "N'" + String(value).replaceAll("'", "''") + "'";
const weekday = ![0,6].includes(baseDay.getUTCDay());
// Antes del mediodía las atenciones se ubican en el último día hábil.
// Desde las 14:00 las reservas nuevas pasan al próximo día hábil.
const completedDate = weekday && localHour >= 12 ? today : businessDay(-1);
const futureDate = weekday && localHour < 14 ? today : businessDay(1);
const appointments = [
  {date:completedDate,time:'09:00:00',doctor:0,room:0,patient:0,state:'Atendido',clinical:true},
  {date:completedDate,time:'09:30:00',doctor:1,room:1,patient:1,state:'Atendido',clinical:true},
  {date:completedDate,time:'10:00:00',doctor:2,room:2,patient:2,state:'Ausente'},
  {date:completedDate,time:'10:30:00',doctor:3,room:0,patient:3,state:'Cancelado'},
  {date:futureDate,time:'14:00:00',doctor:4,room:0,patient:4,state:'Pendiente'},
  {date:futureDate,time:'14:30:00',doctor:5,room:1,patient:5,state:'Confirmado'},
  {date:futureDate,time:'15:00:00',doctor:0,room:2,patient:6,state:'Pendiente'},
  {date:futureDate,time:'15:30:00',doctor:1,room:0,patient:7,state:'Confirmado'},
];
const histories = appointments.filter(a=>a.clinical).length;
const plan = {fechaReferencia:today,pacientesActivos:patients.length,empleados:dentists.length,odontologos:dentists.length,especialidades:dentists.length,consultorios:rooms.length,turnos:appointments.length,estados:Object.fromEntries(['Pendiente','Confirmado','Atendido','Cancelado','Ausente'].map(state=>[state,appointments.filter(a=>a.state===state).length])),historiasClinicas:histories};
assert.equal(appointments.length,8);
assert.equal(new Set(appointments.map(a=>a.doctor)).size,dentists.length);
for (const a of appointments) {
  assert.ok(patients[a.patient] && dentists[a.doctor] && rooms[a.room]);
  const scheduled = new Date(`${a.date}T${a.time}-03:00`);
  assert.ok(![0,6].includes(scheduled.getUTCDay()),'Turno fuera de un día hábil');
  assert.ok(a.time >= '09:00:00' && a.time <= '16:00:00','Turno fuera del horario de atención');
  assert.ok(['Pendiente','Confirmado'].includes(a.state) ? scheduled > now : scheduled < now,'Fecha incompatible con el estado');
  if(a.clinical) assert.ok(scheduled.getTime()+45*60*1000 < now.getTime(),'Atención todavía no finalizada');
}
for (const key of ['doctor','room','patient']) {
  const slots = appointments.filter(a=>a.state!=='Cancelado').map(a=>[a.date,a.time,a[key]].join('|'));
  assert.equal(new Set(slots).size,slots.length,'Doble reserva de '+key);
}
console.log('Plan de datos ficticios:', JSON.stringify(plan));
if (!args.includes('--replace')) {
  console.log('Vista previa. Para reemplazar datos locales: node scripts/seed-demo-data.mjs --replace --server ".\\SQLEXPRESS"');
  process.exit(0);
}
function sql(query) {
  return execFileSync('sqlcmd',['-S',server,'-E','-C','-d',database,'-b','-r','1','-h','-1','-W','-Q',query],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}
// Antes de tocar datos: validar destino, esquema, dependencias y estados requeridos.
sql(`SET NOCOUNT ON;
IF DB_NAME() <> N'OdontoSmartDB' THROW 51000, 'Base de desarrollo inesperada.', 1;
IF COL_LENGTH('dbo.HistorialClinico','Anulado') IS NULL THROW 51000, 'Falta la actualización de Historia Clínica.', 1;
IF (SELECT COUNT(*) FROM dbo.EstadoTurno WHERE Nombre IN ('Pendiente','Confirmado','Atendido','Cancelado','Ausente')) <> 5
    THROW 51000, 'El catálogo de estados no coincide; no se modificará.', 1;`);
const backupDir = sql("SET NOCOUNT ON; SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000));");
if (!path.win32.isAbsolute(backupDir)) throw Error('No se pudo determinar una carpeta de respaldo válida.');
const backup = path.win32.join(backupDir,`${database}-antes-datos-ficticios-${now.toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}.bak`);
sql(`BACKUP DATABASE [OdontoSmartDB] TO DISK = ${sqlString(backup)} WITH COPY_ONLY, CHECKSUM;
RESTORE VERIFYONLY FROM DISK = ${sqlString(backup)} WITH CHECKSUM;`);
console.log('Respaldo verificado:', backup);

const statements = [`USE [OdontoSmartDB]; SET NOCOUNT ON; SET XACT_ABORT ON; SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRY
BEGIN TRANSACTION;
DECLARE @LockResult int;
EXEC @LockResult=sys.sp_getapplock @Resource=N'OdontoSmart:Agenda',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
IF @LockResult<0 THROW 51000, 'La agenda está ocupada; no se aplicó el reemplazo.', 1;
DECLARE @Estados TABLE(IdEstadoTurno int,Nombre varchar(50));
INSERT @Estados SELECT IdEstadoTurno,Nombre FROM dbo.EstadoTurno;
-- Reemplazo de datos ficticios expresamente solicitado. No es una operación de la aplicación.
DELETE dbo.TurnoInsumo; DELETE dbo.PrestacionTurno; DELETE dbo.ObraSocialPrestacion; DELETE dbo.Equipamiento;
DELETE dbo.HistorialClinico; DELETE dbo.HistorialEstadoTurno; DELETE dbo.Turno;
DELETE dbo.OdontologoEspecialidad; DELETE dbo.Odontologo; DELETE dbo.Paciente;
DELETE dbo.Empleado; DELETE dbo.Consultorio; DELETE dbo.Especialidad;
DELETE dbo.Direccion; DELETE dbo.Localidad; DELETE dbo.Provincia; DELETE dbo.Puesto;
DELETE dbo.Insumo; DELETE dbo.Prestacion; DELETE dbo.ObraSocial;
DECLARE @Provincia int,@Localidad int,@Puesto int;
INSERT dbo.Provincia(Nombre,Pais) VALUES(N'Córdoba',N'Argentina'); SET @Provincia=SCOPE_IDENTITY();
INSERT dbo.Localidad(Nombre,IdProvincia) VALUES(N'Córdoba Capital',@Provincia); SET @Localidad=SCOPE_IDENTITY();
INSERT dbo.Puesto(Nombre) VALUES(N'Odontólogo'); SET @Puesto=SCOPE_IDENTITY();
DECLARE @Direcciones TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Pacientes TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Doctores TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Especialidades TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Consultorios TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Coberturas TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Empleado int,@Turno int;`];
coverage.forEach((name,i)=>statements.push(`INSERT dbo.ObraSocial(Nombre) VALUES(${sqlString(name)}); INSERT @Coberturas VALUES(${i},SCOPE_IDENTITY());`));
for(let i=0;i<rooms.length+patients.length+dentists.length;i++) {
  statements.push(`INSERT dbo.Direccion(Calle,Numero,Barrio,CP,IdLocalidad) VALUES(${sqlString(streets[i%streets.length])},${randomInt(100,2900)},${sqlString(['Centro','Jardín','Alta Córdoba'][i%3])},N'5000',@Localidad);
INSERT @Direcciones VALUES(${i},SCOPE_IDENTITY());`);
}
rooms.forEach((name,i)=>statements.push(`INSERT dbo.Consultorio(Nombre,IdDireccion) VALUES(${sqlString(name)},(SELECT Id FROM @Direcciones WHERE NumeroDemo=${i})); INSERT @Consultorios VALUES(${i},SCOPE_IDENTITY());`));
patients.forEach(([name,last,age],i)=>{
  const birth=`${baseDay.getUTCFullYear()-age}-${String(randomInt(1,10)).padStart(2,'0')}-${String(randomInt(1,29)).padStart(2,'0')}`;
  statements.push(`INSERT dbo.Paciente(DNI,Nombre,Apellido,Telefono,Correo,FechaNacimiento,Activo,IdObraSocial,IdDireccion)
VALUES(${sqlString(dni(age))},${sqlString(name)},${sqlString(last)},${sqlString(phone())},${sqlString('paciente'+(i+1)+'@example.com')},${sqlString(birth)},1,${i%4===3?'NULL':`(SELECT Id FROM @Coberturas WHERE NumeroDemo=${i%3})`},(SELECT Id FROM @Direcciones WHERE NumeroDemo=${rooms.length+i}));
INSERT @Pacientes VALUES(${i},SCOPE_IDENTITY());`);
});
dentists.forEach(([name,last,specialty],i)=>{
  statements.push(`INSERT dbo.Especialidad(Nombre) VALUES(${sqlString(specialty)}); INSERT @Especialidades VALUES(${i},SCOPE_IDENTITY());
INSERT dbo.Empleado(DNI,Nombre,Apellido,Telefono,Correo,IdDireccion,IdPuesto,Activo)
VALUES(${sqlString(dni(32+i*3))},${sqlString(name)},${sqlString(last)},${sqlString(phone())},${sqlString('odontologo'+(i+1)+'@example.com')},(SELECT Id FROM @Direcciones WHERE NumeroDemo=${rooms.length+patients.length+i}),@Puesto,1);
SET @Empleado=SCOPE_IDENTITY();
INSERT dbo.Odontologo(HorarioAtencion,DiaAtencion,NroMatricula,IdEmpleado,Activo)
VALUES(N'09:00-17:00',N'Lunes a Viernes',${sqlString('MP-'+randomInt(20000,90000)+'-'+(i+1))},@Empleado,1); INSERT @Doctores VALUES(${i},SCOPE_IDENTITY());
INSERT dbo.OdontologoEspecialidad(IdEspecialidad,IdOdontologo) VALUES((SELECT Id FROM @Especialidades WHERE NumeroDemo=${i}),(SELECT Id FROM @Doctores WHERE NumeroDemo=${i}));`);
});
appointments.forEach(a=>{
  const scheduled=a.date+'T'+a.time;
  const created=businessDay(-5)+'T08:00:00';
  statements.push(`INSERT dbo.Turno(Fecha,Hora,IdPaciente,IdOdontologo,IdConsultorio)
VALUES(${sqlString(a.date)},${sqlString(a.time)},(SELECT Id FROM @Pacientes WHERE NumeroDemo=${a.patient}),(SELECT Id FROM @Doctores WHERE NumeroDemo=${a.doctor}),(SELECT Id FROM @Consultorios WHERE NumeroDemo=${a.room})); SET @Turno=SCOPE_IDENTITY();
INSERT dbo.HistorialEstadoTurno(IdTurno,IdEstadoTurno,FechaHora) VALUES(@Turno,(SELECT IdEstadoTurno FROM @Estados WHERE Nombre='Pendiente'),${sqlString(created)});`);
  if(a.state!=='Pendiente') {
    if(['Atendido','Ausente'].includes(a.state)) statements.push(`INSERT dbo.HistorialEstadoTurno(IdTurno,IdEstadoTurno,FechaHora) VALUES(@Turno,(SELECT IdEstadoTurno FROM @Estados WHERE Nombre='Confirmado'),DATEADD(day,-1,CAST(${sqlString(scheduled)} AS datetime)));`);
    const when=a.state==='Atendido'?`DATEADD(minute,45,CAST(${sqlString(scheduled)} AS datetime))`:a.state==='Ausente'?`DATEADD(minute,20,CAST(${sqlString(scheduled)} AS datetime))`:a.state==='Cancelado'?`DATEADD(day,-1,CAST(${sqlString(scheduled)} AS datetime))`:`CAST(${sqlString(businessDay(-1)+'T08:00:00')} AS datetime)`;
    statements.push(`INSERT dbo.HistorialEstadoTurno(IdTurno,IdEstadoTurno,FechaHora) VALUES(@Turno,(SELECT IdEstadoTurno FROM @Estados WHERE Nombre=${sqlString(a.state)}),${when});`);
  }
  if(a.clinical){
    const [diagnosis,treatment,notes]=cases[a.doctor];
    statements.push(`INSERT dbo.HistorialClinico(IdPaciente,IdTurno,Diagnostico,TratamientosRealizados,Observaciones,Anulado)
VALUES((SELECT Id FROM @Pacientes WHERE NumeroDemo=${a.patient}),@Turno,${sqlString(diagnosis)},${sqlString(treatment)},${sqlString(notes)},0);`);
  }
});
statements.push(`
IF EXISTS(SELECT IdEstadoTurno,Nombre FROM @Estados EXCEPT SELECT IdEstadoTurno,Nombre FROM dbo.EstadoTurno)
 OR EXISTS(SELECT IdEstadoTurno,Nombre FROM dbo.EstadoTurno EXCEPT SELECT IdEstadoTurno,Nombre FROM @Estados)
 THROW 51000, 'Se detectó un cambio inesperado en los estados.', 1;
IF EXISTS(SELECT 1 FROM dbo.HistorialClinico h JOIN dbo.Turno t ON t.IdTurno=h.IdTurno WHERE h.IdPaciente<>t.IdPaciente)
 THROW 51000, 'Historia clínica asociada a paciente incorrecto.', 1;
IF (SELECT COUNT(*) FROM dbo.Paciente)<>${patients.length} OR (SELECT COUNT(*) FROM dbo.Turno)<>${appointments.length}
 OR (SELECT COUNT(*) FROM dbo.HistorialClinico)<>${histories}
 OR (SELECT COUNT(*) FROM dbo.Odontologo WHERE Activo=1)<>${dentists.length}
 OR (SELECT COUNT(*) FROM dbo.Empleado WHERE Activo=1)<>${dentists.length}
 OR (SELECT COUNT(*) FROM dbo.Paciente WHERE Activo=1)<>${patients.length}
 THROW 51000, 'Conteos inesperados; se revierte toda la carga.', 1;
IF EXISTS(SELECT 1 FROM (
 SELECT e.Nombre,LAG(e.Nombre) OVER(PARTITION BY h.IdTurno ORDER BY h.FechaHora,h.IdHistorialEstadoTurno) AS Anterior
 FROM dbo.HistorialEstadoTurno h JOIN dbo.EstadoTurno e ON e.IdEstadoTurno=h.IdEstadoTurno
) cambios WHERE (Anterior IS NULL AND Nombre<>'Pendiente') OR (Anterior IS NOT NULL AND NOT
 ((Anterior='Pendiente' AND Nombre IN ('Confirmado','Cancelado')) OR (Anterior='Confirmado' AND Nombre IN ('Atendido','Cancelado','Ausente')))))
 THROW 51000, 'Transición de estado inválida; se revierte la carga.', 1;
IF EXISTS(SELECT 1 FROM dbo.HistorialEstadoTurno WHERE FechaHora>CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'Argentina Standard Time' AS datetime2))
 THROW 51000, 'Historial con fecha futura; se revierte la carga.', 1;
DECLARE @Conteos TABLE(Nombre varchar(50),Cantidad int);
INSERT @Conteos SELECT e.Nombre,COUNT(*) FROM dbo.Turno t
CROSS APPLY(SELECT TOP(1) h.IdEstadoTurno FROM dbo.HistorialEstadoTurno h WHERE h.IdTurno=t.IdTurno ORDER BY h.FechaHora DESC,h.IdHistorialEstadoTurno DESC) actual
JOIN dbo.EstadoTurno e ON e.IdEstadoTurno=actual.IdEstadoTurno GROUP BY e.Nombre;
IF EXISTS(SELECT Nombre,Cantidad FROM @Conteos EXCEPT SELECT Nombre,Cantidad FROM (VALUES('Pendiente',2),('Confirmado',2),('Atendido',2),('Cancelado',1),('Ausente',1)) esperados(Nombre,Cantidad))
 OR (SELECT COUNT(*) FROM @Conteos)<>5 THROW 51000, 'Distribución de estados incorrecta; se revierte la carga.', 1;
COMMIT TRANSACTION;
SELECT 'Pacientes',COUNT(*) FROM dbo.Paciente UNION ALL SELECT 'Odontólogos',COUNT(*) FROM dbo.Odontologo
UNION ALL SELECT 'Especialidades',COUNT(*) FROM dbo.Especialidad UNION ALL SELECT 'Consultorios',COUNT(*) FROM dbo.Consultorio
UNION ALL SELECT 'Turnos',COUNT(*) FROM dbo.Turno UNION ALL SELECT 'Historias clínicas',COUNT(*) FROM dbo.HistorialClinico;
SELECT Nombre AS Estado,Cantidad FROM @Conteos ORDER BY Nombre;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
THROW;
END CATCH;`);
const temp = mkdtempSync(path.join(tmpdir(),'odontosmart-seed-'));
const file = path.join(temp,'datos.sql');
try {
  writeFileSync(file,'\ufeff'+statements.join('\n'),'utf8');
  const output=execFileSync('sqlcmd',['-S',server,'-E','-C','-d',database,'-b','-f','65001','-i',file],{encoding:'utf8'});
  console.log(output.trim());
} finally { try { unlinkSync(file); rmdirSync(temp); } catch { /* Archivo temporal fuera del repositorio. */ } }
console.log('Carga completa. Estados de turno conservados. Respaldo:',backup);
