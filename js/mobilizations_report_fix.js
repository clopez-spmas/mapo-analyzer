/* MAPO Analyzer — corrige la tabla de movilizaciones del informe.
   La pantalla de movilizaciones guarda los registros en formData.mobilizations,
   mientras que la tabla histórica del informe esperaba formData.tasks.
   Solo adapta la presentación del informe; no modifica ningún cálculo. */
(function(){
'use strict';
const shifts=['Mañana','Tarde','Noche'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(v||0);
function sourceName(item){return item.source==='Complementaria'?'Adicional':(item.source||'MAPO');}
function getData(){
  const f=window.formData||{};
  if(typeof window.mobilizationTotals==='function'){
    try{window.mobilizationTotals();}catch(_){ }
  }
  return f.mobilizations||{entries:{},custom:[]};
}
function rows(){
  const d=getData(), entries=d.entries||{}, custom=Array.isArray(d.custom)?d.custom:[];
  const catalog=Array.isArray(window.HOSPITALIZATION_MOBILIZATIONS)?window.HOSPITALIZATION_MOBILIZATIONS:[];
  const items=[...catalog,...custom.map(x=>({id:x.id,name:x.name||'',source:'Personalizada'}))];
  const out=[];
  items.forEach(item=>{
    const e=entries[item.id];
    if(!e)return;
    for(let i=0;i<3;i++){
      const tm=n(e.manualTotal?.[i]), ta=n(e.aidedTotal?.[i]), pm=n(e.manualPartial?.[i]), pa=n(e.aidedPartial?.[i]);
      if(tm||ta||pm||pa)out.push([sourceName(item),item.name,shifts[i],tm,ta,pm,pa]);
    }
  });
  return out;
}
function render(){
  const host=document.getElementById('reportTables');
  if(!host)return;
  const heading=[...host.querySelectorAll('h3')].find(h=>h.textContent.trim()==='Movilizaciones');
  if(!heading)return;
  const block=heading.closest('.report-table-block');
  if(!block)return;
  const table=block.querySelector('.mapo-report-table');
  if(!table)return;
  const body=rows();
  const tbody=table.tBodies[0]||table.createTBody();
  tbody.innerHTML=body.length?body.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="7">Sin datos registrados</td></tr>';
}
function init(){
  const host=document.getElementById('reportTables');
  if(!host)return;
  new MutationObserver(()=>render()).observe(host,{childList:true,subtree:true});
  render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MAPOMobilizationsReportFix={render};
})();
