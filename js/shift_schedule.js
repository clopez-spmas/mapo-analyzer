/* Cálculo de OP para la ficha MAPO de hospitalización.
   A = personas presentes durante todo el turno.
   B = personas presentes parcialmente.
   C = horas de presencia / horas del turno.
   D = C x B.
   OP = suma de A de los tres turnos + suma de D.
*/

const SHIFT_NAMES = ['Mañana','Tarde','Noche'];

function timeToMinutes(value){
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error(`Hora no válida: ${value}. Use formato 24 h (HH:MM).`);
  const [h,m]=value.split(':').map(Number); return h*60+m;
}
function durationMinutes(start,end){
  let s=timeToMinutes(start), e=timeToMinutes(end); if(e<=s)e+=1440; return e-s;
}
function overlapMinutes(startA,endA,startB,endB){
  let a=timeToMinutes(startA), b=timeToMinutes(endA), c=timeToMinutes(startB), d=timeToMinutes(endB);
  if(b<=a)b+=1440; if(d<=c)d+=1440;
  let best=0;
  for(const shiftOffset of [0,1440]){
    const cc=c+shiftOffset, dd=d+shiftOffset;
    best=Math.max(best,Math.max(0,Math.min(b,dd)-Math.max(a,cc)));
  }
  return best;
}
function classifyShifts(rows){
  const ordered=rows.map((r,i)=>({...r,index:i,startMin:timeToMinutes(r.start)})).sort((a,b)=>a.startMin-b.startMin);
  return ordered.map((r,i)=>({...r,label:SHIFT_NAMES[i]||`Turno ${i+1}`}));
}
function calculateShiftSchedule(data){
  const rows=data.shifts;
  if(!Array.isArray(rows)||rows.length!==3) throw new Error('Debe definir exactamente tres turnos: mañana, tarde y noche.');
  const classified=classifyShifts(rows);
  const totals={A:0,D:0};
  const details=classified.map((r)=>{
    const hours=durationMinutes(r.start,r.end)/60;
    if(hours<=0) throw new Error(`La duración del turno ${r.label} debe ser mayor que cero.`);
    const A=Number(r.fullPeople||0), B=Number(r.partialPeople||0);
    if(A<0||B<0) throw new Error('El número de personas no puede ser negativo.');
    const partialHours= r.partialStart && r.partialEnd ? overlapMinutes(r.start,r.end,r.partialStart,r.partialEnd)/60 : 0;
    if(B>0 && partialHours<=0) throw new Error(`Introduzca el horario de presencia parcial del turno ${r.label}.`);
    if(partialHours>hours+1e-9) throw new Error(`La presencia parcial del turno ${r.label} no puede superar la duración del turno.`);
    const C=B>0?partialHours/hours:0;
    const D=C*B;
    totals.A+=A; totals.D+=D;
    return {label:r.label,start:r.start,end:r.end,turnHours:hours,A,B,partialHours,C,D};
  });
  return {...totals,OP:totals.A+totals.D,details:details.sort((a,b)=>SHIFT_NAMES.indexOf(a.label)-SHIFT_NAMES.indexOf(b.label))};
}
