/* MAPO Analyzer — tablas para informe Word.
   Responsabilidad única: construir/renderizar/copiar tablas.
   No calcula MAPO ni modifica los datos de evaluación. */
(function(){
'use strict';
const $=id=>document.getElementById(id),n=v=>Number(v||0),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shifts=['Mañana','Tarde','Noche'];
const pct=v=>n(v).toFixed(1)+'%';
function data(){return typeof window.MAPOReportState==='function'?window.MAPOReportState():{form:{},result:{}};}
function rows(a){return a.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('');}
function table(title,heads,body){return '<div class="report-table-block"><h3>'+esc(title)+'</h3><table class="mapo-report-table"><thead><tr>'+heads.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table><div class="report-table-actions"><button type="button" class="copy-report-table">Copiar tabla para Word</button></div></div>';}
/* ÚNICA fuente de datos para la tabla de movilizaciones. Solo lectura. */
function mobilizationRows(f){
 const d=f.mobilizations||{},entries=d.entries&&typeof d.entries==='object'?d.entries:{};
 const custom=Array.isArray(d.custom)?d.custom:[],catalog=Array.isArray(window.HOSPITALIZATION_MOBILIZATIONS)?window.HOSPITALIZATION_MOBILIZATIONS:[];
 const items=catalog.concat(custom.map(x=>({id:x.id,name:x.name||'',source:'Personalizada'}))),out=[];
 items.forEach(item=>{const e=entries[item.id];if(!e)return;for(let i=0;i<3;i++){
  const tm=n(e.manualTotal&&e.manualTotal[i]),ta=n(e.aidedTotal&&e.aidedTotal[i]),pm=n(e.manualPartial&&e.manualPartial[i]),pa=n(e.aidedPartial&&e.aidedPartial[i]);
  if(tm||ta||pm||pa)out.push([item.source==='Complementaria'?'Adicional':(item.source||'MAPO'),item.name||'',shifts[i],tm,ta,pm,pa]);
 }});return out;
}
function build(key){const {form:f,result:r}=data(),t=r.taskTotals||{};switch(key){
case'general':return table('Datos generales',['Campo','Valor'],rows([['Hospital / empresa',f.empresa||''],['Sala / unidad',f.unidad||''],['Fecha de evaluación',f.fecha||''],['Código de sala',f.codigo||''],['Número de camas',n(f.camas)]]));
case'patients':{const p=f.patientTypes||{};return table('Tipología de pacientes',['Dato','Valor'],rows([['AUTÓNOMOS',n(p.autonomo)],['COLABORADORES',n(p.colaborador)],['NO COLABORADORES',n(p.noColaborador)],['ENCAMADOS',n(p.encamado)],['NC',n(f.nc)],['PC',n(f.pc)],['NA',n(f.na)]]));}
case'mobilizations':{const mr=mobilizationRows(f);return table('Movilizaciones',['Origen','Tarea','Turno','Total manual','Total con ayuda','Parcial manual','Parcial con ayuda'],mr.length?rows(mr):'<tr><td colspan="7">Sin datos registrados</td></tr>')+table('Totales de movilización',['Indicador','Valor'],rows([['ST',n(t.st)],['LTA',n(t.lta)],['% LTA',pct(t.pLTA)],['SP',n(t.sp)],['LPA',n(t.lpa)],['% LPA',pct(t.pLPA)],['STP',n(t.stp)]]));}
case'fs':return table('Factor de elevación (FS)',['Dato','Valor'],rows([['FS calculado',r.fs==null?'':n(r.fs).toFixed(2)],['% LTA',pct(t.pLTA)]]));
case'fa':return table('Factor de ayudas menores (FA)',['Dato','Valor'],rows([['FA calculado',r.fa==null?'':n(r.fa).toFixed(2)],['% LPA',pct(t.pLPA)]]));
default:return '<p>Tabla no disponible.</p>';}}
function render(){const host=$('reportTables');if(!host)return;const checks=Array.from(document.querySelectorAll('[data-report-table]')).filter(x=>x.checked);host.innerHTML=checks.map(x=>build(x.dataset.reportTable)).join('')||'<p class="report-tables-empty">Seleccione al menos una tabla.</p>';host.querySelectorAll('.copy-report-table').forEach(b=>{b.onclick=()=>copyTable(b);});}
async function copyTable(btn){const t=btn.closest('.report-table-block')?.querySelector('.mapo-report-table');if(!t)return;const text=t.innerText;try{await navigator.clipboard.writeText(text);}catch(_){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}const old=btn.textContent;btn.textContent='✓ Tabla copiada';setTimeout(()=>btn.textContent=old,1800);}
function init(){const result=$('result');if(!result)return;let section=$('reportTablesPanel');if(!section){section=document.createElement('section');section.id='reportTablesPanel';section.className='card';section.hidden=true;section.innerHTML='<div class="section-heading"><h2>Tablas para informe Word</h2></div><div class="report-table-selectors">'+[['general','Datos generales'],['patients','Tipología de pacientes'],['mobilizations','Movilizaciones'],['fs','Factor de elevación (FS)'],['fa','Factor de ayudas menores (FA)']].map(d=>'<label><input type="checkbox" data-report-table="'+d[0]+'"> '+d[1]+'</label>').join('')+'</div><div class="actions"><button type="button" id="generateReportTables">Generar tablas</button></div><div id="reportTables"></div>';result.parentNode.insertBefore(section,result.nextSibling);}
const g=$('generateReportTables');if(g&&!g.dataset.bound){g.dataset.bound='1';g.onclick=render;}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOReportTables=Object.freeze({render,build});
})();
