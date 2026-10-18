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
  ['Lucía','Fernández',24],['Martín','Quiroga',36],['Valentina','Sosa',22],['Diego','Molina',42],
  ['Camila','Roldán',31],['Ricardo','Funes',58],['Sofía','Benítez',27],['Gabriel','Peralta',45],
  ['Julieta','Acosta',26],['Nicolás','Vega',39],['Florencia','Navarro',33],['Elena','Castro',61],
  ['Agustín','Ponce',29],['Carolina','Suárez',48],['Tomás','Medina',25],['Verónica','Ledesma',52],
  ['Matías','Cabrera',35],['Oscar','Villalba',64],['Paula','Herrera',30],['Federico','Salinas',44],
];
const dentists = [
  ['Mariana','Ríos','Odontología general'],['Santiago','Ferreyra','Endodoncia'],
  ['Emilia','Torres','Ortodoncia'],['Andrés','Ibarra','Periodoncia'],
  ['Daniela','Paz','Cirugía bucal'],['Leandro','Campos','Rehabilitación oral'],
];
const rooms = ['Consultorio Central','Consultorio Sur','Consultorio Norte'];
const streets = ['Los Tilos','Av. del Parque','Los Aromos','Pasaje del Sol','Los Ceibos','Las Acacias','Los Álamos','Av. Las Flores','Los Olivos','Pasaje del Molino'];
const cases = [
  ['Lesión cariosa en pieza 16','Restauración con resina de pieza 16','Restauración finalizada; control de evolución programado.'],
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
const phone = () => '0351-000-' + randomInt(1000,10000);
const sqlString = value => value == null ? 'NULL' : "N'" + String(value).replaceAll("'", "''") + "'";
const appointments = [];
function addDay(date, kind, patientOffset = 0) {
  dentists.forEach((_, doctor) => {
    const hour = (kind === 'cancelled' ? 11 : 9) + (doctor >= 3 ? 2 : 0);
    const time = String(hour).padStart(2,'0') + ':00:00';
    const attended = kind === 'past' || (kind === 'today' && localHour >= hour+1);
    appointments.push({date,time,doctor,room:doctor%3,patient:(patientOffset+doctor)%patients.length,
      state:attended?'Atendido':kind==='cancelled'?'Cancelado':doctor%2?'Confirmado':'Pendiente',
      clinical:attended,followUp:kind==='today'});
  });
}
[-8,-5,-2].forEach((offset,index) => addDay(businessDay(offset),'past',index*6));
addDay(businessDay(-1),'cancelled',18);
if (![0,6].includes(baseDay.getUTCDay())) addDay(today,'today');
[1,3].forEach((offset,index) => addDay(businessDay(offset),'future',index*6));
const histories = appointments.filter(a=>a.clinical).length;
const plan = {fechaReferencia:today,pacientes:patients.length,odontologos:dentists.length,especialidades:dentists.length,consultorios:rooms.length,turnos:appointments.length,historiasClinicas:histories};
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
  return execFileSync('sqlcmd',['-S',server,'-E','-d',database,'-b','-r','1','-h','-1','-W','-Q',query],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}
// Antes de tocar datos: validar destino, esquema, dependencias y estados requeridos.
sql(`SET NOCOUNT ON;
IF DB_NAME() <> N'OdontoSmartDB' THROW 51000, 'Base de desarrollo inesperada.', 1;
IF COL_LENGTH('dbo.HistorialClinico','Anulado') IS NULL THROW 51000, 'Falta la actualización de Historia Clínica.', 1;
IF EXISTS(SELECT 1 FROM dbo.TurnoInsumo) OR EXISTS(SELECT 1 FROM dbo.PrestacionTurno) OR EXISTS(SELECT 1 FROM dbo.Equipamiento)
    THROW 51000, 'Hay relaciones fuera del alcance: revisar antes de reemplazar.', 1;
IF (SELECT COUNT(*) FROM dbo.EstadoTurno WHERE Nombre IN ('Pendiente','Confirmado','Atendido','Cancelado')) <> 4
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
IF EXISTS(SELECT 1 FROM dbo.TurnoInsumo) OR EXISTS(SELECT 1 FROM dbo.PrestacionTurno) OR EXISTS(SELECT 1 FROM dbo.Equipamiento)
    THROW 51000, 'Aparecieron relaciones fuera del alcance; cancelar.', 1;
DECLARE @Estados TABLE(IdEstadoTurno int,Nombre varchar(50));
INSERT @Estados SELECT IdEstadoTurno,Nombre FROM dbo.EstadoTurno;
-- Reemplazo de datos ficticios expresamente solicitado. No es una operación de la aplicación.
DELETE dbo.HistorialClinico; DELETE dbo.HistorialEstadoTurno; DELETE dbo.Turno;
DELETE dbo.OdontologoEspecialidad; DELETE dbo.Odontologo; DELETE dbo.Paciente;
DELETE dbo.Empleado; DELETE dbo.Consultorio; DELETE dbo.Especialidad;
DELETE dbo.Direccion; DELETE dbo.Localidad; DELETE dbo.Provincia; DELETE dbo.Puesto;
DECLARE @Provincia int,@Localidad int,@Puesto int;
INSERT dbo.Provincia(Nombre,Pais) VALUES(N'Córdoba',N'Argentina'); SET @Provincia=SCOPE_IDENTITY();
INSERT dbo.Localidad(Nombre,IdProvincia) VALUES(N'Córdoba Capital',@Provincia); SET @Localidad=SCOPE_IDENTITY();
INSERT dbo.Puesto(Nombre) VALUES(N'Odontólogo'); SET @Puesto=SCOPE_IDENTITY();
DECLARE @Direcciones TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Pacientes TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Doctores TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Especialidades TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Consultorios TABLE(NumeroDemo int PRIMARY KEY,Id int);
DECLARE @Empleado int,@Turno int;`];
for(let i=0;i<rooms.length+patients.length+dentists.length;i++) {
  statements.push(`INSERT dbo.Direccion(Calle,Numero,Barrio,CP,IdLocalidad) VALUES(${sqlString(streets[i%streets.length])},${randomInt(100,2900)},${sqlString(['Centro','Jardín','Alta Córdoba'][i%3])},N'5000',@Localidad);
INSERT @Direcciones VALUES(${i},SCOPE_IDENTITY());`);
}
rooms.forEach((name,i)=>statements.push(`INSERT dbo.Consultorio(Nombre,IdDireccion) VALUES(${sqlString(name)},(SELECT Id FROM @Direcciones WHERE NumeroDemo=${i})); INSERT @Consultorios VALUES(${i},SCOPE_IDENTITY());`));
patients.forEach(([name,last,age],i)=>{
  const birth=`${baseDay.getUTCFullYear()-age}-${String(randomInt(1,10)).padStart(2,'0')}-${String(randomInt(1,29)).padStart(2,'0')}`;
  statements.push(`INSERT dbo.Paciente(DNI,Nombre,Apellido,Telefono,Correo,FechaNacimiento,Activo,IdObraSocial,IdDireccion)
VALUES(${sqlString(dni(age))},${sqlString(name)},${sqlString(last)},${sqlString(phone())},${sqlString('paciente'+(i+1)+'@example.com')},${sqlString(birth)},1,NULL,(SELECT Id FROM @Direcciones WHERE NumeroDemo=${rooms.length+i}));
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
  const created=businessDay(-12)+'T08:00:00';
  statements.push(`INSERT dbo.Turno(Fecha,Hora,IdPaciente,IdOdontologo,IdConsultorio)
VALUES(${sqlString(a.date)},${sqlString(a.time)},(SELECT Id FROM @Pacientes WHERE NumeroDemo=${a.patient}),(SELECT Id FROM @Doctores WHERE NumeroDemo=${a.doctor}),(SELECT Id FROM @Consultorios WHERE NumeroDemo=${a.room})); SET @Turno=SCOPE_IDENTITY();
INSERT dbo.HistorialEstadoTurno(IdTurno,IdEstadoTurno,FechaHora) VALUES(@Turno,(SELECT IdEstadoTurno FROM @Estados WHERE Nombre='Pendiente'),${sqlString(created)});`);
  if(a.state!=='Pendiente') {
    if(a.state==='Atendido') statements.push(`INSERT dbo.HistorialEstadoTurno(IdTurno,IdEstadoTurno,FechaHora) VALUES(@Turno,(SELECT IdEstadoTurno FROM @Estados WHERE Nombre='Confirmado'),DATEADD(day,-1,CAST(${sqlString(scheduled)} AS datetime)));`);
    const when=a.state==='Atendido'?`DATEADD(minute,45,CAST(${sqlString(scheduled)} AS datetime))`:a.state==='Cancelado'?`DATEADD(day,-1,CAST(${sqlString(scheduled)} AS datetime))`:`CAST(${sqlString(today+'T08:00:00')} AS datetime)`;
    statements.push(`INSERT dbo.HistorialEstadoTurno(IdTurno,IdEstadoTurno,FechaHora) VALUES(@Turno,(SELECT IdEstadoTurno FROM @Estados WHERE Nombre=${sqlString(a.state)}),${when});`);
  }
  if(a.clinical){
    const [diagnosis,treatment,notes]=cases[a.doctor];
    statements.push(`INSERT dbo.HistorialClinico(IdPaciente,IdTurno,Diagnostico,TratamientosRealizados,Observaciones,Anulado)
VALUES((SELECT Id FROM @Pacientes WHERE NumeroDemo=${a.patient}),@Turno,${sqlString(a.followUp?'Control de evolución: '+diagnosis.toLowerCase():diagnosis)},${sqlString(a.followUp?'Evaluación de evolución del tratamiento previo':treatment)},${sqlString(notes)},0);`);
  }
});
statements.push(`
IF EXISTS(SELECT IdEstadoTurno,Nombre FROM @Estados EXCEPT SELECT IdEstadoTurno,Nombre FROM dbo.EstadoTurno)
 OR EXISTS(SELECT IdEstadoTurno,Nombre FROM dbo.EstadoTurno EXCEPT SELECT IdEstadoTurno,Nombre FROM @Estados)
 THROW 51000, 'Se detectó un cambio inesperado en los estados.', 1;
IF EXISTS(SELECT 1 FROM dbo.HistorialClinico h JOIN dbo.Turno t ON t.IdTurno=h.IdTurno WHERE h.IdPaciente<>t.IdPaciente)
 THROW 51000, 'Historia clínica asociada a paciente incorrecto.', 1;
IF (SELECT COUNT(*) FROM dbo.Paciente)<>${patients.length} OR (SELECT COUNT(*) FROM dbo.Turno)<>${appointments.length}
 OR (SELECT COUNT(*) FROM dbo.HistorialClinico)<>${histories} THROW 51000, 'Conteos inesperados; se revierte toda la carga.', 1;
COMMIT TRANSACTION;
SELECT 'Pacientes',COUNT(*) FROM dbo.Paciente UNION ALL SELECT 'Odontólogos',COUNT(*) FROM dbo.Odontologo
UNION ALL SELECT 'Especialidades',COUNT(*) FROM dbo.Especialidad UNION ALL SELECT 'Consultorios',COUNT(*) FROM dbo.Consultorio
UNION ALL SELECT 'Turnos',COUNT(*) FROM dbo.Turno UNION ALL SELECT 'Historias clínicas',COUNT(*) FROM dbo.HistorialClinico;
END TRY
BEGIN CATCH
IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
THROW;
END CATCH;`);
const temp = mkdtempSync(path.join(tmpdir(),'odontosmart-seed-'));
const file = path.join(temp,'datos.sql');
try {
  writeFileSync(file,'\ufeff'+statements.join('\n'),'utf8');
  const output=execFileSync('sqlcmd',['-S',server,'-E','-d',database,'-b','-f','65001','-i',file],{encoding:'utf8'});
  console.log(output.trim());
} finally { try { unlinkSync(file); rmdirSync(temp); } catch { /* Archivo temporal fuera del repositorio. */ } }
console.log('Carga completa. Estados de turno conservados. Respaldo:',backup);
