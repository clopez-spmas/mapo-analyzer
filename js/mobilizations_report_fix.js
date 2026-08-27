/* MAPO Analyzer — corrige la tabla de movilizaciones del informe.
   Solo adapta la presentación; no modifica cálculos. */
(function(){
'use strict';
const shifts=['Mañana','Tarde','Noche'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(v||0);
function rows(){
 const f=window.formData||{},d=f.mobilizations||{},entries=d.entries||{},custom=Array.isArray(d.custom)?d.custom:[];
 const catalog=Array.isArray(window.HOSPITALIZATION_MOBILIZATIONS)?window.HOSPITALIZATION_MOBILIZATIONS:[];
 const items=[...catalog,...custom.map(x=>({id:x.id,name:x.name||'',source:'Personalizada'}))],out=[];
 items.forEach(item=>{const e=entries[item.id];if(!e)return;for(let i=0;i<3;i++){
   const tm=n(e.manualTotal?.[i]),ta=n(e.aidedTotal?.[i]),pm=n(e.manualPartial?.[i]),pa=n(e.aidedPartial?.[i]);
   if(tm||ta||pm||pa)out.push([item.source==='Complementaria'?'Adicional':(item.source||'MAPO'),item.name,shifts[i],tm,ta,pm,pa]);
 }});return out;
}
function render(){
 const host=document.getElementById('reportTables');if(!host)return;
 const heading=[...host.querySelectorAll('h3')].find(h=>h.textContent.trim()==='Movilizaciones');if(!heading)return;
 const table=heading.closest('.report-table-block')?.querySelector('.mapo-report-table');if(!table)return;
 const body=rows(),tbody=table.tBodies[0]||table.createTBody();
 const html=body.length?body.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="7">Sin datos registrados</td></tr>';
 if(tbody.innerHTML!==html)tbody.innerHTML=html;
}
function init(){
 if(!document.getElementById('reportTables'))return;
 document.addEventListener('click',e=>{if(e.target.closest('#generateReportTables,#openReportTables'))setTimeout(render,0);},true);
 window.MAPOMobilizationsReportFix={render};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
