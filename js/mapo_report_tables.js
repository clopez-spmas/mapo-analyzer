/* MAPO Analyzer — tablas para informe Word. Solo presentación; no modifica cálculos. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const n=v=>Number(v||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yn=v=>v===true?'Sí':v===false?'No':'';
const pct=v=>n(v).toFixed(1)+'%';
function data(){return typeof window.MAPOReportState==='function'?window.MAPOReportState():{form:{},result:{}};}
function rows(t){return t.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('');}
function table(title,heads,body){return '<div class="report-table-block"><h3>'+esc(title)+'</h3><table class="mapo-report-table"><thead><tr>'+heads.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table><button type="button" class="copy-report-table">Copiar tabla</button></div>';}
function taskRows(f){const all=[...(window.MAPO_TASKS||[]).map(x=>({...x,source:'MAPO'})),...(window.EXTRA_MAPO_TASKS||[]).map(x=>({...x,source:'Adicional'}))];const t=f.tasks||{};let out=[];all.forEach(x=>{Object.entries(t[x.id]||{}).forEach(([i,r])=>out.push([x.source,x.label,['Mañana','Tarde','Noche'][+i]||('Turno '+(+i+1)),n(r.tm),n(r.ta),n(r.pm),n(r.pa)]));});(f.customTasks||[]).forEach(x=>out.push(['Personalizada',x.name||'', '—',n(x.tm),n(x.ta),n(x.pm),n(x.pa)]));return out;}
function workerRows(f){const s=f.workerSchedule||{},out=[];const full=s.full||[],partial=s.partial||[];const shifts=['Mañana','Tarde','Noche'];
 full.filter(r=>r.start||r.end||r.people!==''||r.reference!=='').forEach((r,i)=>out.push(['Jornada completa',shifts[i]||r.shift||'',r.start||'',r.end||'',n(r.people),r.daysWorked?.selected?.join(', ')||r.days||'']));
 partial.filter(r=>r.start||r.end||r.people!==''||r.reference!=='').forEach((r,i)=>out.push(['Horario parcial',shifts[i]||r.shift||'',r.start||'',r.end||'',n(r.people),r.daysWorked?.selected?.join(', ')||r.days||'']));
 return out;}
function personnelRows(f){
 const s=f.workerSchedule||{};
 const full=s.full||[], partial=s.partial||[];
 const find=(arr,i)=>arr[i]||{};
 const out=[];
 const max=Math.max(3,full.length,partial.length);
 for(let i=0;i<max;i++){const r=find(full,i);const p=find(partial,i);out.push([shifts[i]||'',n(r.people),r.start&&r.end?(r.start+'-'+r.end):'',n(p.people),p.start&&p.end?(p.start+'-'+p.end):'',p.fraction!=null?n(p.fraction).toFixed(2):'']);}
 return out;
}
const shifts=['Mañana','Tarde','Noche'];
function personnelTable(f){
 const s=f.workerSchedule||{};
 const full=s.full||[], partial=s.partial||[];
 const get=(a,i)=>a[i]||{};
 const count=arr=>arr.reduce((z,r)=>z+n(r.people),0);
 const total=count(full)+count(partial);
 const auxEnf=f.auxEnfermeria??f.aux_enfermeria??f.auxEnfermeria??'';
 const auxGer=f.auxGeriatria??f.aux_geriatria??f.auxGeriatria??'';
 const limit=f.personalLimitacionMMP??f.personal_limitacion_mmp??f.limitacionMMP??'';
 let html='<div class="report-table-block personnel-report">';
 html+='<h3>1. ENTREVISTA</h3>';
 html+='<h4>1.1. Nº DE PERSONAS TRABAJADORAS QUE REALIZAN MMP:</h4>';
 html+='<p class="report-note"><strong>Número total de personas trabajadoras de planta.</strong></p>';
 html+='<table class="mapo-report-table personnel-summary"><tbody>';
 html+='<tr><th>Número total de personas trabajadoras de planta</th><td>'+esc(total)+'</td></tr>';
 html+='<tr><th>Aux. enfermería</th><td>'+esc(auxEnf)+'</td></tr>';
 html+='<tr><th>Aux. geriatría</th><td>'+esc(auxGer)+'</td></tr>';
 html+='<tr><th>Personal con limitación para MMP</th><td>'+esc(limit)+'</td></tr></tbody></table>';
 html+='<h4>1.1.1. Nº DE PERSONAS TRABAJADORAS QUE REALIZAN MMP DURANTE LOS 3 TURNOS:</h4>';
 html+='<p class="report-note"><strong>Número de personas trabajadoras presentes en toda la duración de cada turno.</strong></p>';
 html+='<table class="mapo-report-table personnel-shifts"><thead><tr><th>TURNO</th><th>Nº de personas trabajadoras/Turno (A)</th><th>Horario del turno</th></tr></thead><tbody>';
 for(let i=0;i<3;i++){const r=get(full,i);html+='<tr><td><strong>'+shifts[i]+'</strong></td><td>'+esc(r.people===''?'':n(r.people))+'</td><td>'+esc(r.start&&r.end?(r.start+'-'+r.end):'')+'</td></tr>';}
 html+='</tbody></table>';
 html+='<h4>1.1.2. Nº DE PERSONAS TRABAJADORAS QUE REALIZAN MMP A TIEMPO PARCIAL:</h4>';
 html+='<p class="report-note"><strong>Turno y horario de presencia.</strong><br>(En el caso de horarios diferentes por turno se añaden las filas siguientes tantas veces como sea necesario)</p>';
 html+='<table class="mapo-report-table personnel-partial"><thead><tr><th>TURNO</th><th>Nº de personas trabajadoras a tiempo parcial (B)</th><th>Horario de presencia</th><th>Fracción de unidad (C)</th></tr></thead><tbody>';
 for(let i=0;i<3;i++){const r=get(partial,i);let fraction=r.fraction;if(fraction==null&&r.start&&r.end){const m=x=>{const q=String(x).match(/^(\d{1,2})(?::(\d{2}))?$/);return q?Number(q[1])*60+Number(q[2]||0):NaN};const a=m(r.start),b=m(r.end);if(Number.isFinite(a)&&Number.isFinite(b)){let mins=b-a;if(mins<0)mins+=1440;fraction=mins/480;}}html+='<tr><td><strong>'+shifts[i]+'</strong></td><td>'+esc(r.people===''?'':n(r.people))+'</td><td>'+esc(r.start&&r.end?(r.start+'-'+r.end):'')+'</td><td>'+esc(fraction==null?'':n(fraction).toFixed(2))+'</td></tr>';}
 html+='</tbody></table></div>';return html;
}
function tableOrEmpty(title,heads,body){return table(title,heads,body||'<tr><td colspan="'+heads.length+'">Sin datos registrados</td></tr>');}
function build(key){const {form:f,result:r}=data(),t=r.taskTotals||{};switch(key){
case'general':return table('Datos generales',['Campo','Valor'],rows([['Hospital / empresa',f.empresa||''],['Sala / unidad',f.unidad||''],['Fecha de evaluación',f.fecha||''],['Código de sala',f.codigo||''],['Número de camas',n(f.camas)]]));
case'workers':return personnelTable(f);
case'patients':{const p=f.patientTypes||{},c=typeof window.getHospitalizacionPatientCounts==='function'?(()=>{try{return window.getHospitalizacionPatientCounts(f)}catch(e){return {nc:f.nc,pc:f.pc,na:f.na}}})():{};return table('Tipología de pacientes',['Dato','Valor'],rows([['Autónomos',n(p.autonomo)],['Colaboradores',n(p.colaborador)],['No colaboradores',n(p.noColaborador)],['Encamados',n(p.encamado)],['NC',n(c.nc)],['PC',n(c.pc)],['NA',n(c.na)]]));}
case'mobilizations':{const rr=taskRows(f);return tableOrEmpty('Movilizaciones',['Origen','Tarea','Turno','Total manual','Total con ayuda','Parcial manual','Parcial con ayuda'],rows(rr))+table('Totales de movilización',['Indicador','Valor'],rows([['ST',n(t.st)],['LTA',n(t.lta)],['% LTA',pct(t.pLTA)],['SP',n(t.sp)],['LPA',n(t.lpa)],['% LPA',pct(t.pLPA)],['STP',n(t.stp)]]));}
case'fs':return table('Factor de elevación (FS)',['Dato','Valor'],rows([['Elevadores suficientes',yn(f.fs_elevadores)],['Camillas regulables y ayudas asociadas suficientes',yn(f.fs_camillas)],['Camas regulables de 3 nodos para el 100%',yn(f.fs_camas3)],['Levantamientos totales con ayuda',n(f.fs_lta_total)],['Levantamientos totales evaluados',n(f.fs_st_total)],['FS calculado',r.fs==null?'':n(r.fs).toFixed(2)],['% LTA',pct(t.pLTA)]]));
case'fa':return table('Factor de ayudas menores (FA)',['Dato','Valor'],rows([['Sábana o tabla deslizante',yn(f.fa_sabana)],['Al menos dos ayudas menores adicionales',yn(f.fa_dos)],['Todas las camas regulables y de 3 nodos',yn(f.fa_camas3)],['Levantamientos parciales con ayuda',n(f.fa_lpa_total)],['Levantamientos parciales evaluados',n(f.fa_sp_total)],['FA calculado',r.fa==null?'':n(r.fa).toFixed(2)],['% LPA',pct(t.pLPA)]]));
case'wheelchairs':{let entries=[];if(f.wheelchairs&&f.wheelchairs.entries){entries=Object.entries(f.wheelchairs.entries).map(([id,x])=>({id,...x})).filter(x=>n(x.count)>0);}else entries=f.wheelchairTypes||[];const sc=x=>(x.brakes?0:1)+(x.arms?0:1)+(x.back?0:1)+(x.width?0:1),rr=entries.map((x,i)=>[i+1,x.name||x.description||'',n(x.count??x.units),yn(x.brakes),yn(x.arms),yn(x.back),yn(x.width),sc(x)]);const total=entries.reduce((s,x)=>s+n(x.count??x.units),0),points=entries.reduce((s,x)=>s+n(x.count??x.units)*sc(x),0),pmsr=total?points/total:0;return tableOrEmpty('Sillas de ruedas — FC',['Tipo','Descripción','Unidades','Frenos','Reposabrazos','Respaldo','Anchura','Puntuación'],rows(rr))+table('Resultados FC',['Indicador','Valor'],rows([['Total sillas utilizables',total],['PMSR',pmsr.toFixed(2)],['NA',n(f.na)],['Criterio de suficiencia (≥50% NA)',Math.ceil(n(f.na)*.5)],['Suficiencia',total>=n(f.na)*.5?'Sí':'No'],['FC',r.fc==null?'Pendiente':n(r.fc).toFixed(2)]]));}
case'bathrooms':{const bf=[['space','Espacio insuficiente para el uso de ayudas',2],['door','Anchura puerta <85 cm',1],['obstacles','Obstáculos fijos',1]],wf=[['space','Espacio insuficiente para silla de ruedas',2],['height','Altura WC inadecuada',1],['bar','Barra lateral ausente/inadecuada',1],['door','Anchura puerta <85 cm',1],['lateral','Espacio lateral WC-pared <80 cm',1]],score=(x,fs)=>fs.reduce((s,z)=>s+(x[z[0]]===true?z[2]:0),0),br=(f.bathTypes||[]).map((x,i)=>[i+1,x.description||'',n(x.units),score(x,bf),yn(x.space),yn(x.door),yn(x.obstacles),x.doorInward||'',x.fixtures||'']),wr=(f.wcTypes||[]).map((x,i)=>[i+1,x.description||'',n(x.units),score(x,wf),yn(x.space),yn(x.height),yn(x.bar),yn(x.door),yn(x.lateral),x.doorInward||'']);return tableOrEmpty('Baños para higiene — PMB',['Tipo','Descripción','Unidades','Puntuación','Espacio','Puerta','Obstáculos','Apertura interior','Ducha/bañera fija'],rows(br))+tableOrEmpty('Baños con WC — PMWC',['Tipo','Descripción','Unidades','Puntuación','Espacio','Altura WC','Barra','Puerta','Lateral','Apertura interior'],rows(wr))+table('Resultados de baños',['Indicador','Valor'],rows([['PMB',r.details?.pmB==null?'':n(r.details.pmB).toFixed(2)],['PMWC',r.details?.pmWC==null?'':n(r.details.pmWC).toFixed(2)]]));}
case'rooms':{const fs=[['between','Espacio cama-cama/cama-pared <90 cm',2],['foot','Espacio libre pies de cama <120 cm',2],['bedSection','Cama inadecuada',1],['underbed','Espacio cama-suelo <15 cm',2],['chairHeight','Asiento sillón <50 cm',.5]],rr=(f.roomTypes||[]).map((x,i)=>[i+1,x.description||'',n(x.units),fs.reduce((s,z)=>s+(x[z[0]]===true?z[2]:0),0),yn(x.between),yn(x.foot),yn(x.bedSection),yn(x.underbed),yn(x.chairHeight),x.observations||'',x.bedHeight??'',x.sideRails||'',x.doorWidth??'',x.noWheels||'']);return tableOrEmpty('Habitaciones — PMH',['Tipo','Descripción','Unidades','Puntuación','Espacio lateral','Espacio pies','Cama inadecuada','Espacio cama-suelo','Altura sillón','Observaciones','Altura cama','Barras laterales','Anchura puerta','Sin ruedas'],rows(rr))+table('Resultado PMH',['Indicador','Valor'],rows([['PMH',r.details?.pmH==null?'':n(r.details.pmH).toFixed(2)]]));}
case'formation':return table('Factor de formación (FF)',['Dato','Valor'],rows([['Curso teórico-práctico ≥6 h',yn(f.ff_curso)],['Cobertura de formación',n(f.ff_cobertura)+'%'],['Formación <2 años',yn(f.ff_antiguedad)],['Eficacia verificada',yn(f.ff_eficacia)],['Información/adiestramiento',yn(f.ff_informacion)],['FF calculado',r.ff==null?'':n(r.ff).toFixed(2)]]));
case'factors':return table('Resultado MAPO y factores',['Indicador','Valor'],rows([['MAPO',r.mapo==null?'':n(r.mapo).toFixed(2)],['Nivel de exposición',r.nivel||''],['FS',r.fs==null?'':n(r.fs).toFixed(2)],['FA',r.fa==null?'':n(r.fa).toFixed(2)],['FC',r.fc==null?'Pendiente':n(r.fc).toFixed(2)],['Famb',r.famb==null?'Pendiente':n(r.famb).toFixed(2)],['FF',r.ff==null?'':n(r.ff).toFixed(2)],['PMamb',r.details?.pmamb==null?'Pendiente':n(r.details.pmamb).toFixed(2)]]));
default:return '<p>Tabla no disponible.</p>';}}
function render(){const host=$('reportTables');if(!host)return;const checks=[...document.querySelectorAll('[data-report-table]')].filter(x=>x.checked);host.innerHTML=checks.map(x=>build(x.dataset.reportTable)).join('')||'<p class="report-tables-empty">Seleccione al menos una tabla.</p>';host.querySelectorAll('.copy-report-table').forEach(btn=>btn.onclick=()=>{const t=btn.previousElementSibling;navigator.clipboard?.writeText(t.innerText).catch(()=>{const rg=document.createRange();rg.selectNode(t);const s=getSelection();s.removeAllRanges();s.addRange(rg);document.execCommand('copy');s.removeAllRanges();});});}
function init(){const result=$('result');if(!result)return;const section=document.createElement('section');section.id='reportTablesPanel';section.className='card';section.hidden=true;section.innerHTML='<div class="section-heading"><div><h2>Tablas para informe Word</h2><p>Seleccione las tablas que desea preparar y cópielas directamente en Word.</p></div></div><div class="report-table-selectors">'+[['general','Datos generales'],['workers','Personas trabajadoras y horarios'],['patients','Tipología de pacientes'],['mobilizations','Movilizaciones'],['fs','Factor de elevación (FS)'],['fa','Factor de ayudas menores (FA)'],['wheelchairs','Sillas de ruedas (FC)'],['bathrooms','Baños — PMB y PMWC'],['rooms','Habitaciones — PMH'],['formation','Formación (FF)'],['factors','Resultado MAPO y factores']].map(([k,l])=>'<label><input type="checkbox" data-report-table="'+k+'"> '+l+'</label>').join('')+'</div><div class="actions"><button type="button" id="generateReportTables">Generar tablas</button><button type="button" id="copyAllReportTables" class="secondary">Copiar todas las tablas</button></div><div id="reportTables"></div>';result.parentNode.insertBefore(section,result.nextSibling);const actions=result.querySelector('.actions');const b=document.createElement('button');b.type='button';b.id='openReportTables';b.className='secondary';b.textContent='Crear tablas para informe Word';actions.appendChild(b);b.onclick=()=>{section.hidden=false;section.scrollIntoView({behavior:'smooth'});};$('generateReportTables').onclick=render;$('copyAllReportTables').onclick=()=>{render();};}
document.addEventListener('DOMContentLoaded',init);window.MAPOReportTables={render,build};
})();