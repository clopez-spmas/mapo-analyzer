/* MAPO Hospitalización — módulo canónico de horarios y personas trabajadoras. */
(function(){
'use strict';
const INITIAL=5,MAX_CUSTOM_DAYS=7;
const ALL_DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAY_OPTIONS={
  weekdays:{label:'Lunes a viernes',days:['Lunes','Martes','Miércoles','Jueves','Viernes']},
  weekend:{label:'Sábado y domingo',days:['Sábado','Domingo']},
  longshort:{label:'Semana larga/semana corta',days:[...ALL_DAYS]}
};
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const defaultDays=()=>({type:'weekdays',selected:[...DAY_OPTIONS.weekdays.days]});

/* Semana larga/corta = cobertura del horario los 7 días. */
function normalizeDays(r){
  if(!r.daysWorked)r.daysWorked=defaultDays();
  if(!Array.isArray(r.daysWorked.selected))r.daysWorked.selected=[...DAY_OPTIONS.weekdays.days];
  if(r.daysWorked.type==='longweek'||r.daysWorked.type==='shortweek')r.daysWorked={type:'longshort',selected:[...ALL_DAYS]};
  if(r.daysWorked.type!=='custom'&&!DAY_OPTIONS[r.daysWorked.type])r.daysWorked.type='weekdays';
  r.daysWorked.selected=r.daysWorked.selected.slice(0,MAX_CUSTOM_DAYS);
  return r.daysWorked;
}
function dayFactor(r){const d=normalizeDays(r);return d.type==='longshort'?1:d.selected.length/7;}
const dayLabel=r=>{const d=normalizeDays(r);return d.type==='custom'?(d.selected.length?d.selected.join(', '):'Sin días seleccionados'):(DAY_OPTIONS[d.type]?.label||'Lunes a viernes');};

function state(){
  window.formData=window.formData||{};
  const s=window.formData.workerSchedule=window.formData.workerSchedule||{};
  s.page=s.page||'full';s.mode=s.mode||'manual';
  s.full=Array.isArray(s.full)?s.full:[];s.partial=Array.isArray(s.partial)?s.partial:[];
  s.shifts=s.shifts||{morning:{start:'06:00',end:'14:00'},afternoon:{start:'14:00',end:'22:00'},night:{start:'22:00',end:'06:00'}};
  if(!s.full.length)for(let i=0;i<INITIAL;i++)s.full.push({start:'',end:'',people:'',label:'',daysWorked:defaultDays()});
  if(!s.partial.length)for(let i=0;i<INITIAL;i++)s.partial.push({start:'',end:'',people:'',reference:0,label:'',daysWorked:defaultDays()});
  s.full.forEach(normalizeDays);s.partial.forEach(normalizeDays);return s;
}
function mins(t){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t||''))throw Error('Hora no válida. Use formato 24 h (HH:MM).');const [h,m]=t.split(':').map(Number);return h*60+m;}
function dur(a,b){let x=mins(a),y=mins(b);if(y<=x)y+=1440;return y-x;}
function overlap(a,b,c,d){let s=mins(a),e=mins(b),p=mins(c),q=mins(d);if(e<=s)e+=1440;if(q<=p)q+=1440;let best=0;for(const z of [-1440,0,1440])best=Math.max(best,Math.max(0,Math.min(e,q+z)-Math.max(s,p+z)));return best;}

function saveInputs(){const s=state();document.querySelectorAll('[data-v3-t]').forEach(e=>{const a=s[e.dataset.v3T],i=Number(e.dataset.v3I),f=e.dataset.v3F;a[i]??={};a[i][f]=e.type==='number'?(e.value===''?'':Number(e.value)):e.value;});}
function reference(rows){let best=0;rows.forEach((r,i)=>{if(dur(r.start,r.end)>dur(rows[best].start,rows[best].end))best=i;});return best;}
function fullContribution(r){return Number(r.people)*dayFactor(r);}
function partialContribution(r,referenceHours){if(!referenceHours)return 0;return Number(r.people)*(dur(r.start,r.end)/referenceHours)*dayFactor(r);}

/*
 * La unidad de cada turno es el propio turno.
 * Una persona que cubre todo el turno aporta 1.
 * Si solo cubre una parte, aporta horas solapadas / duración del turno.
 * Ejemplo: 07:00-19:00 frente a 07:00-15:00 => 8/8 = 1.
 * El mismo horario frente a 15:00-23:00 => 4/8 = 0,5.
 * Para 08:00-20:00: mañana = 7/8 y tarde = 5/8.
 */
function scheduleTurnContribution(r,turn,referenceHours,isPartial){
  const turnHours=dur(turn.start,turn.end);
  if(!turnHours)return 0;
  const share=overlap(r.start,r.end,turn.start,turn.end)/turnHours;
  const base=isPartial?Number(r.people)*dayFactor(r):Number(r.people)*dayFactor(r);
  return base*share;
}

/*
 * Base matemática única del desglose:
 * A = suma de las contribuciones de jornadas completas en cada turno.
 * D = suma de las contribuciones de horarios parciales en cada turno.
 * OP = A + D = suma exacta de mañana + tarde + noche.
 */
function calculate(){
  const s=state();
  const full=s.full.filter(r=>r.start&&r.end&&Number(r.people)>0);
  const partial=s.partial.filter(r=>r.start&&r.end&&Number(r.people)>0);
  const ref=full.length?reference(full):-1;
  const referenceHours=ref>=0?dur(full[ref].start,full[ref].end):0;
  const rows=[['Mañana','morning'],['Tarde','afternoon'],['Noche','night']].map(([name,key])=>{
    const sh=s.shifts[key];
    const fp=full.reduce((sum,r)=>sum+scheduleTurnContribution(r,sh,referenceHours,false),0);
    const pp=partial.reduce((sum,r)=>sum+scheduleTurnContribution(r,sh,referenceHours,true),0);
    return{name,key,fullPresent:fp,partialPresent:pp,totalPresent:fp+pp,op:fp+pp};
  });
  const A=rows.reduce((sum,r)=>sum+r.fullPresent,0);
  const D=rows.reduce((sum,r)=>sum+r.partialPresent,0);
  const OP=A+D;
  return{A,D,OP,rows,reference:ref,referenceHours,totalBase:OP,numericalDifference:0};
}

function ensureDialog(){let d=document.getElementById('daysDialog');if(!d){d=document.createElement('div');d.id='daysDialog';d.className='mapo-days-dialog';d.hidden=true;document.body.appendChild(d);}if(!document.getElementById('mapoDaysDialogStyle')){const st=document.createElement('style');st.id='mapoDaysDialogStyle';st.textContent='.mapo-days-dialog{position:fixed;inset:0;z-index:2147483000}.mapo-days-dialog[hidden]{display:none!important}.mapo-days-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45)}.mapo-days-modal{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100% - 32px));background:#fff;border-radius:12px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.3)}.mapo-days-list{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}.mapo-days-list label{padding:9px;border:1px solid #ddd;border-radius:8px}.mapo-days-actions{display:flex;justify-content:flex-end;gap:10px}.mapo-days-presets{display:flex;flex-wrap:wrap;gap:8px}.mapo-days-dialog button{cursor:pointer}';document.head.appendChild(st);}return d;}
function openDaysDialog(index){saveInputs();const s=state(),arr=s.page==='partial'?s.partial:s.full,r=arr[index];if(!r)return;normalizeDays(r);const d=ensureDialog();d.dataset.index=String(index);d.hidden=false;d.innerHTML=`<div class="mapo-days-backdrop" data-days-close></div><div class="mapo-days-modal" role="dialog" aria-modal="true" aria-labelledby="mapoDaysTitle"><h3 id="mapoDaysTitle">Días trabajados</h3><p>Seleccione los días en los que trabaja este horario.</p><div class="mapo-days-presets"><button type="button" data-preset="weekdays">Lunes a viernes</button><button type="button" data-preset="weekend">Sábado y domingo</button><button type="button" data-preset="longshort">Semana larga/semana corta</button><button type="button" data-preset="custom">Personalizado</button></div><div class="mapo-days-list">${ALL_DAYS.map((day,i)=>`<label><input type="checkbox" data-day="${i}" ${r.daysWorked.selected.includes(day)?'checked':''}> ${day}</label>`).join('')}</div><div class="mapo-days-actions"><button type="button" class="secondary" data-days-close>Cancelar</button><button type="button" data-days-save>Guardar días</button></div></div>`;}
function closeDaysDialog(){const d=document.getElementById('daysDialog');if(d){d.hidden=true;d.innerHTML='';d.dataset.index='';}}
function saveDaysDialog(){const d=document.getElementById('daysDialog');if(!d)return;const index=Number(d.dataset.index),s=state(),arr=s.page==='partial'?s.partial:s.full,r=arr[index];if(!r)return;const checks=[...d.querySelectorAll('[data-day]')],selected=checks.filter(c=>c.checked).map(c=>ALL_DAYS[Number(c.dataset.day)]);if(!selected.length){alert('Seleccione al menos un día trabajado.');return;}r.daysWorked={type:selected.length===5&&selected.every(x=>DAY_OPTIONS.weekdays.days.includes(x))?'weekdays':selected.length===2&&selected.every(x=>DAY_OPTIONS.weekend.days.includes(x))?'weekend':selected.length===7?'longshort':'custom',selected};closeDaysDialog();render();}
function applyPreset(preset){const d=document.getElementById('daysDialog');if(!d)return;const days=preset==='weekdays'?DAY_OPTIONS.weekdays.days:preset==='weekend'?DAY_OPTIONS.weekend.days:preset==='longshort'?ALL_DAYS:[];d.querySelectorAll('[data-day]').forEach((c,i)=>c.checked=days.includes(ALL_DAYS[i]));}
function removeSchedule(index){saveInputs();const s=state(),arr=s.page==='partial'?s.partial:s.full;if(index<0||index>=arr.length)return;if(arr.length<=1)arr[0]={start:'',end:'',people:'',label:'',daysWorked:defaultDays()};else arr.splice(index,1);render();}
function render(){const s=state(),host=document.getElementById('formContainer');if(!host)return;host.innerHTML=`<div class="step-title-row"><h3>Personas trabajadoras que realizan MMP</h3></div><div class="subnav"><button type="button" class="subnav-btn ${s.page==='full'?'active':''}" data-v3-page="full">Jornada completa</button><button type="button" class="subnav-btn ${s.page==='partial'?'active':''}" data-v3-page="partial">Horario parcial</button></div><div id="workerV3Page"></div><div id="workerV3Results"></div>`;renderPage();renderResults();bind();}
function renderPage(){const s=state(),h=document.getElementById('workerV3Page'),arr=s.page==='partial'?s.partial:s.full;h.innerHTML=`<div class="worker-subpage"><h3>${s.page==='partial'?'Horarios parciales':'Horarios de jornada completa'}</h3><p>Introduzca entrada, salida, personas y días trabajados.</p>${arr.map((r,i)=>`<div class="registry-card worker-row"><div class="grid"><label>Hora de entrada<input data-v3-t="${s.page}" data-v3-i="${i}" data-v3-f="start" type="time" value="${esc(r.start)}"></label><label>Hora de salida<input data-v3-t="${s.page}" data-v3-i="${i}" data-v3-f="end" type="time" value="${esc(r.end)}"></label><label>Personas<input data-v3-t="${s.page}" data-v3-i="${i}" data-v3-f="people" type="number" min="0" step="1" value="${esc(r.people)}"></label><label>Días trabajados<button type="button" class="secondary" data-days-index="${i}">${esc(dayLabel(r))}</button></label></div><div class="worker-row-actions"><button type="button" class="secondary worker-delete" data-delete-index="${i}" aria-label="Eliminar este horario">Eliminar horario</button></div></div>`).join('')}</div>`;}
function renderResults(){const b=document.getElementById('workerV3Results');if(!b)return;const r=calculate();b.innerHTML=`<table><thead><tr><th>Turno</th><th>Entrada</th><th>Salida</th><th>Jornada completa</th><th>Horario parcial</th><th>Personas presentes</th><th>OP</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td>${x.name}</td><td>${esc(state().shifts[x.key].start)}</td><td>${esc(state().shifts[x.key].end)}</td><td>${x.fullPresent.toFixed(3)}</td><td>${x.partialPresent.toFixed(3)}</td><td><strong>${x.totalPresent.toFixed(3)}</strong></td><td>${x.op.toFixed(3)}</td></tr>`).join('')}</tbody></table><p><strong>A:</strong> ${r.A.toFixed(3)} · <strong>D:</strong> ${r.D.toFixed(3)} · <strong>OP:</strong> ${r.OP.toFixed(3)}</p>`;window.formData.op=r.OP;window.formData.opByShift={};window.formData.presenceByShift={};r.rows.forEach(x=>{window.formData.opByShift[x.key]=x.op;window.formData.presenceByShift[x.key]=x.totalPresent;});}
function bind(){document.querySelectorAll('[data-v3-page]').forEach(e=>e.onclick=()=>{saveInputs();state().page=e.dataset.v3Page;render();});document.querySelectorAll('[data-days-index]').forEach(e=>e.onclick=()=>openDaysDialog(Number(e.dataset.daysIndex)));document.querySelectorAll('[data-delete-index]').forEach(e=>e.onclick=()=>removeSchedule(Number(e.dataset.deleteIndex)));document.querySelectorAll('[data-preset]').forEach(e=>e.onclick=()=>applyPreset(e.dataset.preset));const d=document.getElementById('daysDialog');if(d){d.onclick=e=>{if(e.target.closest('[data-days-close]'))closeDaysDialog();if(e.target.closest('[data-days-save]'))saveDaysDialog();}}document.querySelectorAll('[data-v3-t]').forEach(e=>e.addEventListener('change',()=>{saveInputs();renderResults();}));}
window.WorkersScheduleV3={state,render,calculate,dayFactor};
})();
