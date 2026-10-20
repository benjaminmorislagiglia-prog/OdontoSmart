import assert from 'node:assert/strict';
import { calendarDays, calendarDateKey, adjacentMonth } from '../src/utils/calendar.js';
import { validDate } from '../src/utils/formValidation.js';

assert.equal(calendarDays(2024,1).filter(Boolean).length,29);
assert.equal(calendarDays(2025,1).filter(Boolean).length,28);
assert.equal(calendarDays(1900,1).filter(Boolean).length,28);
assert.equal(calendarDays(2000,1).filter(Boolean).length,29);
assert.equal(calendarDays(96,1).filter(Boolean).length,29);
assert.equal(calendarDays(2026,9).indexOf(1),3); // Jueves; la semana empieza el lunes.
assert.equal(calendarDays(2026,1).indexOf(1),6); // Domingo.
assert.deepEqual(adjacentMonth(2026,11,1),{year:2027,month:0});
assert.deepEqual(adjacentMonth(2026,0,-1),{year:2025,month:11});
assert.deepEqual(adjacentMonth(1,0,-1),{year:1,month:0});
assert.deepEqual(adjacentMonth(9999,11,1),{year:9999,month:11});
assert.equal(calendarDateKey(2026,9,20),'2026-10-20');
assert.equal(calendarDateKey(1,0,1),'0001-01-01');
for(const year of [1,96,1900,2000,2024,2025,2026,9999])for(let month=0;month<12;month++){
 const cells=calendarDays(year,month);
 assert.equal(cells.length%7,0);
 assert.ok(cells.length>=28&&cells.length<=42);
 for(const day of cells.filter(Boolean))assert.ok(validDate(calendarDateKey(year,month,day)));
}
console.log('Calendario: meses, días reales, años bisiestos, límites, cambio de año y fechas ISO sin desplazamiento horario: OK.');
