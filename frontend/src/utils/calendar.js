export const calendarMonths = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function calendarDays(year, month) {
 const first = new Date(0);
 first.setUTCHours(0,0,0,0);
 first.setUTCFullYear(year,month,1);
 const last = new Date(first);
 last.setUTCMonth(month+1,0);
 const offset = (first.getUTCDay()+6)%7;
 const cells = Array(offset).fill(null).concat(Array.from({length:last.getUTCDate()},(_,i)=>i+1));
 while(cells.length%7)cells.push(null);
 return cells;
}

export const calendarDateKey = (year,month,day) => `${String(year).padStart(4,'0')}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

export function adjacentMonth(year,month,direction) {
 const index=(year-1)*12+month+direction;
 if(index<0||index>=9999*12)return {year,month};
 return {year:Math.floor(index/12)+1,month:index%12};
}
